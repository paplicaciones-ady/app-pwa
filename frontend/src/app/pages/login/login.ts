import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';
import { FingerprintService } from '../../services/fingerprint.service';
import { MicrosoftAuthService } from '../../services/microsoft-auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { IndexedDbService } from '../../services/indexed-db.service';

interface DeviceCheckResult {
  registered: boolean;
  deviceName?: string;
  isTrusted?: boolean;
  hasPasskeys?: boolean;
  migrated?: boolean;
  userName?: string | null;
  userEmail?: string | null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="s1">
      <div class="s1-hero">
        <div class="org-row">
          <div class="org-chip">
            <span class="org-dot"></span>
            Elena 360
          </div>
          @if (!connectivity.isOnline()) {
            <span class="offline-chip">
              <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5a7 7 0 0 1 14 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.6" fill="currentColor"/></svg>
              Sin conexión
            </span>
          }
        </div>
        <div class="s1-date">
          <span class="date-label">{{ today }}</span>
        </div>
      </div>

      <div class="s1-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-scroll">
          @if (deviceStatus(); as d) {
            <div class="device-status" [class.registered]="d.registered" [class.trusted]="d.isTrusted">
              @if (d.registered) {
                {{ d.isTrusted ? '✓ Confiado' : '✗ No confiado' }} · {{ d.deviceName }} · {{ d.userName ?? d.userEmail }}
              } @else {
                ✗ Dispositivo no registrado
              }
            </div>
          }

          @if (error(); as e) {
            <div class="error-msg">{{ e }}</div>
          }

          <h3 class="sheet-title">Iniciar sesión</h3>
          <p class="sheet-lead">Accede con tu cuenta corporativa.</p>

