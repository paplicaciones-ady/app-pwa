import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="container">
      <p>{{ message }}</p>
    </div>
  `,
  styles: `
    .container { display: flex; justify-content: center; align-items: center; min-height: 50vh; font-family: sans-serif; }
    p { font-size: 1.1rem; color: #555; }
  `,
})
export class AuthCallback implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected message = 'Procesando inicio de sesión…';

  ngOnInit() {
    const params = this.route.snapshot.queryParams;

    if (params['error']) {
      this.message = 'Error al iniciar sesión con Microsoft. Redirigiendo…';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    const token = params['token'];
    const isNewUser = params['isNewUser'] === 'true';

    if (!token) {
      this.message = 'No se recibió el token. Redirigiendo…';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    this.authService.setSession(token);
    this.router.navigate([isNewUser ? '/profile' : '/home']);
  }
}
