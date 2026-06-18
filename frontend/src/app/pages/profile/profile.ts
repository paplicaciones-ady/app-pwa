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
    <div class="container">
      <h2>Mi perfil</h2>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">Email</span>
          <span class="value">{{ authService.currentUser()?.email }}</span>
        </div>
        <div class="info-item">
          <span class="label">Nombre</span>
          <span class="value">{{ authService.currentUser()?.name || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Microsoft ID</span>
          <span class="value">{{ authService.currentUser()?.microsoftId ?? '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Cuenta Microsoft</span>
          <span class="value">{{ authService.currentUser()?.microsoftId ? 'Vinculada' : 'No vinculada' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Registrado</span>
          <span class="value">{{ (authService.currentUser()?.createdAt | date:'medium') || '—' }}</span>
        </div>
      </div>

      @if (error(); as e) {
        <div class="error">{{ e }}</div>
      }

      <h3>Dispositivos</h3>

      @if (devices().length === 0 && unattachedPasskeys().length === 0) {
        <p class="empty">No tienes dispositivos registrados</p>
      }

      @for (d of devices(); track d.id) {
        <div class="device-card">
          <div class="device-header">
            <strong>{{ d.deviceName }}</strong>
            <span class="trust-badge" [class.trusted]="d.isTrusted">
              {{ d.isTrusted ? 'Confiado' : 'No confiado' }}
            </span>
            <span class="device-date">— {{ d.createdAt | date }}</span>
          </div>

          <div class="device-passkeys">
            @for (pk of passkeysForDevice(d.id); track pk.id) {
              <div class="passkey-row">
                <span>Huella — {{ pk.createdAt | date }}</span>
                <button class="small-btn delete-btn" (click)="onDeletePasskey(pk.id)" [disabled]="loading()">Eliminar</button>
              </div>
            }
            @if (passkeysForDevice(d.id).length === 0) {
              <span class="no-passkeys">Sin huellas registradas</span>
            }
          </div>

          <div class="device-actions">
            <button class="small-btn toggle-btn" (click)="onToggleTrust(d.id)" [disabled]="loading()">
              {{ d.isTrusted ? 'Desconfiar' : 'Confiar' }}
            </button>
            <button class="small-btn delete-btn" (click)="onDeleteDevice(d.id)" [disabled]="loading()">Eliminar</button>
          </div>
        </div>
      }

      @if (unattachedPasskeys().length > 0) {
        <div class="unattached-section">
          <h4>Huellas sin dispositivo</h4>
          @for (pk of unattachedPasskeys(); track pk.id) {
            <div class="passkey-row">
              <span>{{ pk.deviceName || 'Huella' }} — {{ pk.createdAt | date }}</span>
              <button class="small-btn delete-btn" (click)="onDeletePasskey(pk.id)" [disabled]="loading()">Eliminar</button>
            </div>
          }
        </div>
      }

      <button class="primary-btn" (click)="onRegisterPasskey()" [disabled]="loading()">
        {{ loading() ? 'Registrando...' : 'Registrar huella' }}
      </button>
      <button class="logout-btn" (click)="onLogout()">Cerrar sesión</button>
    </div>
  `,
  styles: `
    .container { max-width: 480px; margin: 3rem auto; padding: 2rem; font-family: sans-serif; }
    h2 { text-align: center; }
    h3 { margin-top: 2rem; }
    h4 { margin: 0.5rem 0; font-size: 0.9rem; color: #666; }
    .info-grid { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
    .info-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    .label { color: #666; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-weight: 600; }
    .empty { color: #888; font-size: 0.9rem; }
    .device-card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .device-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .device-date { color: #888; font-size: 0.85rem; }
    .trust-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; background: #f0f0f0; color: #666; }
    .trust-badge.trusted { background: #d4edda; color: #155724; }
    .device-passkeys { margin-bottom: 0.75rem; padding-left: 0.5rem; border-left: 2px solid #eee; }
    .passkey-row { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; font-size: 0.9rem; }
    .no-passkeys { font-size: 0.85rem; color: #aaa; }
    .device-actions { display: flex; gap: 0.5rem; }
    .unattached-section { margin-top: 1rem; padding: 0.5rem; background: #f9f9f9; border-radius: 6px; }
    button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
    .small-btn { padding: 0.4rem 0.75rem; font-size: 0.85rem; }
    .primary-btn { display: block; width: 100%; margin-top: 1.5rem; background: #007bff; color: #fff; }
    .delete-btn { background: #dc3545; color: #fff; }
    .toggle-btn { background: #ffc107; color: #000; }
    .logout-btn { display: block; width: 100%; margin-top: 0.75rem; background: #6c757d; color: #fff; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
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

  protected readonly unattachedPasskeys = computed(() =>
    this.passkeys().filter((pk) => pk.deviceId == null),
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
    this.loading.set(true);
    this.error.set(null);
    try {
      const fingerprint = await this.fingerprintService.getFingerprint();
      const existing = this.devices().find((d) => d.deviceFingerprint === fingerprint);
      let deviceId = existing?.id;

      if (!deviceId) {
        const name = navigator.platform || 'Dispositivo';
        const newDevice = await firstValueFrom(this.deviceService.registerDevice(name, fingerprint));
        deviceId = newDevice.id;
        this.loadDevices();
      }

      await this.passkeyService.registerPasskey(deviceId);
      this.loadPasskeys();
    } catch (err: any) {
      this.error.set(err.message ?? 'Error al registrar huella');
    } finally {
      this.loading.set(false);
    }
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
