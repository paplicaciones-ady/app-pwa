import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { IndexedDbService } from './indexed-db.service';

export interface User {
  id: number;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly indexedDb = inject(IndexedDbService);
  private readonly router = inject(Router);

  private readonly token = signal<string | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly tokenValue = this.token.asReadonly();

  async init() {
    if (!isPlatformBrowser(this.platformId)) return;
    const stored = await this.indexedDb.getToken();
    if (!stored) return;
    this.token.set(stored);
    this.fetchUser();
  }

  private fetchUser() {
    this.http.get<User>('/api/auth/me').subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.logout(),
    });
  }

  register(email: string, password: string): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>('/api/auth/register', { email, password })
      .pipe(
        tap(async (res) => {
          this.token.set(res.access_token);
          await this.indexedDb.setToken(res.access_token);
          this.fetchUser();
        }),
      );
  }

  login(email: string, password: string): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>('/api/auth/login', { email, password })
      .pipe(
        tap(async (res) => {
          this.token.set(res.access_token);
          await this.indexedDb.setToken(res.access_token);
          this.fetchUser();
        }),
      );
  }

  async logout() {
    this.token.set(null);
    this.currentUser.set(null);
    await this.indexedDb.removeToken();
    this.router.navigate(['/login']);
  }

  setSession(accessToken: string) {
    this.token.set(accessToken);
    this.indexedDb.setToken(accessToken);
    this.fetchUser();
  }
}