          @switch (uiMode()) {
            @case ('first-time-offline') {
              <div class="offline-msg">
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5a7 7 0 0 1 14 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.6" fill="currentColor"/></svg>
                Conéctate a internet para iniciar sesión por primera vez
              </div>
            }
            @case ('first-time-online') {
              <button class="btn btn-primary" (click)="onMicrosoftLogin()" [disabled]="loading()">
                <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" fill="#fff"/><rect x="13" y="3" width="8" height="8" rx="1" fill="#fff"/><rect x="3" y="13" width="8" height="8" rx="1" fill="#fff"/><rect x="13" y="13" width="8" height="8" rx="1" fill="#fff"/></svg>
                Continuar con Microsoft
              </button>
              <div class="s1-foot">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Conexión cifrada de extremo a extremo
              </div>
            }
            @case ('registered-offline') {
              <button class="btn btn-primary" (click)="onPasskeyByFingerprint()" [disabled]="loading()">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 4c-2.8 0-5 1.6-6 3.5M19 9c0-1.2-.5-2.4-1.3-3.4M5 11c0-1 .3-2 .8-2.8M4.5 16c.7-1.3 1-2.8 1-4.3M8 19c1-1.6 1.4-3.6 1.4-5.6 0-1.5 1-2.6 2.6-2.6s2.6 1.1 2.6 2.6c0 .9-.1 1.8-.3 2.6M11.8 13.4c0 3.2-.6 5.8-1.6 7.6M15 17.5c-.3 1-.7 2-1.2 2.9" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
                {{ loading() ? 'Entrando…' : 'Entrar con huella' }}
              </button>
            }
            @case ('registered-online') {
              <button class="btn btn-primary" (click)="onPasskeyByFingerprint()" [disabled]="loading()" style="padding:18px;font-size:17px;">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 4c-2.8 0-5 1.6-6 3.5M19 9c0-1.2-.5-2.4-1.3-3.4M5 11c0-1 .3-2 .8-2.8M4.5 16c.7-1.3 1-2.8 1-4.3M8 19c1-1.6 1.4-3.6 1.4-5.6 0-1.5 1-2.6 2.6-2.6s2.6 1.1 2.6 2.6c0 .9-.1 1.8-.3 2.6M11.8 13.4c0 3.2-.6 5.8-1.6 7.6M15 17.5c-.3 1-.7 2-1.2 2.9" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
                {{ loading() ? 'Entrando…' : 'Entrar con huella' }}
              </button>
              <div class="divider">o continúa con</div>
              <div class="biometric">
                <div class="bio-btn" (click)="onMicrosoftLogin()" title="Microsoft">
                  <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor"/><rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="1" fill="currentColor"/></svg>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .s1 { display: flex; flex-direction: column; height: 100vh; }
    .s1-hero {
      position: relative;
      background: linear-gradient(160deg, #1356a0, var(--blue) 55%, #0c3567);
      padding: 16px 24px 42px;
      overflow: hidden;
      flex: none;
    }
    .org-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }
    .org-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--white);
      padding: 5px 14px 5px 6px;
      border-radius: 999px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
      box-shadow: 0 6px 14px -8px rgba(0,0,0,.4);
    }
    .org-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--green));
    }
    .offline-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 700;
      color: #bff0d2;
      background: rgba(159,230,185,.16);
      border: 1px solid rgba(159,230,185,.3);
      padding: 5px 10px;
      border-radius: 999px;
    }
    .offline-chip svg { width: 12px; height: 12px; }
    .s1-date {
      position: relative;
      z-index: 2;
      margin-top: 22px;
    }
    .date-label {
      color: #bcd6f4;
      font-size: 13px;
      font-weight: 600;
    }
    .s1-sheet {
      flex: 1;
      background: var(--bg);
      margin-top: -24px;
      border-radius: 28px 28px 0 0;
      padding: 26px 24px 20px;
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
    }
    .sheet-scroll {
      flex: 1;
      overflow-y: auto;
    }
    .sheet-scroll::-webkit-scrollbar { width: 0; }
    .sheet-handle {
      width: 42px;
      height: 5px;
      border-radius: 99px;
      background: var(--line);
      margin: 0 auto 20px;
    }
    .sheet-title {
      font-family: var(--display);
      font-weight: 700;
      color: var(--ink);
      font-size: 18px;
      margin-bottom: 2px;
    }
    .sheet-lead {
      font-size: 12.5px;
      color: var(--muted);
      margin-bottom: 20px;
    }
    .btn { margin-top: 8px; }
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--faint);
      font-size: 11px;
      font-weight: 600;
      margin: 18px 2px;
    }
    .divider::before, .divider::after {
      content: "";
      height: 1px;
      background: var(--line);
      flex: 1;
    }
    .biometric { display: flex; justify-content: center; }
    .bio-btn {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      border: 1.6px solid var(--line);
      background: var(--white);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: 0.15s;
    }
    .bio-btn:hover { border-color: var(--accent); background: var(--accent-soft); }
    .bio-btn svg { width: 24px; height: 24px; color: var(--blue); }
    .s1-foot {
      text-align: center;
      font-size: 10.5px;
      color: var(--faint);
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 600;
    }
    .s1-foot svg { width: 13px; height: 13px; opacity: 0.7; }
    .device-status {
      padding: 10px 14px;
      border-radius: 14px;
      margin-bottom: 16px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      background: #f8d7da;
      color: #721c24;
      border: 1px solid rgba(225,18,37,.15);
    }
    .device-status.registered { background: #fff3cd; color: #856404; border-color: rgba(242,186,42,.3); }
    .device-status.trusted { background: #d4edda; color: #155724; border-color: rgba(62,155,97,.3); }
    .offline-msg {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(225,18,37,.06);
      color: var(--accent-deep);
      padding: 14px 16px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      border: 1px solid rgba(225,18,37,.12);
    }
    .offline-msg svg { width: 18px; height: 18px; flex-shrink: 0; }
  `,
})
export class Login {
  protected readonly authService = inject(AuthService);
  protected readonly connectivity = inject(ConnectivityService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly fingerprintService = inject(FingerprintService);
  private readonly microsoftAuthService = inject(MicrosoftAuthService);
  private readonly indexedDb = inject(IndexedDbService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly deviceStatus = signal<DeviceCheckResult | null>(null);
  private readonly deviceFingerprint = signal<string | null>(null);

  protected readonly uiMode = computed(() => {
    const ds = this.deviceStatus();
    const online = this.connectivity.isOnline();
    if (ds?.registered) {
      return online ? 'registered-online' : 'registered-offline';
    }
    return online ? 'first-time-online' : 'first-time-offline';
  });

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    this.authService.initComplete.then(() => {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/home']);
      }
    });

    this.checkDevice();
  }

  private async checkDevice() {
    try {
      const fingerprint = await this.fingerprintService.getFingerprint();
      const legacy = await this.fingerprintService.getLegacyFingerprint();
      this.deviceFingerprint.set(fingerprint);
      const resp = await firstValueFrom(
        this.http.post<DeviceCheckResult>('/api/devices/check', { fingerprint, legacyFingerprint: legacy }),
      );
      this.deviceStatus.set(resp);
      await this.indexedDb.setDeviceCheck(resp);
      if (resp.registered && resp.hasPasskeys) {
        queueMicrotask(() => this.onPasskeyByFingerprint());
      }
    } catch {
      const cached = await this.indexedDb.getDeviceCheck<DeviceCheckResult>();
      if (cached?.registered) {
        this.deviceStatus.set(cached);
      }
    }
  }

  protected async onMicrosoftLogin() {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.microsoftAuthService.login();
    } catch {
      this.error.set('Error al conectar con Microsoft');
      this.loading.set(false);
    }
  }

  protected async onPasskeyByFingerprint() {
    const fp = this.deviceFingerprint();
    if (!fp) return;
    this.error.set(null);
    this.loading.set(true);
    try {
      const token = await this.passkeyService.loginPasskeyByFingerprint(fp);
      await this.authService.setSession(token, 'local');
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.error.set(err.message ?? 'Error con la huella');
    } finally {
      this.loading.set(false);
    }
  }
}
