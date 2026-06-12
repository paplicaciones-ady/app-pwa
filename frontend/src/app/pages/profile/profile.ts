import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container">
      <h2>Mi perfil</h2>
      <p>Email: <strong>{{ authService.currentUser()?.email }}</strong></p>

      @if (error(); as e) {
        <div class="error">{{ e }}</div>
      }

      <h3>Mis dispositivos</h3>
      @if (passkeys().length === 0) {
        <p class="empty">No tienes dispositivos registrados</p>
      }
      @for (pk of passkeys(); track pk.id) {
        <div class="passkey-item">
          <span>{{ pk.deviceName || 'Dispositivo' }} — {{ pk.createdAt | date }}</span>
          <button class="delete-btn" (click)="onDelete(pk.id)" [disabled]="loading()">Eliminar</button>
        </div>
      }

      <button class="primary-btn" (click)="onRegister()" [disabled]="loading()">
        {{ loading() ? 'Registrando...' : 'Registrar huella' }}
      </button>
      <button class="logout-btn" (click)="onLogout()">Cerrar sesión</button>
    </div>
  `,
  styles: `
    .container { max-width: 480px; margin: 3rem auto; padding: 2rem; font-family: sans-serif; }
    h2 { text-align: center; }
    h3 { margin-top: 2rem; }
    .empty { color: #888; font-size: 0.9rem; }
    .passkey-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
    .primary-btn { display: block; width: 100%; margin-top: 1.5rem; background: #007bff; color: #fff; }
    .delete-btn { background: #dc3545; color: #fff; padding: 0.4rem 0.75rem; font-size: 0.85rem; }
    .logout-btn { display: block; width: 100%; margin-top: 0.75rem; background: #6c757d; color: #fff; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
  `,
})
export class Profile implements OnInit {
  private readonly passkeyService = inject(PasskeyService);
  protected readonly authService = inject(AuthService);

  protected readonly passkeys = signal<
    { id: number; deviceName?: string; createdAt: string }[]
  >([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loadPasskeys();
  }

  private loadPasskeys() {
    this.passkeyService.getPasskeys().subscribe({
      next: (list) => this.passkeys.set(list),
      error: () => this.error.set('Error al cargar dispositivos'),
    });
  }

  protected async onRegister() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.passkeyService.registerPasskey();
      this.loadPasskeys();
    } catch (err: any) {
      this.error.set(err.message ?? 'Error al registrar huella');
    } finally {
      this.loading.set(false);
    }
  }

  protected onDelete(id: number) {
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
