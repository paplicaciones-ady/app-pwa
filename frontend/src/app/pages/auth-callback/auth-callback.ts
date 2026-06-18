import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);

  protected message = 'Procesando inicio de sesión…';

  ngOnInit() {
    const url = this.router.url;
    const params = this.route.snapshot.queryParams;
    console.log('[AuthCallback] URL actual:', url);
    console.log('[AuthCallback] Query params recibidos:', { ...params });
    if (isPlatformBrowser(this.platformId)) {
      console.log('[AuthCallback] Location href:', window.location.href);
    }

    if (params['error']) {
      console.log('[AuthCallback] Error recibido:', params['error']);
      this.message = 'Error al iniciar sesión con Microsoft. Redirigiendo…';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    const token = params['token'];
    const isNewUser = params['isNewUser'] === 'true';
    console.log('[AuthCallback] Token presente:', !!token, '| isNewUser:', isNewUser);

    if (!token) {
      console.warn('[AuthCallback] No se recibió token en la URL');
      this.message = 'No se recibió el token. Redirigiendo…';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    console.log('[AuthCallback] Llamando setSession con token (primeros 50 chars):', token.slice(0, 50));
    this.authService.setSession(token, 'microsoft');
    const destino = isNewUser ? '/profile' : '/home';
    console.log('[AuthCallback] Redirigiendo a:', destino);
    this.router.navigate([destino]);
  }
}
