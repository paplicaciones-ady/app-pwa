import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MicrosoftAuthService {
  private readonly http = inject(HttpClient);

  async login(redirectTo?: string): Promise<void> {
    const params = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
    const resp = await lastValueFrom(
      this.http.get<{ url: string }>(`/api/auth/microsoft/login${params}`),
    );
    window.location.href = resp.url;
  }

  refreshToken(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('/api/auth/microsoft/refresh', {});
  }
}
