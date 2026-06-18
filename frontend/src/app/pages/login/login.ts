import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';
import { FingerprintService } from '../../services/fingerprint.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h2>Iniciar sesión</h2>

      @if (deviceStatus(); as d) {
        <div class="device-status" [class.registered]="d.registered">
          @if (d.registered) {
            ✓ Dispositivo: {{ d.deviceName }} — {{ d.userName ?? d.userEmail }}
          } @else {
            ✗ Dispositivo no registrado
          }
        </div>
      }

      @if (error(); as e) {
        <div class="error">{{ e }}</div>
      }

      <button class="microsoft-btn" (click)="onMicrosoftLogin()" [disabled]="loading()">
        Continuar con Microsoft
      </button>

      <hr />

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <input formControlName="email" type="email" placeholder="Email" autocomplete="email" />
        <input formControlName="password" type="password" placeholder="Contraseña" autocomplete="current-password" />
        <button type="submit" [disabled]="loading() || form.invalid">Iniciar sesión</button>
      </form>

      <button class="passkey-btn" (click)="onPasskeyLogin()" [disabled]="loading() || !form.value.email">
        Usar huella
      </button>

      <a routerLink="/register">¿No tienes cuenta? Registrarse</a>
    </div>
  `,
  styles: `
    .container { max-width: 360px; margin: 4rem auto; padding: 2rem; font-family: sans-serif; }
    h2 { text-align: center; margin-bottom: 1.5rem; }
    hr { margin: 1rem 0; border: none; border-top: 1px solid #ddd; }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
    button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
    .microsoft-btn { width: 100%; background: #2f2f2f; color: #fff; font-weight: 600; }
    .passkey-btn { margin-top: 0.5rem; background: #28a745; color: #fff; width: 100%; }
    .blue-btn { background: #007bff; color: #fff; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
    .device-status { padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; text-align: center; background: #f8d7da; color: #721c24; }
    .device-status.registered { background: #d4edda; color: #155724; }
    a { display: block; text-align: center; margin-top: 1rem; color: #007bff; text-decoration: none; }
  `,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly fingerprintService = inject(FingerprintService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly deviceStatus = signal<{ registered: boolean; deviceName?: string; userName?: string | null; userEmail?: string | null } | null>(null);

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
      const resp = await firstValueFrom(
        this.http.post<{ registered: boolean; deviceName?: string; userName?: string | null; userEmail?: string | null }>('/api/devices/check', { fingerprint }),
      );
      this.deviceStatus.set(resp);
    } catch {
      // ignore — no internet or backend down
    }
  }

  protected async onMicrosoftLogin() {
    console.log('[Microsoft Login] Iniciando flujo de login con Microsoft');
    this.error.set(null);
    this.loading.set(true);

    try {
      const resp = await firstValueFrom(
        this.http.get<{ url: string }>('/api/auth/microsoft/login'),
      );
      console.log('[Microsoft Login] URL recibida del backend:', resp.url);
      window.location.href = resp.url;
    } catch (err) {
      console.error('[Microsoft Login] Error al obtener URL de Microsoft:', err);
      this.error.set('Error al conectar con Microsoft');
      this.loading.set(false);
    }
  }

  protected onSubmit() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.loading.set(true);

    const { email, password } = this.form.value as { email: string; password: string };
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al iniciar sesión');
      },
    });
  }

  protected async onPasskeyLogin() {
    const email = this.form.value.email;
    if (!email) return;

    this.error.set(null);
    this.loading.set(true);

    try {
      const token = await this.passkeyService.loginPasskey(email);
      this.authService.setSession(token);
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.error.set(err.message ?? 'Error con la huella');
    } finally {
      this.loading.set(false);
    }
  }
}
