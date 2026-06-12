import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h2>Iniciar sesión</h2>

      @if (error(); as e) {
        <div class="error">{{ e }}</div>
      }

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
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
    button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; background: #007bff; color: #fff; }
    button:disabled { opacity: 0.5; cursor: default; }
    .passkey-btn { margin-top: 0.5rem; background: #28a745; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
    a { display: block; text-align: center; margin-top: 1rem; color: #007bff; text-decoration: none; }
  `,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/profile']);
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
        this.router.navigate(['/profile']);
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
      this.router.navigate(['/profile']);
    } catch (err: any) {
      this.error.set(err.message ?? 'Error con la huella');
    } finally {
      this.loading.set(false);
    }
  }
}
