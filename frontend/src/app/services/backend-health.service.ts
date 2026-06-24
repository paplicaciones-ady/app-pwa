import { Injectable, inject, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BackendHealthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly isHealthy = signal(true);

  private consecutiveFailures = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  init() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.check();
    this.timer = setInterval(() => this.check(), 10_000);
    this.destroyRef.onDestroy(() => {
      if (this.timer) clearInterval(this.timer);
    });
  }

  private async check() {
    try {
      await firstValueFrom(
        this.http.get<{ status: string }>('/api/health').pipe(timeout(5_000)),
      );
      this.consecutiveFailures = 0;
      this.isHealthy.set(true);
    } catch {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 2) {
        this.isHealthy.set(false);
      }
    }
  }
}
