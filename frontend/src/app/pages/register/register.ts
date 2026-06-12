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
    <div class="container">
      <h2>Crear cuenta</h2>

      @if (error(); as e) {
        <div class="error">{{ e }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <input formControlName="email" type="email" placeholder="Email" autocomplete="email" />
        <input formControlName="password" type="password" placeholder="Contraseña (mín. 6 caracteres)" autocomplete="new-password" />
        <input formControlName="confirmPassword" type="password" placeholder="Confirmar contraseña" autocomplete="new-password" />
        @if (form.errors?.['passwordsMismatch'] && form.touched) {
          <small class="field-error">Las contraseñas no coinciden</small>
        }
        <button type="submit" [disabled]="loading() || form.invalid">Crear cuenta</button>
      </form>

      <a routerLink="/login">¿Ya tienes cuenta? Inicia sesión</a>
    </div>
  `,
  styles: `
    .container { max-width: 360px; margin: 4rem auto; padding: 2rem; font-family: sans-serif; }
    h2 { text-align: center; margin-bottom: 1.5rem; }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
    button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; background: #007bff; color: #fff; }
    button:disabled { opacity: 0.5; cursor: default; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
    .field-error { color: #721c24; font-size: 0.8rem; margin-top: -0.5rem; }
    a { display: block; text-align: center; margin-top: 1rem; color: #007bff; text-decoration: none; }
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
      this.router.navigate(['/profile']);
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
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al registrarse');
      },
    });
  }
}
