import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  readonly isOnline = signal(true);

  private timer: ReturnType<typeof setInterval> | null = null;

  init() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isOnline.set(navigator.onLine);
    this.listenToBrowserEvents();
    this.startHealthCheck();
    this.checkNow();
  }

  private listenToBrowserEvents() {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.checkNow();
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  private startHealthCheck() {
    this.timer = setInterval(() => this.checkNow(), 10_000);
  }

  async checkNow() {
    try {
      await firstValueFrom(
        this.http.get<{ status: string }>('/api/health').pipe(timeout(5_000)),
      );
      this.isOnline.set(true);
    } catch {
      this.isOnline.set(false);
    }
  }
}
