import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="auth-callback">
      <div class="callback-card">
        <div class="callback-spinner"></div>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .auth-callback {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 24px;
    }
    .callback-card {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 22px;
      padding: 40px 32px;
      text-align: center;
      max-width: 320px;
      width: 100%;
      box-shadow: 0 8px 30px -12px rgba(0,0,0,.12);
    }
    .callback-spinner {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid var(--line);
      border-top-color: var(--accent);
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p {
      font-family: var(--body);
      font-size: 14px;
      color: var(--muted);
      font-weight: 600;
    }
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
    const destino = isNewUser ? '/profile' : '/chat';
    console.log('[AuthCallback] Redirigiendo a:', destino);
    this.router.navigate([destino]);
  }
}
