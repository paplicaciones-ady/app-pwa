import { Injectable, inject, signal, PLATFORM_ID, effect, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreatePqrsData, Pqrs } from './pqrs.service';
import { IndexedDbService } from './indexed-db.service';
import { ConnectivityService } from './connectivity.service';

export interface PendingPqrs {
  localId: string;
  type: string;
  title: string;
  description: string;
  productId: number;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
  nextRetryAt?: number;
}

@Injectable({ providedIn: 'root' })
export class PqrsSyncService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly indexedDb = inject(IndexedDbService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly RETRY_BASE_MS = 1_000;
  private readonly RETRY_MAX_MS = 60_000;
  private readonly RETRY_JITTER_MS = 500;
  private readonly MAX_RETRIES = 10;
  private readonly MAX_CONCURRENT = 3;

  readonly pendingPqrs = signal<PendingPqrs[]>([]);
  private flushing = false;
  private onItemConfirmedCb: ((created: Pqrs, localId: string) => void) | null = null;
  private scheduledFlushTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.migrateFromOldDb();
      this.loadFromDb();
    }

    effect(() => {
      if (this.connectivity.isOnline()) {
        this.cancelScheduledFlush();
        this.flush();
      }
    });

    this.destroyRef.onDestroy(() => this.cancelScheduledFlush());
  }

  registerOnItemConfirmed(cb: (created: Pqrs, localId: string) => void): void {
    this.onItemConfirmedCb = cb;
  }

  /** Migración única: pasa datos de pwa-app-queue → pwa-app.outbox */
  private async migrateFromOldDb() {
    const oldDbName = 'pwa-app-queue';
    const oldStoreName = 'pending_pqrs';

    const exists = await this.oldDbExists(oldDbName);
    if (!exists) return;

    try {
      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const req = indexedDB.open(oldDbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (!db) return;

      const items = await new Promise<PendingPqrs[]>((resolve) => {
        const tx = db.transaction(oldStoreName, 'readonly');
        const req = tx.objectStore(oldStoreName).getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => resolve([]);
      });

      for (const item of items) {
        await this.indexedDb.put('outbox', item);
      }

      db.close();
      indexedDB.deleteDatabase(oldDbName);
    } catch {
      /* migración falló, datos en pwa-app-queue se pierden */
    }
  }

  private async oldDbExists(name: string): Promise<boolean> {
    try {
      const dbs = await indexedDB.databases();
      return dbs.some(d => d.name === name);
    } catch {
      try {
        const db = await new Promise<IDBDatabase | null>((resolve) => {
          const req = indexedDB.open(name);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
        if (db) { db.close(); return true; }
        return false;
      } catch {
        return false;
      }
    }
  }

  queue(data: CreatePqrsData): PendingPqrs {
    const item: PendingPqrs = {
      localId: crypto.randomUUID(),
      type: data.type,
      title: data.title,
      description: data.description,
      productId: data.productId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      nextRetryAt: Date.now(),
    };

    this.pendingPqrs.update(list => [...list, item]);
    this.indexedDb.put('outbox', item);

    return item;
  }

  async flush(): Promise<void> {
    if (this.flushing) return;

    const items = await this.indexedDb.getAll<PendingPqrs>('outbox');
    const now = Date.now();
    const pendings = items.filter(
      i => (i.status === 'pending' || i.status === 'failed')
        && i.retryCount < this.MAX_RETRIES
        && (!i.nextRetryAt || i.nextRetryAt <= now),
    );
    if (pendings.length === 0) {
      this.scheduleNextFlush(items);
      return;
    }

    this.flushing = true;

    try {
      for (let i = 0; i < pendings.length; i += this.MAX_CONCURRENT) {
        const batch = pendings.slice(i, i + this.MAX_CONCURRENT);
        await Promise.all(batch.map(item => this.processItem(item)));
      }
    } finally {
      this.flushing = false;
    }

    const remaining = await this.indexedDb.getAll<PendingPqrs>('outbox');
    this.scheduleNextFlush(remaining);
  }

  private async processItem(item: PendingPqrs): Promise<void> {
    this.pendingPqrs.update(list =>
      list.map(i => i.localId === item.localId ? { ...i, status: 'syncing' as const } : i),
    );

    try {
      const created = await firstValueFrom(
        this.http.post<Pqrs>('/api/pqrs', {
          type: item.type,
          title: item.title,
          description: item.description,
          productId: item.productId,
        }),
      );
      await this.indexedDb.delete('outbox', item.localId);
      this.pendingPqrs.update(list => list.filter(i => i.localId !== item.localId));
      if (this.onItemConfirmedCb) {
        this.onItemConfirmedCb(created, item.localId);
      }
    } catch (e: any) {
      const newCount = item.retryCount + 1;
      const delay = this.calculateBackoff(newCount);
      const updated: PendingPqrs = {
        ...item,
        status: newCount >= this.MAX_RETRIES ? 'failed' : 'pending',
        retryCount: newCount,
        nextRetryAt: newCount >= this.MAX_RETRIES ? undefined : Date.now() + delay,
        lastError: e?.error?.message ?? e?.message ?? 'Error de conexión',
      };
      this.pendingPqrs.update(list =>
        list.map(i => i.localId === item.localId ? updated : i),
      );
      this.indexedDb.put('outbox', updated);
    }
  }

  private calculateBackoff(retryCount: number): number {
    const exponential = Math.min(
      this.RETRY_BASE_MS * Math.pow(2, retryCount - 1),
      this.RETRY_MAX_MS,
    );
    const jitter = Math.random() * this.RETRY_JITTER_MS * 2 - this.RETRY_JITTER_MS;
    return Math.max(0, exponential + jitter);
  }

  private scheduleNextFlush(items: PendingPqrs[]): void {
    this.cancelScheduledFlush();

    const futures = items.filter(
      r => (r.status === 'pending' || r.status === 'failed')
        && r.nextRetryAt != null
        && r.nextRetryAt > Date.now()
        && r.retryCount < this.MAX_RETRIES,
    );
    if (futures.length === 0) return;

    const next = Math.min(...futures.map(r => r.nextRetryAt!));
    const delay = Math.max(0, next - Date.now());
    this.scheduledFlushTimeout = setTimeout(() => this.flush(), delay);
  }

  private cancelScheduledFlush(): void {
    if (this.scheduledFlushTimeout) {
      clearTimeout(this.scheduledFlushTimeout);
      this.scheduledFlushTimeout = null;
    }
  }

  async retryItem(localId: string): Promise<void> {
    const items = await this.indexedDb.getAll<PendingPqrs>('outbox');
    const item = items.find(i => i.localId === localId);
    if (!item) return;

    const updated: PendingPqrs = {
      ...item,
      status: 'pending',
      retryCount: 0,
      nextRetryAt: Date.now(),
      lastError: undefined,
    };
    this.pendingPqrs.update(list =>
      list.map(i => i.localId === localId ? updated : i),
    );
    await this.indexedDb.put('outbox', updated);
    this.cancelScheduledFlush();
    this.flush();
  }

  async discardItem(localId: string): Promise<void> {
    await this.indexedDb.delete('outbox', localId);
    this.pendingPqrs.update(list => list.filter(i => i.localId !== localId));

    const remaining = await this.indexedDb.getAll<PendingPqrs>('outbox');
    this.scheduleNextFlush(remaining);
  }

  async loadFromDb(): Promise<void> {
    try {
      const items = await this.indexedDb.getAll<PendingPqrs>('outbox');
      this.pendingPqrs.set(items);
    } catch {
      /* IDB may not be available */
    }
  }
}
