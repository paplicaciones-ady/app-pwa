import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, lastValueFrom } from 'rxjs';
import { IndexedDbService } from './indexed-db.service';
import { MicrosoftAuthService } from './microsoft-auth.service';

export interface User {
  id: number;
  email: string;
  name: string | null;
  microsoftId: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly indexedDb = inject(IndexedDbService);
  private readonly router = inject(Router);
  private readonly microsoftAuthService = inject(MicrosoftAuthService);

  private readonly token = signal<string | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly tokenValue = this.token.asReadonly();

  private _initResolve!: () => void;
  readonly initComplete: Promise<void>;

  constructor() {
    this.initComplete = new Promise((resolve) => {
      this._initResolve = resolve;
    });
  }

  readonly microsoftSession = signal<User | null>(null);
  readonly localSession = signal(false);
  readonly authLevel = computed<'none' | 'local' | 'full'>(() => {
    if (!this.isLoggedIn()) return 'none';
    return this.microsoftSession() ? 'full' : 'local';
  });
  readonly isFullyAuthenticated = computed(() => this.authLevel() === 'full');
  readonly deviceFingerprint = signal<string | null>(null);
  readonly guestMode = signal(false);

  async init() {
    if (!isPlatformBrowser(this.platformId)) {
      this._initResolve();
      return;
    }

    const fp = await this.indexedDb.get<string>('auth', 'deviceUuid');
    if (fp) this.deviceFingerprint.set(fp);

    const stored = await this.indexedDb.getToken();
    if (!stored) {
      this._initResolve();
      return;
    }
    this.token.set(stored);

    const method = await this.indexedDb.getAuthMethod();
    if (method === 'local') this.localSession.set(true);

    const user = await this.fetchUser();

    if (method === 'microsoft') {
      this.microsoftSession.set(user);
    } else if (method === 'local') {
      try {
        await lastValueFrom(this.microsoftAuthService.refreshToken());
        this.microsoftSession.set(this.currentUser());
      } catch {
        // Microsoft refresh failed, stay at local level
      }
    }

    this._initResolve();
  }

  private async fetchUser(): Promise<User | null> {
    try {
      const user = await lastValueFrom(this.http.get<User>('/api/auth/me'));
      this.currentUser.set(user);
      return user;
    } catch {
      this.currentUser.set(null);
      return null;
    }
  }

  register(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>('/api/auth/register', { email, password }).pipe(
      tap(async (res) => {
        this.token.set(res.access_token);
        await this.indexedDb.setToken(res.access_token);
        this.fetchUser();
      }),
    );
  }

  login(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>('/api/auth/login', { email, password }).pipe(
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
    this.microsoftSession.set(null);
    this.localSession.set(false);
    this.deviceFingerprint.set(null);
    this.guestMode.set(false);
    await this.indexedDb.removeToken();
    await this.indexedDb.removeAuthMethod();
    await this.indexedDb.removeDeviceCheck();
    this.router.navigate(['/login']);
  }

  async setSession(accessToken: string, authMethod: 'local' | 'microsoft') {
    this.token.set(accessToken);
    await this.indexedDb.setToken(accessToken);
    await this.indexedDb.setAuthMethod(authMethod);
    this.localSession.set(authMethod === 'local');
    const user = await this.fetchUser();
    if (authMethod === 'microsoft') {
      this.microsoftSession.set(user);
    } else {
      try {
        await lastValueFrom(this.microsoftAuthService.refreshToken());
        this.microsoftSession.set(this.currentUser());
      } catch {
        // Microsoft refresh not available, stay at local level
      }
    }
  }

  enableGuestMode() {
    this.guestMode.set(true);
  }

  /** Solo para debug: invalida la sesión Microsoft en memoria sin hacer logout */
  clearMicrosoftSession() {
    this.microsoftSession.set(null);
    this.localSession.set(true);
  }

  async tryUpgradeSession(): Promise<boolean> {
    if (!this.localSession() || this.isFullyAuthenticated()) return false;
    try {
      await lastValueFrom(this.microsoftAuthService.refreshToken());
      this.microsoftSession.set(this.currentUser());
      return true;
    } catch {
      return false;
    }
  }
}
