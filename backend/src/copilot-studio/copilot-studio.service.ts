import { Injectable, UnauthorizedException, InternalServerErrorException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CopilotStudioClient, ConnectionSettings, getCopilotStudioSubscribeUrl } from '@microsoft/agents-copilotstudio-client';
import { Activity, ActivityTypes } from '@microsoft/agents-activity';
import { MicrosoftAuthService } from '../microsoft-auth/microsoft-auth.service';
import { appLogger } from '../utils/app-logger';
import * as jwt from 'jsonwebtoken';
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
  consentCard: boolean;
  consentActionData: unknown;
  consentCardText: string;
  connectionManagerCard: boolean;
  connectionCardText: string;
  adaptiveCard: any | null;
  suggestedActions: { title: string; value?: any }[] | null;
  oauthCard: any | null;
}

interface SubmitAction {
  title: string;
  data: unknown;
}

@Injectable()
export class CopilotStudioService implements OnModuleDestroy {
  private readonly environmentId: string;
  private readonly agentIdentifier: string;
  private readonly sessions = new Map<string, Session>();
  private readonly SESSION_TTL = 60 * 60 * 1000;
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

    appLogger.log('CopilotStudio', 'constructor', 'Initialized');
    appLogger.log('CopilotStudio', 'constructor', 'environmentId', { value: this.environmentId });
    appLogger.log('CopilotStudio', 'constructor', 'agentIdentifier', { value: this.agentIdentifier });
    appLogger.log('CopilotStudio', 'constructor', 'SESSION_TTL', { value: this.SESSION_TTL });
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  private applyIdentity(activity: Activity, tokenOid: string | null, tokenUpn: string | null): void {
    if (!tokenOid || !tokenUpn) return;
    activity.from = {
      id: tokenUpn,
      name: tokenUpn,
      aadObjectId: tokenOid,
      role: 'user',
    };
    activity.recipient = {
      id: this.agentIdentifier,
      role: 'bot',
    };
  }

  async sendMessage(
    userId: number,
    text: string,
    sessionId?: string,
    value?: any,
  ): Promise<{ reply: string; sessionId: string; card?: any; suggestedActions?: { title: string; value?: any }[] }> {
    appLogger.log('CopilotStudio', 'sendMessage', 'Inicio', { userId, textPreview: text.slice(0, 80), hasValue: value !== undefined, sessionId: sessionId ?? null });

    const ppToken = await this.microsoftAuthService.getPowerPlatformToken(userId);
    if (!ppToken) {
      appLogger.log('CopilotStudio', 'sendMessage', 'getPowerPlatformToken devolvió null', { userId });
      throw new UnauthorizedException('No hay sesión de Microsoft activa');
    }
    appLogger.log('CopilotStudio', 'sendMessage', 'PP token obtenido', { userId, oid: ppToken.tokenOid, upn: ppToken.tokenUpn });

    const decodedToken = jwt.decode(ppToken.token) as Record<string, any> | null;
    appLogger.log('CopilotStudio', 'sendMessage', 'PP Token claims', {
      aud: decodedToken?.aud,
      scp: decodedToken?.scp,
      oid: decodedToken?.oid,
      upn: decodedToken?.upn,
      iss: decodedToken?.iss,
      exp: decodedToken?.exp ? new Date(decodedToken.exp * 1000).toISOString() : null,
      nbf: decodedToken?.nbf ? new Date(decodedToken.nbf * 1000).toISOString() : null,
    });

    let session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!session) {
      if (sessionId) {
        this.conversationLogger.forUser(userId).log('sendMessage', 'SessionId no encontrado, creando nueva', { sessionId });
        appLogger.log('CopilotStudio', 'sendMessage', 'SessionId recibido pero no encontrado en Map, creando nueva', { userId, sessionId });
      }
      session = await this.createSession(ppToken.token, userId);
      this.sessions.set(session.conversationId, session);
      appLogger.log('CopilotStudio', 'sendMessage', 'Nueva conversación creada', { userId, conversationId: session.conversationId });
    } else {
      appLogger.log('CopilotStudio', 'sendMessage', 'Conversación existente reutilizada', { userId, conversationId: session.conversationId });
    }
    session.lastUsedAt = Date.now();

    const convLog = this.conversationLogger.forUser(userId, session.conversationId);

    convLog.log('sendMessage', 'Inicio', { textPreview: text.slice(0, 100), hasValue: value !== undefined, conversationId: session.conversationId });
    convLog.log('sendMessage', 'PowerPlatform token obtenido', {
      tokenPreview: ppToken.preview,
      tokenOid: ppToken.tokenOid,
      tokenUpn: ppToken.tokenUpn,
    });

