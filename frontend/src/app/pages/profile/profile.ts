import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';
import { DeviceService, Device } from '../../services/device.service';
import { FingerprintService } from '../../services/fingerprint.service';

interface PasskeyItem {
  id: number;
  deviceName?: string;
  deviceId?: number | null;
  createdAt: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="profile-page">
      <div class="profile-head">
        <div class="profile-avatar">👤</div>
        <h2>{{ authService.currentUser()?.name || authService.currentUser()?.email || 'Usuario' }}</h2>
        <p class="profile-email">{{ authService.currentUser()?.email }}</p>
      </div>

      <div class="profile-body">
        @if (error(); as e) {
          <div class="error-msg">{{ e }}</div>
        }

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ authService.currentUser()?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nombre</span>
            <span class="info-value">{{ authService.currentUser()?.name || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Microsoft ID</span>
            <span class="info-value">{{ authService.currentUser()?.microsoftId ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cuenta Microsoft</span>
            <span class="info-value">{{ authService.currentUser()?.microsoftId ? 'Vinculada' : 'No vinculada' }}</span>
          </div>
          <div class="info-row" style="border-bottom:0;">
            <span class="info-label">Registrado</span>
            <span class="info-value">{{ (authService.currentUser()?.createdAt | date:'medium') || '—' }}</span>
          </div>
        </div>

        @if (showBiometricNotice()) {
          <div class="bio-notice">
            <div class="bio-notice-icon">🔐</div>
            <div>
              <strong>Registra tu autenticación biométrica</strong>
              <p>Registra una huella o reconocimiento facial en este dispositivo para acceder sin conexión y agilizar futuros inicios de sesión.</p>
            </div>
          </div>
        }

        <h3 class="section-title">Dispositivos</h3>

        @if (devices().length === 0 && unattachedPasskeys().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📱</span>
            <p>No tienes dispositivos registrados</p>
          </div>
        }

        @for (d of devices(); track d.id) {
          <div class="device-card">
            <div class="device-card-header">
              <div class="device-icon">💻</div>
              <div class="device-info">
                <strong>{{ d.deviceName }}</strong>
                <span class="trust-badge" [class.trusted]="d.isTrusted">
                  {{ d.isTrusted ? 'Confiado' : 'No confiado' }}
                </span>
              </div>
              <span class="device-date">{{ d.createdAt | date }}</span>
            </div>

            <div class="device-passkeys">
              @for (pk of passkeysForDevice(d.id); track pk.id) {
                <div class="passkey-row">
                  <span>Huella — {{ pk.createdAt | date }}</span>
                  <button class="btn-tiny btn-tiny-danger" (click)="onDeletePasskey(pk.id)" [disabled]="loading()">Eliminar</button>
                </div>
              }
              @if (passkeysForDevice(d.id).length === 0) {
                <span class="no-passkeys">Sin huellas registradas</span>
              }
            </div>

            <div class="device-actions">
              <button class="btn-ghost-sm" (click)="onToggleTrust(d.id)" [disabled]="loading()">
                {{ d.isTrusted ? 'Desconfiar' : 'Confiar' }}
              </button>
              <button class="btn-ghost-sm btn-ghost-danger" (click)="onDeleteDevice(d.id)" [disabled]="loading()">Eliminar</button>
            </div>
          </div>
        }

        @if (unattachedPasskeys().length > 0) {
          <div class="unattached-section">
            <h4 class="section-subtitle">Huellas sin dispositivo</h4>
            @for (pk of unattachedPasskeys(); track pk.id) {
              <div class="passkey-row">
                <span>{{ pk.deviceName || 'Huella' }} — {{ pk.createdAt | date }}</span>
                <button class="btn-tiny btn-tiny-danger" (click)="onDeletePasskey(pk.id)" [disabled]="loading()">Eliminar</button>
              </div>
            }
          </div>
        }

        @if (showNameInput()) {
          <div class="name-input-card">
            <p class="name-prompt">Ponle un nombre a este dispositivo:</p>
            <div class="name-input-row">
              <span class="platform-prefix">{{ platformPrefix() }} + </span>
              <input
                #nameInput
                type="text"
                placeholder="nombre personalizado"
                autofocus
                (input)="customName.set(nameInput.value)"
                (keydown.enter)="onConfirmName()"
              />
            </div>
            <div class="name-actions">
              <button class="btn btn-primary" (click)="onConfirmName()" [disabled]="!customName().trim()">Confirmar</button>
              <button class="btn-ghost" (click)="onCancelName()" [disabled]="loading()">Cancelar</button>
            </div>
          </div>
        }

        <button class="btn btn-primary" (click)="onRegisterPasskey()" [disabled]="loading()" style="margin-top:16px;">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 4c-2.8 0-5 1.6-6 3.5M19 9c0-1.2-.5-2.4-1.3-3.4M5 11c0-1 .3-2 .8-2.8M4.5 16c.7-1.3 1-2.8 1-4.3M8 19c1-1.6 1.4-3.6 1.4-5.6 0-1.5 1-2.6 2.6-2.6s2.6 1.1 2.6 2.6c0 .9-.1 1.8-.3 2.6M11.8 13.4c0 3.2-.6 5.8-1.6 7.6M15 17.5c-.3 1-.7 2-1.2 2.9" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
          {{ loading() ? 'Registrando...' : 'Registrar huella' }}
        </button>
        <button class="btn btn-ghost" (click)="onLogout()" style="margin-top:8px;">Cerrar sesión</button>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .profile-page { display: flex; flex-direction: column; min-height: 100vh; }
    .profile-head {
      background: linear-gradient(155deg, #1356a0, var(--blue) 60%, #0d3970);
      padding: 40px 24px 48px;
      text-align: center;
      position: relative;
    }
    .profile-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--white);
      border: 3px solid rgba(255,255,255,.85);
      box-shadow: 0 10px 22px -8px rgba(0,0,0,.45);
      display: grid;
      place-items: center;
      font-size: 32px;
      margin: 0 auto 16px;
    }
    .profile-head h2 {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 22px;
    }
    .profile-email {
      color: #bcd6f4;
      font-size: 13px;
      margin-top: 4px;
    }
    .profile-body {
      flex: 1;
      background: var(--bg);
      border-radius: 24px 24px 0 0;
      margin-top: -24px;
      padding: 24px 20px 100px;
      position: relative;
      z-index: 3;
    }
    .info-card {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 18px;
      padding: 6px 16px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
    }
    .info-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .info-value {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink);
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }
    .section-title {
      font-family: var(--display);
      font-weight: 700;
      font-size: 16px;
      color: var(--ink);
      margin: 20px 2px 14px;
    }
    .section-subtitle {
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--muted);
      margin: 0 2px 10px;
    }
    .bio-notice {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: linear-gradient(135deg, #eaf4fb, #e9f4ed);
      border: 1px solid #d9ebe0;
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .bio-notice-icon { font-size: 24px; flex-shrink: 0; }
    .bio-notice strong {
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--green-deep);
      display: block;
      margin-bottom: 4px;
    }
    .bio-notice p {
      font-size: 11.5px;
      color: #2c4a3a;
      line-height: 1.45;
    }
    .device-card {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .device-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .device-icon { font-size: 24px; }
    .device-info { flex: 1; }
    .device-info strong {
      font-family: var(--display);
      font-weight: 700;
      font-size: 13.5px;
      color: var(--ink);
      display: block;
      margin-bottom: 3px;
    }
    .device-date { font-size: 11px; color: var(--faint); flex-shrink: 0; }
    .trust-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 999px;
      background: #eef2f7;
      color: var(--muted);
    }
    .trust-badge.trusted { background: var(--green-soft); color: var(--green-deep); }
    .device-passkeys {
      padding: 8px 0 8px 12px;
      border-left: 2px solid var(--line);
      margin-bottom: 10px;
    }
    .passkey-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      font-size: 12.5px;
      color: var(--muted);
    }
    .no-passkeys { font-size: 11px; color: var(--faint); }
    .device-actions { display: flex; gap: 8px; }
    .btn-ghost-sm {
      flex: 1;
      padding: 8px;
      border: 1.4px solid var(--line);
      border-radius: 12px;
      background: var(--white);
      font-family: var(--display);
      font-weight: 700;
      font-size: 11.5px;
      color: var(--muted);
      cursor: pointer;
      transition: 0.15s;
    }
    .btn-ghost-sm:hover { background: var(--bg); }
    .btn-ghost-sm:disabled { opacity: 0.5; cursor: default; }
    .btn-ghost-danger { color: var(--accent); border-color: rgba(var(--accent-rgb), .2); }
    .btn-ghost-danger:hover { background: var(--accent-soft); }
    .btn-tiny {
      padding: 4px 12px;
      border: none;
      border-radius: 8px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 10.5px;
      cursor: pointer;
    }
    .btn-tiny:disabled { opacity: 0.5; cursor: default; }
    .btn-tiny-danger { background: var(--accent-soft); color: var(--accent-deep); }
    .btn-tiny-danger:hover { background: #fcd5d9; }
    .unattached-section {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--muted);
    }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
    .empty-state p { font-size: 13px; }
    .name-input-card {
      background: var(--white);
      border: 1.4px solid var(--blue);
      border-radius: 18px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .name-prompt {
      font-family: var(--display);
      font-weight: 700;
      font-size: 14px;
      color: var(--ink);
      margin-bottom: 12px;
    }
    .name-input-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .platform-prefix {
      font-weight: 700;
      font-size: 13px;
      color: var(--muted);
    }
    .name-input-row input {
      flex: 1;
      min-width: 140px;
      height: 44px;
      padding: 0 14px;
      border: 1.6px solid var(--line);
      border-radius: 12px;
      font-family: var(--body);
      font-weight: 600;
      font-size: 14px;
      color: var(--ink);
      outline: 0;
    }
    .name-input-row input:focus { border-color: var(--accent); }
    .name-actions { display: flex; gap: 10px; }
    .btn-ghost {
      flex: 1;
      height: 52px;
      border-radius: 15px;
      background: var(--white);
      border: 1.6px solid var(--line);
      font-family: var(--display);
      font-weight: 700;
      font-size: 14px;
      color: var(--muted);
      cursor: pointer;
      transition: 0.15s;
    }
    .btn-ghost:hover { background: var(--bg); }
    .btn-ghost:disabled { opacity: 0.5; cursor: default; }
  `,
})
export class Profile implements OnInit {
  private readonly passkeyService = inject(PasskeyService);
  private readonly deviceService = inject(DeviceService);
  private readonly fingerprintService = inject(FingerprintService);
  protected readonly authService = inject(AuthService);

  protected readonly passkeys = signal<PasskeyItem[]>([]);
  protected readonly devices = signal<Device[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showNameInput = signal(false);
  protected readonly customName = signal('');
  protected readonly platformPrefix = signal('');
  private pendingFingerprint = '';

  protected readonly unattachedPasskeys = computed(() =>
    this.passkeys().filter((pk) => pk.deviceId == null),
  );

  protected readonly showBiometricNotice = computed(() =>
    this.authService.isFullyAuthenticated()
    && this.devices().length === 0
    && this.unattachedPasskeys().length === 0,
  );

  ngOnInit() {
    this.loadDevices();
    this.loadPasskeys();
  }

  protected passkeysForDevice(deviceId: number): PasskeyItem[] {
    return this.passkeys().filter((pk) => pk.deviceId === deviceId);
  }

  private loadDevices() {
    this.deviceService.getDevices().subscribe({
      next: (list) => this.devices.set(list),
    });
  }

  private loadPasskeys() {
    this.passkeyService.getPasskeys().subscribe({
      next: (list) => this.passkeys.set(list),
      error: () => this.error.set('Error al cargar huellas'),
    });
  }

  protected async onRegisterPasskey() {
    this.error.set(null);
    try {
      const fingerprint = await this.fingerprintService.getFingerprint();
      const existing = this.devices().find((d) => d.deviceFingerprint === fingerprint);

      if (existing?.id) {
        this.loading.set(true);
        await this.passkeyService.registerPasskey(existing.id);
        this.loadPasskeys();
        this.loading.set(false);
        return;
      }

      this.pendingFingerprint = fingerprint;
      this.platformPrefix.set(navigator.platform || 'Unknown');
      this.customName.set('');
      this.showNameInput.set(true);
    } catch (err: any) {
      this.error.set(err.message ?? 'Error al registrar huella');
    }
  }

  protected async onConfirmName() {
    if (!this.customName().trim() || !this.pendingFingerprint) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const fullName = `${this.platformPrefix()} + ${this.customName().trim()}`;
      const newDevice = await firstValueFrom(
        this.deviceService.registerDevice(fullName, this.pendingFingerprint),
      );
      this.showNameInput.set(false);
      this.loadDevices();
      await this.passkeyService.registerPasskey(newDevice.id);
      this.loadPasskeys();
    } catch (err: any) {
      this.error.set(err.message ?? 'Error al registrar dispositivo');
    } finally {
      this.loading.set(false);
    }
  }

  protected onCancelName() {
    this.showNameInput.set(false);
    this.pendingFingerprint = '';
    this.customName.set('');
  }

  protected onToggleTrust(id: number) {
    this.loading.set(true);
    this.deviceService.toggleTrust(id).subscribe({
      next: () => {
        this.loadDevices();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al cambiar confianza');
      },
    });
  }

  protected onDeleteDevice(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.deviceService.deleteDevice(id).subscribe({
      next: () => {
        this.loadDevices();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al eliminar dispositivo');
      },
    });
  }

  protected onDeletePasskey(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.passkeyService.deletePasskey(id).subscribe({
      next: () => {
        this.loadPasskeys();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al eliminar');
      },
    });
  }

  protected onLogout() {
    this.authService.logout();
  }
}
