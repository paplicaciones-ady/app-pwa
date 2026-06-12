import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/home" class="brand">PWA App</a>
      <div class="links">
        <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
        @if (authService.isLoggedIn()) {
          <a routerLink="/profile" routerLinkActive="active">Perfil</a>
          <a (click)="authService.logout()" class="logout">Cerrar sesión</a>
        } @else {
          <a routerLink="/login" routerLinkActive="active">Iniciar sesión</a>
          <a routerLink="/register" routerLinkActive="active">Registrarse</a>
        }
      </div>
    </nav>
  `,
  styles: `
    nav { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; background: #007bff; color: #fff; font-family: sans-serif; }
    .brand { font-weight: bold; font-size: 1.2rem; color: #fff; text-decoration: none; }
    .links { display: flex; gap: 1rem; align-items: center; }
    .links a { color: rgba(255,255,255,.85); text-decoration: none; font-size: .95rem; cursor: pointer; }
    .links a:hover, .active { color: #fff; text-decoration: underline; }
    .logout { background: none; border: none; color: rgba(255,255,255,.85); font-size: .95rem; cursor: pointer; }
    .logout:hover { color: #fff; text-decoration: underline; }
  `,
})
export class Navbar {
  protected readonly authService = inject(AuthService);
}
