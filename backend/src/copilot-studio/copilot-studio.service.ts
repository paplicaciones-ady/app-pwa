import { Injectable, UnauthorizedException, InternalServerErrorException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CopilotStudioClient, ConnectionSettings } from '@microsoft/agents-copilotstudio-client';
import { Activity, ActivityTypes } from '@microsoft/agents-activity';
import { MicrosoftAuthService } from '../microsoft-auth/microsoft-auth.service';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Session {
  conversationId: string;
  userId: number;
  lastUsedAt: number;
}

interface CollectResult {
  text: string;
  hasPlanEvents: boolean;
  streamingText: string;
}

@Injectable()
export class CopilotStudioService implements OnModuleDestroy {
  private readonly environmentId: string;
  private readonly agentIdentifier: string;
  private readonly sessions = new Map<string, Session>();
  private readonly SESSION_TTL = 15 * 60 * 1000;
  private cleanupTimer: ReturnType<typeof setInterval>;
  private readonly conversationLogger: ConversationLogger;

  constructor(
    config: ConfigService,
    private readonly microsoftAuthService: MicrosoftAuthService,
  ) {
    this.environmentId = config.getOrThrow<string>('COPILOTSTUDIOAGENT__ENVIRONMENTID');
    this.agentIdentifier = config.getOrThrow<string>('COPILOTSTUDIOAGENT__SCHEMANAME');
    this.cleanupTimer = setInterval(() => this.cleanupSessions(), 60_000);
    this.conversationLogger = new ConversationLogger('logs/conversations');

    console.log(`${logTimestamp()} [INFO] CopilotStudioService.constructor: Initialized`);
    console.log(`${logTimestamp()} [INFO] CopilotStudioService.constructor: environmentId=${this.environmentId}`);
    console.log(`${logTimestamp()} [INFO] CopilotStudioService.constructor: agentIdentifier=${this.agentIdentifier}`);
    console.log(`${logTimestamp()} [INFO] CopilotStudioService.constructor: SESSION_TTL=${this.SESSION_TTL}ms`);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  async sendMessage(
    userId: number,
    text: string,
    sessionId?: string,
  ): Promise<{ reply: string; sessionId: string }> {
    const ppToken = await this.microsoftAuthService.getPowerPlatformToken(userId);
    if (!ppToken) {
      throw new UnauthorizedException('No hay sesión de Microsoft activa');
    }

    let session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!session) {
      if (sessionId) {
        this.conversationLogger.forUser(userId).log('sendMessage', 'SessionId no encontrado, creando nueva', { sessionId });
      }
      session = await this.createSession(ppToken.token, userId);
      this.sessions.set(session.conversationId, session);
    }
    session.lastUsedAt = Date.now();

    const convLog = this.conversationLogger.forUser(userId, session.conversationId);

    convLog.log('sendMessage', 'Inicio', { textPreview: text.slice(0, 100), conversationId: session.conversationId });
    convLog.log('sendMessage', 'PowerPlatform token obtenido', {
      tokenPreview: ppToken.preview,
      tokenOid: ppToken.tokenOid,
      tokenUpn: ppToken.tokenUpn,
    });

    convLog.log('sendMessage', 'Creando CopilotStudioClient fresco para el mensaje');
    const client = new CopilotStudioClient(
      { environmentId: this.environmentId, agentIdentifier: this.agentIdentifier, useExperimentalEndpoint: true } as ConnectionSettings,
      ppToken.token,
    );

    const activity = new Activity('message');
    activity.text = text;
    activity.conversation = { id: session.conversationId };

    convLog.log('sendMessage', 'Enviando actividad con executeStreaming', {
      textPreview: text.slice(0, 100),
      conversationId: session.conversationId,
    });

    let { text: replyText, hasPlanEvents, streamingText } = await this.collectReplies(
      client.executeStreaming(activity, session.conversationId),
      convLog,
    );

    let finalText = streamingText || replyText || '';

    if (!finalText && hasPlanEvents) {
      convLog.log('sendMessage', 'Plan detectado sin reply final, esperando 15s y re-asking');
      await new Promise(r => setTimeout(r, 15_000));

      try {
        const activity2 = new Activity('message');
        activity2.text = text;
        activity2.conversation = { id: session.conversationId };
        const retry = await this.collectReplies(
          client.executeStreaming(activity2, session.conversationId),
          convLog,
        );
        finalText = retry.streamingText || retry.text || '';
        convLog.log('sendMessage', 'Re-ask completado', { replyPreview: finalText.slice(0, 200) });
      } catch (err: any) {
        convLog.log('sendMessage', 'Re-ask falló', { error: err.message });
      }
    }

    convLog.log('sendMessage', 'Respuesta final', {
      replyPreview: finalText.slice(0, 200),
    });

    return {
      reply: finalText,
      sessionId: session.conversationId,
    };
  }

