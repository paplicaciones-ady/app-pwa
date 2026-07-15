import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Module {
  id: string;
  label: string;
  implemented: boolean;
}

@Component({
  selector: 'app-herragro',
  standalone: true,
  template: `
    <div class="s2">
      <div class="s2-head">
        <div class="s2-top">
          <div class="cback" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="#fff"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="org-chip">
            <span class="org-dot"></span>
            Herragro · Gestión Comercial
          </div>
        </div>
        <div class="greet">
          <div class="welcome">
            <div class="brand-ava">
              @if (!authService.guestMode()) {
                <button class="chat-mini" (click)="openChat()">
                  <img src="/Elena-min.png" alt="Chat" />
                </button>
              }
            </div>
            <div>
              <h2>Hola, {{ userName() }} <span class="wave">👋</span></h2>
              <p class="brand-sub">
                {{
                  authService.guestMode()
                    ? 'Selecciona el módulo que deseas consultar.'
                    : 'Soy Elena. ¿Con qué área te ayudo?'
                }}
              </p>
            </div>
          </div>
        </div>
        <h1 class="page-title">Módulos comerciales</h1>
        <p class="lead below">Selecciona el módulo que deseas consultar.</p>
      </div>

      <div class="s2-body">
        <div class="hsec">Módulos</div>
        <div class="grid">
          @for (mod of modules; track mod.id) {
            <div class="tile" [class.disabled]="!mod.implemented" (click)="goModule(mod)">
              <div class="ic">
                @switch (mod.id) {
                  @case ('cliente') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="3.6" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M5 20c0-3.4 3.1-6 7-6s7 2.6 7 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('encuestas') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="5"
                        y="3"
                        width="14"
                        height="18"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M9 8h6M9 12h6M9 16h4"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('cartera') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16v12H4z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M4 10h16M16 15h2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('crear') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="10" cy="8" r="3.4" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M4 19c0-3 2.7-5.2 6-5.2 1 0 2 .2 2.8.6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M18 14v6M15 17h6"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('descuentos') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 8h.01M16 16h.01M7 17L17 7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="4"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  }
                  @case ('nuevos') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 8l8-4 8 4-8 4-8-4Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M4 8v8l8 4 8-4V8"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M18 4v5M15.5 5.5h5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('rutero') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="2" />
                    </svg>
                  }
                  @case ('brain') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 9 18a3 3 0 0 0 3-1V5a3 3 0 0 0-3-1Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A3 3 0 0 1 15 18a3 3 0 0 1-3-1"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                      />
                    </svg>
                  }
                  @case ('quejas') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3l9 16H3L12 3Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12 10v4"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <circle cx="12" cy="17" r="1" fill="currentColor" />
                    </svg>
                  }
                  @case ('precios') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 8l6-4 10 6-6 10L4 14V8Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <circle cx="9" cy="10" r="1.4" fill="currentColor" />
                    </svg>
                  }
                  @case ('gastos') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="6"
                        width="18"
                        height="13"
                        rx="2.5"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path d="M3 10h18" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M7 15h4"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                }
              </div>
              <span>{{ mod.label }}</span>
              @if (!mod.implemented) {
                <span class="coming-soon">Próximamente</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .s2 {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .s2-head {
      background: linear-gradient(155deg, var(--accent-deep), var(--accent) 60%, #8b0b16);
      padding: 16px 20px 32px;
      position: relative;
      overflow: hidden;
      flex: none;
    }
    .s2-top {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      z-index: 2;
    }
    .cback {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: 0.15s;
      flex: none;
    }
    .cback:hover {
      background: rgba(255, 255, 255, 0.24);
    }
    .cback svg {
      width: 20px;
      height: 20px;
      color: #fff;
    }
    .chat-mini {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      border: 0;
      display: grid;
      place-items: center;
      cursor: pointer;
      flex: none;
      margin-left: auto;
      align-self: center;
      box-shadow: 0 4px 10px -6px rgba(0, 0, 0, 0.4);
    }
    .chat-mini img {
      width: 44px;
      height: 44px;
      border-radius: 50%;
    }
    .org-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.95);
      padding: 5px 14px 5px 6px;
      border-radius: 999px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
      box-shadow: 0 6px 14px -8px rgba(0, 0, 0, 0.4);
      margin-left: auto;
    }
    .org-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--green));
    }
    .greet {
      position: relative;
      z-index: 2;
      margin-top: 18px;
    }
    .welcome {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-ava {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: grid;
      place-items: center;
      flex: none;
    }
    .brand-ava svg {
      width: 24px;
      height: 24px;
      color: #fff;
    }
    .greet h2 {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 22px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .greet h2 .wave {
      font-size: 20px;
    }
    .brand-sub {
      color: #f5aab4;
      font-size: 13px;
      margin-top: 2px;
    }
    .page-title {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 20px;
      margin-top: 18px;
      position: relative;
      z-index: 2;
    }
    .lead.below {
      color: #f5aab4;
      font-size: 13px;
      margin-top: 2px;
      position: relative;
      z-index: 2;
    }
    .s2-body {
      flex: 1;
      background: var(--bg);
      border-radius: 24px 24px 0 0;
      margin-top: -20px;
      padding: 22px 20px 90px;
      position: relative;
      z-index: 3;
      overflow-y: auto;
    }
    .s2-body::-webkit-scrollbar {
      width: 0;
    }
    .hsec {
      font-family: var(--display);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--faint);
      margin: 2px 4px 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 11px;
    }
    .tile {
      position: relative;
      background: #fff;
      border: 1.4px solid var(--line);
      border-radius: 16px;
      padding: 16px 8px 14px;
      text-align: center;
      cursor: pointer;
      transition:
        transform 0.14s,
        box-shadow 0.2s,
        border-color 0.18s;
    }
    .tile:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 26px -16px rgba(120, 0, 10, 0.32);
      border-color: transparent;
    }
    .tile:active {
      transform: scale(0.97);
    }
    .tile.disabled {
      opacity: 0.45;
      filter: grayscale(0.6);
      cursor: default;
      pointer-events: none;
    }
    .tile .ic {
      width: 44px;
      height: 44px;
      border-radius: 13px;
      background: var(--accent-soft);
      display: grid;
      place-items: center;
      margin: 0 auto 8px;
    }
    .tile .ic svg {
      width: 23px;
      height: 23px;
      color: var(--accent);
    }
    .tile span {
      font-size: 11px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.15;
      display: block;
    }
    .coming-soon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--display);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.85);
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(3px);
      border-radius: 16px;
      z-index: 5;
    }
  `,
})
export class Herragro {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly modules: Module[] = [
    { id: 'cliente', label: 'Cliente', implemented: true },
    { id: 'encuestas', label: 'Encuestas', implemented: true },
    { id: 'cartera', label: 'Estado de cartera', implemented: true },
    { id: 'crear', label: 'Creación de clientes', implemented: true },
    { id: 'descuentos', label: 'Descuentos comerciales', implemented: true },
    { id: 'nuevos', label: 'Productos nuevos', implemented: true },
    { id: 'rutero', label: 'Rutero', implemented: true },
    { id: 'brain', label: 'BRAIN', implemented: true },
    { id: 'quejas', label: 'Quejas y reclamos', implemented: true },
    { id: 'precios', label: 'Consulta de precios', implemented: true },
    { id: 'gastos', label: 'Gastos de viaje', implemented: true },
  ];

  protected readonly userName = computed(() => {
    if (this.authService.guestMode()) return 'Invitado';
    return this.authService.currentUser()?.name?.split(' ')[0] || 'Usuario';
  });

  protected goBack() {
    this.router.navigate(['/home']);
  }

  protected goModule(mod: Module) {
    if (!mod.implemented) return;
    this.router.navigate([`/herragro/${mod.id}`]);
  }

  protected openChat() {
    this.router.navigate(['/chat']);
  }
}
