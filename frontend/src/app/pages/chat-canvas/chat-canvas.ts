import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { AuthService } from '../../services/auth.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-chat-canvas',
  standalone: true,
  imports: [RouterLink, FormsModule, MarkdownPipe],
  template: `
    <div class="chat-container">
      <header class="chat-header">
        <a routerLink="/home" class="back-btn">← Volver</a>
        <span class="title">Copilot Studio</span>
        <button class="new-chat-btn" (click)="newChat()" [disabled]="loading()">+ Nueva</button>
      </header>

      <div class="messages">
        @if (messages().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🤖</span>
            <p>Conectado a Power Platform.</p>
            <p class="hint">Escribe un mensaje para comenzar.</p>
          </div>
        }
        @for (msg of messages(); track $index) {
          <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            @if (msg.role === 'assistant') {
              <div class="bubble" [innerHTML]="msg.text | markdown"></div>
            } @else {
              <div class="bubble">{{ msg.text }}</div>
            }
          </div>
        }
        @if (loading()) {
          <div class="message assistant">
            <div class="bubble typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        }
      </div>

      <div class="input-bar">
        <input
          type="text"
          [(ngModel)]="inputText"
          placeholder="Escribe un mensaje…"
          (keydown.enter)="send()"
          [disabled]="loading()"
        />
        <button (click)="send()" [disabled]="!inputText().trim() || loading()">Enviar</button>
      </div>
    </div>
  `,
  styles: [
    `
    :host { display: contents; }

    .chat-container {
      display: flex; flex-direction: column;
      height: calc(100vh - 130px); /* room for navbar + bottom nav */
      font-family: var(--body);
    }

    .chat-header {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 16px 20px;
      background: linear-gradient(155deg, #1356a0, var(--blue) 60%, #0d3970);
      color: #fff; font-weight: 600;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255,255,255,.9);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,.12);
      border: 1px solid rgba(255,255,255,.16);
      cursor: pointer;
    }
    .back-btn:hover { background: rgba(255,255,255,.2); }

    .title { flex: 1; text-align: center; font-family: var(--display); font-size: 17px; }

    .new-chat-btn {
      background: rgba(255,255,255,.12);
      color: #fff;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 999px;
      padding: 6px 14px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .new-chat-btn:hover { background: rgba(255,255,255,.2); }
    .new-chat-btn:disabled { opacity: 0.5; cursor: default; }

    .messages {
      flex: 1; overflow-y: auto; padding: 16px 16px 8px;
      display: flex; flex-direction: column; gap: 12px;
      background: var(--bg);
    }

    .empty-state {
      text-align: center; margin: auto; color: var(--muted);
    }

    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .hint { font-size: 12px; color: var(--faint); margin-top: 4px; }

    .message { display: flex; }
    .message.user { justify-content: flex-end; }
    .message.assistant { justify-content: flex-start; }

    .bubble {
      max-width: 80%; padding: 10px 16px; border-radius: 16px;
      font-size: 13.5px; line-height: 1.45; word-break: break-word;
    }

    .message.user .bubble {
      background: linear-gradient(135deg, var(--accent), var(--accent-deep));
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .bubble {
      background: var(--white);
      color: var(--ink);
      border: 1px solid var(--line);
      border-bottom-left-radius: 4px;
      line-height: 1.6;
    }

    ::ng-deep .message.assistant .bubble p { margin: 0 0 0.5rem 0; }
    ::ng-deep .message.assistant .bubble p:last-child { margin-bottom: 0; }
    ::ng-deep .message.assistant .bubble code {
      background: #eef2f7; padding: 0.15rem 0.4rem; border-radius: 4px;
      font-size: 12px; font-family: 'Courier New', monospace;
    }
    ::ng-deep .message.assistant .bubble pre {
      background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 8px;
      overflow-x: auto; margin: 8px 0;
    }
    ::ng-deep .message.assistant .bubble pre code {
      background: transparent; padding: 0; color: inherit; font-size: 12px;
    }
    ::ng-deep .message.assistant .bubble ul,
    ::ng-deep .message.assistant .bubble ol {
      padding-left: 1.5rem; margin: 0.25rem 0;
    }
    ::ng-deep .message.assistant .bubble li { margin-bottom: 0.15rem; }
    ::ng-deep .message.assistant .bubble a { color: var(--accent); text-decoration: underline; }
    ::ng-deep .message.assistant .bubble strong { font-weight: 600; }

    .typing { display: flex; gap: 4px; align-items: center; padding: 8px 16px; }

    .dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--faint);
      animation: bounce 1.4s infinite ease-in-out;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .input-bar {
      display: flex; gap: 8px; padding: 12px 16px;
      border-top: 1px solid var(--line); background: var(--white);
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
    }

    .input-bar input {
      flex: 1; padding: 0 16px; border: 1.6px solid var(--line);
      border-radius: 24px; font-size: 13.5px; outline: none;
      font-family: var(--body); font-weight: 600; color: var(--ink);
      height: 44px;
    }

    .input-bar input::placeholder { color: var(--faint); font-weight: 500; }
    .input-bar input:focus { border-color: var(--accent); }

    .input-bar button {
      height: 44px;
      padding: 0 20px;
      border: none;
      border-radius: 24px;
      background: linear-gradient(135deg, var(--accent), var(--accent-deep));
      color: #fff;
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }

    .input-bar button:disabled { opacity: 0.5; cursor: default; }
    `,
  ],
})
export class ChatCanvas {
  private readonly http = inject(HttpClient);
  protected readonly authService = inject(AuthService);

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly inputText = signal('');
  protected readonly loading = signal(false);
  private readonly sessionId = signal<string | null>(null);

  protected async send() {
    const text = this.inputText().trim();
    if (!text || this.loading()) return;

    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.inputText.set('');
    this.loading.set(true);

    try {
      let sid = this.sessionId();

      // Create session if none active
      if (!sid) {
        const sessionRes = await lastValueFrom(
          this.http.post<{ sessionId: string; welcome: string }>('/api/copilot/session', {}),
        );
        sid = sessionRes.sessionId;
        this.sessionId.set(sid);
        if (sessionRes.welcome) {
          this.messages.update((m) => [...m, { role: 'assistant', text: sessionRes.welcome }]);
        }
      }

      const res = await lastValueFrom(
        this.http.post<{ reply: string; sessionId: string }>('/api/copilot/chat', {
          message: text,
          sessionId: sid,
        }),
      );
      this.messages.update((m) => [...m, { role: 'assistant', text: res.reply }]);
    } catch (err: any) {
      // If session expired / invalid, reset so next message retries fresh
      this.sessionId.set(null);
      this.messages.update((m) => [
        ...m,
        { role: 'assistant', text: 'Error al conectar con Copilot Studio.' },
      ]);
    } finally {
      this.loading.set(false);
    }
  }

  protected newChat() {
    if (this.loading()) return;
    this.sessionId.set(null);
    this.messages.set([]);
  }
}