    convLog.log('sendMessage', 'Creando CopilotStudioClient fresco para el mensaje');
    const settings = { environmentId: this.environmentId, agentIdentifier: this.agentIdentifier, useExperimentalEndpoint: true } as ConnectionSettings;
    convLog.log('sendMessage', 'ConnectionSettings', {
      environmentId: this.environmentId,
      agentIdentifier: this.agentIdentifier,
      useExperimentalEndpoint: true,
    });
    const client = new CopilotStudioClient(settings, ppToken.token);

    const activity = new Activity('message');
    if (value !== undefined) {
      activity.value = value;
    } else {
      activity.text = text;
    }
    activity.conversation = { id: session.conversationId };
    this.applyIdentity(activity, ppToken.tokenOid, ppToken.tokenUpn);

    convLog.log('sendMessage', 'Activity completa a enviar', {
      type: activity.type,
      textPreview: activity.text ? activity.text.slice(0, 200) : null,
      from: activity.from ?? null,
      recipient: activity.recipient ?? null,
      conversation: activity.conversation,
      hasValue: activity.value !== undefined,
      hasAttachments: !!activity.attachments?.length,
    });

    let replyResult;
    try {
      replyResult = await this.collectReplies(
        client.executeStreaming(activity, session.conversationId),
        convLog,
      );
    } catch (err: any) {
      convLog.log('sendMessage', 'ERROR en executeStreaming', {
        message: err.message,
        status: err.status,
        statusText: err.statusText,
        url: err.url,
        body: typeof err.body === 'string' ? err.body.slice(0, 500) : null,
      });
      throw err;
    }

    let { text: replyText, hasPlanEvents, streamingText, consentCard, consentActionData, consentCardText, connectionManagerCard, connectionCardText, adaptiveCard, suggestedActions, oauthCard } = replyResult;

    let finalText = streamingText || replyText || '';

    if (!finalText && hasPlanEvents) {
      convLog.log('sendMessage', 'Plan detectado sin reply final, intentando subscribe POST');
      const subscribeReply = await this.subscribeForReply(client, settings, session.conversationId, convLog);
      if (subscribeReply) {
        finalText = subscribeReply;
        convLog.log('sendMessage', 'Subscribe POST exitoso', { replyPreview: finalText.slice(0, 200) });
      } else {
        convLog.log('sendMessage', 'Subscribe POST no dio reply, fallback a re-ask en 5s');
        await new Promise(r => setTimeout(r, 5_000));

        try {
          const activity2 = new Activity('message');
          if (value !== undefined) {
            activity2.value = value;
          } else {
            activity2.text = text;
          }
          activity2.conversation = { id: session.conversationId };
          this.applyIdentity(activity2, ppToken.tokenOid, ppToken.tokenUpn);
          const retry = await this.collectReplies(
            client.executeStreaming(activity2, session.conversationId),
            convLog,
          );
          finalText = retry.streamingText || retry.text || '';
          if (!finalText && retry.adaptiveCard) {
            adaptiveCard = retry.adaptiveCard;
          }
          convLog.log('sendMessage', 'Re-ask completado', { replyPreview: finalText.slice(0, 200), hasCard: !!retry.adaptiveCard });
        } catch (err: any) {
          convLog.log('sendMessage', 'Re-ask falló', {
            message: err.message,
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            body: typeof err.body === 'string' ? err.body.slice(0, 500) : null,
          });
        }
      }
    }

