import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-page">
      <div class="register-head">
        <h2>Crear cuenta</h2>
        <p>Regístrate para comenzar</p>
      </div>

      <div class="register-body">
        @if (error(); as e) {
          <div class="error-msg">{{ e }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="register-form">
          <div class="field">
            <label>Email</label>
            <div class="inp">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <input formControlName="email" type="email" placeholder="usuario@empresa.com" autocomplete="email" />
            </div>
          </div>
          <div class="field">
            <label>Contraseña</label>
            <div class="inp">
              <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/></svg>
              <input formControlName="password" type="password" placeholder="Mín. 6 caracteres" autocomplete="new-password" />
            </div>
          </div>
          <div class="field">
            <label>Confirmar contraseña</label>
            <div class="inp">
              <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/></svg>
              <input formControlName="confirmPassword" type="password" placeholder="Repite la contraseña" autocomplete="new-password" />
            </div>
          </div>
          @if (form.errors?.['passwordsMismatch'] && form.touched) {
            <p class="field-error">Las contraseñas no coinciden</p>
          }
          <button type="submit" class="btn btn-primary" [disabled]="loading() || form.invalid">
            {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <a routerLink="/login" class="link-like" style="display:block;text-align:center;margin-top:20px;">¿Ya tienes cuenta? Inicia sesión</a>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .register-page { display: flex; flex-direction: column; min-height: 100vh; }
    .register-head {
      background: linear-gradient(155deg, #1356a0, var(--blue) 60%, #0d3970);
      padding: 48px 24px 40px;
      text-align: center;
    }
    .register-head h2 {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 24px;
    }
    .register-head p { color: #bcd6f4; font-size: 13px; margin-top: 6px; }
    .register-body {
      flex: 1;
      background: var(--bg);
      border-radius: 24px 24px 0 0;
      margin-top: -24px;
      padding: 24px 20px 40px;
      position: relative;
      z-index: 3;
    }
    .register-form {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 18px;
      padding: 20px 18px;
    }
    .field-error {
      font-size: 12px;
      color: var(--accent);
      font-weight: 600;
      margin-top: -8px;
      margin-bottom: 12px;
    }
  `,
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, { validators: passwordsMatchValidator });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  protected onSubmit() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.loading.set(true);

    const { email, password } = this.form.value as { email: string; password: string };
    this.authService.register(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al registrarse');
      },
    });
  }
}