  private async createSession(token: string, userId: number): Promise<Session> {
    const client = new CopilotStudioClient(
      { environmentId: this.environmentId, agentIdentifier: this.agentIdentifier, useExperimentalEndpoint: true } as ConnectionSettings,
      token,
    );

    const response = await client.startConversationWithResponse(true);

    if (!response.conversationId) {
      throw new InternalServerErrorException('No se obtuvo conversationId del agente');
    }

    return { conversationId: response.conversationId, userId, lastUsedAt: Date.now() };
  }

  async createNewSession(userId: number): Promise<{ sessionId: string; welcome: string }> {
    const ppToken = await this.microsoftAuthService.getPowerPlatformToken(userId);
    if (!ppToken) {
      throw new UnauthorizedException('No hay sesión de Microsoft activa');
    }

    const client = new CopilotStudioClient(
      { environmentId: this.environmentId, agentIdentifier: this.agentIdentifier, useExperimentalEndpoint: true } as ConnectionSettings,
      ppToken.token,
    );

    const response = await client.startConversationWithResponse(true);

    if (!response.conversationId) {
      throw new InternalServerErrorException('No se obtuvo conversationId del agente');
    }

    const session: Session = {
      conversationId: response.conversationId,
      userId,
      lastUsedAt: Date.now(),
    };
    this.sessions.set(session.conversationId, session);

    const welcome = response.activities.find(
      a => a.type === ActivityTypes.Message && a.text,
    )?.text ?? '';

    return { sessionId: session.conversationId, welcome };
  }

  private async collectReplies(
    iterable: AsyncIterable<Activity>,
    convLog: ConversationLog,
  ): Promise<CollectResult> {
    let text = '';
    let streamingText = '';
    let hasPlanEvents = false;
    let activityCount = 0;

    for await (const activity of iterable) {
      activityCount++;

      const isStreamingTyping =
        activity.type === ActivityTypes.Typing
        && activity.channelData
        && typeof activity.channelData === 'object'
        && (activity.channelData as any).streamType === 'streaming';

      convLog.log('collectReplies', `Actividad #${activityCount}`, {
        type: activity.type,
        textPreview: activity.text ? activity.text.slice(0, 200) : null,
        name: activity.name ?? null,
        conversationId: activity.conversation?.id ?? null,
        streamingTyping: isStreamingTyping || undefined,
        timestamp: activity.timestamp ?? null,
      });

      if (activity.type === ActivityTypes.EndOfConversation) {
        convLog.log('collectReplies', 'Fin de conversación (EndOfConversation)', {
          textPreview: activity.text ? activity.text.slice(0, 200) : null,
        });
        if (activity.text) text = activity.text;
        break;
      }

      if (activity.type === ActivityTypes.Message && activity.text) {
        text = activity.text;
      }

      if (isStreamingTyping && activity.text) {
        streamingText = (streamingText || '') + activity.text;
      }

      if (activity.name && activity.name.includes('DynamicPlan')) {
        hasPlanEvents = true;
      }
    }

    convLog.log('collectReplies', 'Recolección completada', {
      totalActivities: activityCount,
      finalTextPreview: text.slice(0, 200),
      streamingTextPreview: streamingText.slice(0, 200),
      hasPlanEvents,
    });

    return { text, hasPlanEvents, streamingText };
  }

  async clearSession(userId: number): Promise<void> {
    for (const [convId, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(convId);
      }
    }
  }

  private cleanupSessions(): void {
    const now = Date.now();
    for (const [convId, session] of this.sessions) {
      if (now - session.lastUsedAt > this.SESSION_TTL) {
        this.sessions.delete(convId);
      }
    }
  }
}

function logTimestamp(): string {
  const d = new Date();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${d.getFullYear()}-${M}-${day} ${h}:${m}:${s},${ms}`;
}

class ConversationLog {
  private readonly stream: fs.WriteStream;

  constructor(filePath: string) {
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
  }

  log(method: string, message: string, details?: Record<string, unknown>): void {
    const ts = logTimestamp();
    let line = `${ts} [INFO] CopilotStudioService.${method}: ${message}`;
    if (details) {
      line += ' ' + JSON.stringify(details);
    }
    this.stream.write(line + '\n');
  }

  close(): void {
    this.stream.end();
  }
}

class ConversationLogger {
  private readonly baseDir: string;
  private readonly logs = new Map<string, ConversationLog>();

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  forUser(userId: number, conversationId?: string): ConversationLog {
    const key = conversationId
      ? `${userId}-${conversationId}`
      : `${userId}-pending`;

    let log = this.logs.get(key);
    if (log) return log;

    const safeConvId = (conversationId ?? 'new').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `conversation-${userId}-${safeConvId}.log`;
    const filePath = path.join(this.baseDir, fileName);

    log = new ConversationLog(filePath);
    this.logs.set(key, log);
    return log;
  }
}
