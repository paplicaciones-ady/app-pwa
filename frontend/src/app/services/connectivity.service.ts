import { Injectable, inject, signal, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BackendHealthService } from './backend-health.service';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly backendHealth = inject(BackendHealthService);

  private readonly browserOnline = signal(true);

  readonly isOnline = computed(() => this.browserOnline() && this.backendHealth.isHealthy());

  private onlineHandler!: () => void;
  private offlineHandler!: () => void;

  init() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.browserOnline.set(navigator.onLine);
    this.listenToBrowserEvents();
  }

  private listenToBrowserEvents() {
    this.onlineHandler = () => this.browserOnline.set(true);
    this.offlineHandler = () => this.browserOnline.set(false);
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    });
  }
}
