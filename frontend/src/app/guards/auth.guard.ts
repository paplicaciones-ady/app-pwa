import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.initComplete;

  if (authService.isLoggedIn()) return true;
  if (authService.guestMode() && state.url.startsWith('/herragro')) return true;
  return router.parseUrl('/login');
};