    if (!finalText && consentCard) {
      convLog.log('sendMessage', 'Consent card detectada, enviando auto-consent Allow');
      const consentActivity = new Activity(ActivityTypes.Message);

      const isConnectorConsent = consentCardText.includes('Conectar para continuar');
      if (isConnectorConsent) {
        consentActivity.value = { action: 'Allow', id: 'submit', shouldAwaitUserInput: true };
      } else {
        consentActivity.value = consentActionData ?? { action: 'Allow', id: 'submit', shouldAwaitUserInput: true };
      }
      convLog.log('sendMessage', 'Consent value seleccionado', {
        isConnectorConsent,
        consentActionData,
        consentCardText,
      });
      consentActivity.conversation = { id: session.conversationId };
      this.applyIdentity(consentActivity, ppToken.tokenOid, ppToken.tokenUpn);

      try {
        const consentResponse = await client.executeWithResponse(consentActivity, session.conversationId);
        const consentText = consentResponse.activities.find(
          a => a.type === ActivityTypes.Message && a.text,
        )?.text || '';
        if (consentText) {
          finalText = consentText;
          convLog.log('sendMessage', 'Auto-consent Allow exitoso', { replyPreview: finalText.slice(0, 200) });
        } else {
          convLog.log('sendMessage', 'Auto-consent no devolvió texto, re-preguntando');
          const activity3 = new Activity('message');
          if (value !== undefined) {
            activity3.value = value;
          } else {
            activity3.text = text;
          }
          activity3.conversation = { id: session.conversationId };
          this.applyIdentity(activity3, ppToken.tokenOid, ppToken.tokenUpn);
          const retry = await this.collectReplies(
            client.executeStreaming(activity3, session.conversationId),
            convLog,
          );
          finalText = retry.streamingText || retry.text || '';
          if (!finalText && retry.connectionManagerCard) {
            connectionManagerCard = true;
            connectionCardText = retry.connectionCardText;
          }
          if (!finalText && retry.adaptiveCard) {
            adaptiveCard = retry.adaptiveCard;
          }
          convLog.log('sendMessage', 'Re-ask post-consent completado', { replyPreview: finalText.slice(0, 200), hasCard: !!retry.adaptiveCard });
        }
      } catch (err: any) {
        convLog.log('sendMessage', 'Auto-consent falló', { error: err.message });
      }
    }

    if (!finalText && connectionManagerCard) {
      convLog.log('sendMessage', 'connectionManagerCard detectada', { cardText: connectionCardText });
      finalText = connectionCardText || 'No pude responder porque el agente requiere una conexión a un sistema externo que no está configurada en Power Platform. Contacta al administrador.';
    }

    convLog.log('sendMessage', 'Respuesta final', {
      replyPreview: finalText.slice(0, 200),
    });

    appLogger.log('CopilotStudio', 'sendMessage', 'Respuesta final', {
      userId,
      conversationId: session.conversationId,
      replyLength: finalText.length,
      replyPreview: finalText.slice(0, 120),
      hasCard: !!adaptiveCard,
    });

