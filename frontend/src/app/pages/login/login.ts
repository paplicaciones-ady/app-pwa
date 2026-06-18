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
  userName?: string | null;
  userEmail?: string | null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="container">
      <h2>Iniciar sesión</h2>

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
        <div class="error">{{ e }}</div>
      }

      @switch (uiMode()) {
        @case ('first-time-offline') {
          <div class="offline-msg">Conéctate a internet para iniciar sesión por primera vez</div>
        }
        @case ('first-time-online') {
          <button class="microsoft-btn" (click)="onMicrosoftLogin()" [disabled]="loading()">
            Continuar con Microsoft
          </button>
        }
        @case ('registered-offline') {
          <button class="passkey-btn" (click)="onPasskeyByFingerprint()" [disabled]="loading()">
            {{ loading() ? 'Entrando…' : 'Entrar con huella' }}
          </button>
        }
        @case ('registered-online') {
          <button class="passkey-btn passkey-big" (click)="onPasskeyByFingerprint()" [disabled]="loading()">
            {{ loading() ? 'Entrando…' : 'Entrar con huella' }}
          </button>
          <a class="alt-link" (click)="onMicrosoftLogin()">Usar otra cuenta de Microsoft</a>
        }
      }
    </div>
  `,
  styles: `
    .container { max-width: 360px; margin: 4rem auto; padding: 2rem; font-family: sans-serif; }
    h2 { text-align: center; margin-bottom: 1.5rem; }
    button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; width: 100%; }
    button:disabled { opacity: 0.5; cursor: default; }
    .microsoft-btn { background: #2f2f2f; color: #fff; font-weight: 600; }
    .passkey-btn { background: #28a745; color: #fff; }
    .passkey-big { padding: 1.2rem; font-size: 1.2rem; font-weight: 600; }
    .alt-link { display: block; text-align: center; margin-top: 1rem; color: #007bff; cursor: pointer; text-decoration: underline; font-size: 0.9rem; }
    .offline-msg { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 6px; text-align: center; font-size: 0.95rem; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
    .device-status { padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; text-align: center; background: #f8d7da; color: #721c24; }
    .device-status.registered { background: #fff3cd; color: #856404; }
    .device-status.trusted { background: #d4edda; color: #155724; }
  `,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly fingerprintService = inject(FingerprintService);
  private readonly microsoftAuthService = inject(MicrosoftAuthService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly indexedDb = inject(IndexedDbService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

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
    this.checkDevice();
  }

  private async checkDevice() {
    try {
      const fingerprint = await this.fingerprintService.getFingerprint();
      this.deviceFingerprint.set(fingerprint);
      const resp = await firstValueFrom(
        this.http.post<DeviceCheckResult>('/api/devices/check', { fingerprint }),
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
