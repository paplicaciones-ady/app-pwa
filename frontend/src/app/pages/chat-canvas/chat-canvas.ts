import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-chat-canvas',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="chat-container">
      <header class="chat-header">
        <a routerLink="/home" class="back-btn">← Volver</a>
        <span class="title">Copilot Studio</span>
        <span class="spacer"></span>
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
            <div class="bubble">{{ msg.text }}</div>
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
      height: calc(100vh - 72px); /* leave room for bottom nav */
      font-family: sans-serif;
    }

    .chat-header {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #007bff; color: #fff; font-weight: 600;
    }

    .back-btn {
      color: #fff; text-decoration: none; font-size: 0.9rem; cursor: pointer;
    }

    .title { flex: 1; text-align: center; font-size: 1rem; }
    .spacer { width: 60px; }

    .messages {
      flex: 1; overflow-y: auto; padding: 1rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }

    .empty-state {
      text-align: center; margin: auto; color: #999;
    }

    .empty-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
    .hint { font-size: 0.85rem; color: #bbb; margin-top: 0.25rem; }

    .message { display: flex; }
    .message.user { justify-content: flex-end; }
    .message.assistant { justify-content: flex-start; }

    .bubble {
      max-width: 80%; padding: 0.6rem 1rem; border-radius: 16px;
      font-size: 0.9rem; line-height: 1.4; word-break: break-word;
    }

    .message.user .bubble {
      background: #007bff; color: #fff;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .bubble {
      background: #f0f0f0; color: #333;
      border-bottom-left-radius: 4px;
    }

    .typing { display: flex; gap: 4px; align-items: center; padding: 0.6rem 1.2rem; }

    .dot {
      width: 8px; height: 8px; border-radius: 50%; background: #999;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .input-bar {
      display: flex; gap: 0.5rem; padding: 0.75rem 1rem;
      border-top: 1px solid #e0e0e0; background: #fff;
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
    }

    .input-bar input {
      flex: 1; padding: 0.6rem 1rem; border: 1px solid #ddd;
      border-radius: 24px; font-size: 0.9rem; outline: none;
    }

    .input-bar input:focus { border-color: #007bff; }

    .input-bar button {
      padding: 0.6rem 1.2rem; border: none; border-radius: 24px;
      background: #007bff; color: #fff; font-weight: 600; cursor: pointer;
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

  protected async send() {
    const text = this.inputText().trim();
    if (!text || this.loading()) return;

    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.inputText.set('');
    this.loading.set(true);

    try {
      const res = await lastValueFrom(
        this.http.post<{ reply: string }>('/api/copilot/chat', { message: text }),
      );
      this.messages.update((m) => [...m, { role: 'assistant', text: res.reply }]);
    } catch (err: any) {
      this.messages.update((m) => [
        ...m,
        { role: 'assistant', text: 'Error al conectar con Copilot Studio.' },
      ]);
    } finally {
      this.loading.set(false);
    }
  }
}
