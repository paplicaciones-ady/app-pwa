import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreatePqrsData } from './pqrs.service';
import { IndexedDbService } from './indexed-db.service';

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
}

@Injectable({ providedIn: 'root' })
export class PqrsSyncService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly indexedDb = inject(IndexedDbService);

  readonly pendingPqrs = signal<PendingPqrs[]>([]);
  private flushing = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.migrateFromOldDb();
      this.loadFromDb();
    }
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
      // indexedDB.databases() no soportado en este navegador
      // intentar abrir la DB para ver si existe
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
    };

    this.pendingPqrs.update(list => [...list, item]);
    this.indexedDb.put('outbox', item);

    return item;
  }

  async flush(): Promise<void> {
    if (this.flushing) return;

    const items = await this.indexedDb.getAll<PendingPqrs>('outbox');
    const pendings = items.filter(i => i.status === 'pending' || i.status === 'failed');
    if (pendings.length === 0) return;

    this.flushing = true;

    try {
      for (const item of pendings) {
        this.pendingPqrs.update(list =>
          list.map(i => i.localId === item.localId ? { ...i, status: 'syncing' as const } : i),
        );

        try {
          await firstValueFrom(
            this.http.post('/api/pqrs', {
              type: item.type,
              title: item.title,
              description: item.description,
              productId: item.productId,
            }),
          );
          await this.indexedDb.delete('outbox', item.localId);
          this.pendingPqrs.update(list => list.filter(i => i.localId !== item.localId));
        } catch (e: any) {
          const updated: PendingPqrs = {
            ...item,
            status: 'failed',
            retryCount: item.retryCount + 1,
            lastError: e?.error?.message ?? e?.message ?? 'Error de conexión',
          };
          this.pendingPqrs.update(list =>
            list.map(i => i.localId === item.localId ? updated : i),
          );
          this.indexedDb.put('outbox', updated);
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private async loadFromDb(): Promise<void> {
    try {
      const items = await this.indexedDb.getAll<PendingPqrs>('outbox');
      this.pendingPqrs.set(items);
    } catch {
      /* IDB may not be available */
    }
  }
}