    return {
      reply: finalText,
      sessionId: session.conversationId,
      ...(adaptiveCard ? { card: adaptiveCard } : {}),
      ...(oauthCard ? { oauthCard } : {}),
      ...(suggestedActions?.length ? { suggestedActions } : {}),
    };
  }

  private async createSession(token: string, userId: number): Promise<Session> {
    appLogger.log('CopilotStudio', 'createSession', 'Iniciando conversación con Copilot Studio', { userId });
    appLogger.log('CopilotStudio', 'createSession', 'ConnectionSettings', {
      environmentId: this.environmentId,
      agentIdentifier: this.agentIdentifier,
      useExperimentalEndpoint: true,
    });
    const client = new CopilotStudioClient(
      { environmentId: this.environmentId, agentIdentifier: this.agentIdentifier, useExperimentalEndpoint: true } as ConnectionSettings,
      token,
    );

    const response = await client.startConversationWithResponse(true);

    if (!response.conversationId) {
      appLogger.log('CopilotStudio', 'createSession', 'ERROR: No se obtuvo conversationId del agente', { userId });
      throw new InternalServerErrorException('No se obtuvo conversationId del agente');
    }

    appLogger.log('CopilotStudio', 'createSession', 'Conversación creada exitosamente', { userId, conversationId: response.conversationId });
    return { conversationId: response.conversationId, userId, lastUsedAt: Date.now() };
  }

  async createNewSession(userId: number): Promise<{ sessionId: string; welcome: string; suggestedActions?: { title: string; value?: any }[] }> {
    appLogger.log('CopilotStudio', 'createNewSession', 'Inicio', { userId });

    const ppToken = await this.microsoftAuthService.getPowerPlatformToken(userId);
    if (!ppToken) {
      appLogger.log('CopilotStudio', 'createNewSession', 'getPowerPlatformToken devolvió null', { userId });
      throw new UnauthorizedException('No hay sesión de Microsoft activa');
    }
    appLogger.log('CopilotStudio', 'createNewSession', 'PP token obtenido', { userId, oid: ppToken.tokenOid, upn: ppToken.tokenUpn });

    const decodedToken = jwt.decode(ppToken.token) as Record<string, any> | null;
    appLogger.log('CopilotStudio', 'createNewSession', 'PP Token claims', {
      aud: decodedToken?.aud,
      scp: decodedToken?.scp,
      oid: decodedToken?.oid,
      upn: decodedToken?.upn,
      iss: decodedToken?.iss,
      exp: decodedToken?.exp ? new Date(decodedToken.exp * 1000).toISOString() : null,
    });

    const client = new CopilotStudioClient(
      { environmentId: this.environmentId, agentIdentifier: this.agentIdentifier, useExperimentalEndpoint: true } as ConnectionSettings,
      ppToken.token,
    );

    const response = await client.startConversationWithResponse(true);

    if (!response.conversationId) {
      appLogger.log('CopilotStudio', 'createNewSession', 'ERROR: No se obtuvo conversationId del agente', { userId });
      throw new InternalServerErrorException('No se obtuvo conversationId del agente');
    }

    const session: Session = {
      conversationId: response.conversationId,
      userId,
      lastUsedAt: Date.now(),
    };
    this.sessions.set(session.conversationId, session);

    const welcomeActivity = response.activities.find(
      a => a.type === ActivityTypes.Message && a.text,
    );
    const welcome = welcomeActivity?.text ?? '';
    const welcomeSuggestedActions = welcomeActivity?.suggestedActions?.actions?.map(a => ({
      title: a.title,
      value: a.value ?? a.text ?? a.title,
    })) ?? [];

    appLogger.log('CopilotStudio', 'createNewSession', 'Conversación creada exitosamente', { userId, conversationId: session.conversationId, welcomeLength: welcome.length, hasSuggestedActions: !!welcomeSuggestedActions.length });
    return { sessionId: session.conversationId, welcome, ...(welcomeSuggestedActions.length ? { suggestedActions: welcomeSuggestedActions } : {}) };
  }

  private async collectReplies(
    iterable: AsyncIterable<Activity>,
    convLog: ConversationLog,
  ): Promise<CollectResult> {
    let text = '';
    let streamingText = '';
    let hasPlanEvents = false;
    let consentCard = false;
    let consentActionData: unknown = undefined;
    let consentCardText = '';
    let connectionManagerCard = false;
    let connectionCardText = '';
    let adaptiveCard: any = null;
    let suggestedActions: { title: string; value?: any }[] | null = null;
    let oauthCard: any = null;
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
        attachments: activity.attachments?.map(a => ({
          contentType: a.contentType,
          contentPreview: a.content ? JSON.stringify(a.content).slice(0, 300) : null,
        })) ?? null,
        channelData: activity.channelData ?? null,
        suggestedActionsDetail: activity.suggestedActions?.actions?.map(a => ({
          type: a.type, title: a.title, value: a.value, text: a.text,
        })) ?? null,
        from: activity.from ?? null,
        recipient: activity.recipient ?? null,
      });

      const authKeywords = ['signIn', 'signin', 'oauth', 'tokenExchange', 'token_exchange', 'auth'];
      const nameLower = (activity.name ?? '').toLowerCase();
      if (authKeywords.some(k => nameLower.includes(k.toLowerCase()))) {
        convLog.log('collectReplies', `Actividad #${activityCount} POSSIBLE AUTH ACTIVITY`, {
          type: activity.type,
          name: activity.name,
          fullActivity: JSON.stringify(activity).slice(0, 1000),
        });
      }

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
        if (!streamingText) {
          streamingText = activity.text;
        } else {
          const maxOverlap = Math.min(streamingText.length, activity.text.length);
          let overlap = 0;
          for (let i = 1; i <= maxOverlap; i++) {
            if (streamingText.endsWith(activity.text.slice(0, i))) {
              overlap = i;
            }
          }
          streamingText += activity.text.slice(overlap);
        }
      }

      if (activity.name && activity.name.includes('DynamicPlan')) {
        hasPlanEvents = true;
      }

      if (activity.name === 'connectors/consentCard') {
        consentCard = true;
        const card = activity.attachments?.[0]?.content as any;
        if (card) {
          const bodyTexts = (card.body ?? [])
            .filter((b: any) => b.type === 'TextBlock' && b.text)
            .map((b: any) => b.text as string);
          consentCardText = bodyTexts.join(' ');

          const submitActions = findSubmitActions(card);
          const allowAction = submitActions.find(
            a => a.title === 'Allow' || a.title === 'Permitir',
          );
          if (allowAction?.data) {
            consentActionData = allowAction.data;
          }
        }
        convLog.log('collectReplies', 'Consent card detectada', {
          hasActionData: !!consentActionData,
          consentActionData,
          consentCardText,
        });
      }

      if (activity.name === 'connectors/connectionManagerCard') {
        connectionManagerCard = true;
        const card = activity.attachments?.[0]?.content as any;
        if (card) {
          connectionCardText = extractCardTexts(card).join('\n');
        }
        convLog.log('collectReplies', 'connectionManagerCard detectada', {
          cardTextPreview: connectionCardText.slice(0, 200),
        });
      }

      if (activity.type === ActivityTypes.Message && activity.attachments?.length) {
        for (const att of activity.attachments) {
          if (att.contentType === 'application/vnd.microsoft.card.adaptive') {
            adaptiveCard = att.content as any;
            convLog.log('collectReplies', 'Adaptive Card detectada', {
              hasBody: !!adaptiveCard?.body,
              bodyLength: adaptiveCard?.body?.length ?? 0,
            });
          }
          if (att.contentType === 'application/vnd.microsoft.card.oauth') {
            oauthCard = att.content as any;
            convLog.log('collectReplies', 'OAuthCard detectada', {
              text: oauthCard?.text,
              connectionName: oauthCard?.connectionName,
              hasSignInUrl: !!(oauthCard as any)?.buttons?.[0]?.value,
            });
          }
        }
      }

      if (activity.suggestedActions?.actions?.length) {
        suggestedActions = activity.suggestedActions.actions.map(a => ({
          title: a.title,
          value: a.value ?? a.text ?? a.title,
        }));
        convLog.log('collectReplies', 'Suggested actions detectadas', {
          count: suggestedActions.length,
          titles: suggestedActions.map(s => s.title),
        });
      }
    }

    convLog.log('collectReplies', 'Recolección completada', {
      totalActivities: activityCount,
      finalTextPreview: text.slice(0, 200),
      streamingTextPreview: streamingText.slice(0, 200),
      hasPlanEvents,
      consentCard,
      connectionManagerCard,
      hasSuggestedActions: !!suggestedActions?.length,
    });

    appLogger.log('CopilotStudio', 'collectReplies', 'Recolección completada', {
      totalActivities: activityCount,
      hasPlanEvents,
      consentCard,
      connectionManagerCard,
      hasSuggestedActions: !!suggestedActions?.length,
    });

    return { text, hasPlanEvents, streamingText, consentCard, consentActionData, consentCardText, connectionManagerCard, connectionCardText, adaptiveCard, suggestedActions, oauthCard };
  }

  private async subscribeForReply(
    client: CopilotStudioClient,
    settings: ConnectionSettings,
    conversationId: string,
    convLog: ConversationLog,
  ): Promise<string | null> {
    const url = getCopilotStudioSubscribeUrl(settings, conversationId);
    convLog.log('subscribeForReply', 'Iniciando subscribe POST', { url });

    const subscribeTask = async (): Promise<string | null> => {
      const gen = (client as any).postRequestAsync(url, {}, 'POST') as AsyncGenerator<Activity>;
      for await (const activity of gen) {
        if (activity.type === ActivityTypes.Message && activity.text) {
          convLog.log('subscribeForReply', 'Reply recibido via subscribe POST', { preview: activity.text.slice(0, 200) });
          return activity.text;
        }
        if (activity.type === ActivityTypes.EndOfConversation) {
          convLog.log('subscribeForReply', 'EndOfConversation en subscribe');
          break;
        }
      }
      return null;
    };

    const timeout = new Promise<string | null>((_, reject) =>
      setTimeout(() => reject(new Error('Subscribe timeout 300s')), 300_000),
    );

    try {
      return await Promise.race([subscribeTask(), timeout]);
    } catch (err: any) {
      convLog.log('subscribeForReply', 'Subscribe error/timeout', { error: err.message });
      return null;
    }
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

function findSubmitActions(cardContent: any): SubmitAction[] {
  const body: any[] = cardContent?.body ?? [];
  const actions: SubmitAction[] = [];

  for (const item of body) {
    if (item.type === 'ActionSet') {
      for (const action of item.actions ?? []) {
        if (action.type === 'Action.Submit') {
          actions.push({ title: action.title ?? '', data: action.data });
        }
      }
    } else if (item.type === 'ColumnSet') {
      for (const col of item.columns ?? []) {
        for (const subItem of col.items ?? []) {
          if (subItem.type === 'ActionSet') {
            for (const action of subItem.actions ?? []) {
              if (action.type === 'Action.Submit') {
                actions.push({ title: action.title ?? '', data: action.data });
              }
            }
          }
        }
      }
    }
  }

  return actions;
}

function extractCardTexts(cardContent: any): string[] {
  const body: any[] = cardContent?.body ?? [];
  const texts: string[] = [];

  for (const item of body) {
    if (item.type === 'TextBlock' && item.text) {
      texts.push(item.text);
    }
  }

  return texts;
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
