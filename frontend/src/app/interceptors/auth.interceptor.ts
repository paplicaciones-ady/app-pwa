import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.tokenValue();

  const skipPaths = ['/auth/login', '/auth/passkey/login', '/auth/microsoft'];
  const shouldSkip = skipPaths.some((p) => req.url.includes(p));

  if (token && !shouldSkip) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }
  return next(req);
};
