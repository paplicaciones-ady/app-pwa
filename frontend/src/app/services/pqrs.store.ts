import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { Pqrs, PqrsService } from './pqrs.service';
import { IndexedDbService } from './indexed-db.service';

@Injectable({ providedIn: 'root' })
export class PqrsStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pqrsService = inject(PqrsService);
  private readonly indexedDb = inject(IndexedDbService);

  readonly allPqrs = signal<Pqrs[]>([]);
  readonly syncStatus = signal<'idle' | 'loading' | 'error'>('idle');
  readonly lastSyncAt = signal<number | null>(null);

  async loadPqrs(): Promise<void> {
    const cached = await this.loadFromIdb();
    if (cached.length > 0) {
      this.allPqrs.set(cached);
    }

    this.syncStatus.set('loading');
    try {
      const fresh = await lastValueFrom(this.pqrsService.getAll());
      this.allPqrs.set(fresh);
      await this.saveToIdb(fresh);
      this.syncStatus.set('idle');
      this.lastSyncAt.set(Date.now());
    } catch {
      if (cached.length === 0) {
        this.syncStatus.set('error');
      } else {
        this.syncStatus.set('idle');
      }
    }
  }

  async createPqrs(data: {
    type: string;
    title: string;
    description: string;
    productId: number;
  }): Promise<Pqrs> {
    const created = await lastValueFrom(this.pqrsService.create(data));
    this.allPqrs.update(list => [...list, created]);
    if (isPlatformBrowser(this.platformId)) {
      await this.indexedDb.put('pqrs', created);
    }
    return created;
  }

  private async loadFromIdb(): Promise<Pqrs[]> {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      return await this.indexedDb.getAll<Pqrs>('pqrs');
    } catch {
      return [];
    }
  }

  private async saveToIdb(list: Pqrs[]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await this.indexedDb.clear('pqrs');
      for (const pqrs of list) {
        await this.indexedDb.put('pqrs', pqrs);
      }
    } catch {
      /* IDB no disponible */
    }
  }
}
