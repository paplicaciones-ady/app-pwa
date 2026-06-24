import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { Pqrs, PqrsService } from './pqrs.service';
import { ProductService, Product } from './product.service';
import { IndexedDbService } from './indexed-db.service';
import { PqrsSyncService } from './pqrs-sync.service';
import { ConnectivityService } from './connectivity.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PqrsStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pqrsService = inject(PqrsService);
  private readonly productService = inject(ProductService);
  private readonly indexedDb = inject(IndexedDbService);
  private readonly syncService = inject(PqrsSyncService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly authService = inject(AuthService);

  readonly allPqrs = signal<Pqrs[]>([]);
  readonly syncStatus = signal<'idle' | 'loading' | 'error'>('idle');
  readonly lastSyncAt = signal<number | null>(null);

  /** Pending items from the outbox (exposed signal from PqrsSyncService) */
  readonly pendingPqrs = this.syncService.pendingPqrs;

  /** Combined view: pending items (top) + synced items */
  readonly visiblePqrs = computed(() => {
    const synced = this.allPqrs();
    const pending = this.pendingPqrs();
    const products = this.products();
    const user = this.authService.currentUser();

    const pendingMapped: Pqrs[] = pending.map(p => {
      const product = products.find(pr => pr.id === p.productId);
      return {
        id: 0,
        _localId: p.localId,
        _status: p.status,
        _lastError: p.lastError,
        type: p.type,
        title: p.title,
        description: p.description,
        productId: p.productId,
        productName: product?.name ?? '—',
        userId: user?.id ?? 0,
        userEmail: user?.email ?? '—',
        createdAt: p.createdAt,
      };
    });
    return [...pendingMapped, ...synced];
  });

  readonly products = signal<Product[]>([]);
  readonly productsSyncStatus = signal<'idle' | 'loading' | 'error'>('idle');

  constructor() {
    // When a pending item is confirmed by the API via PqrsSyncService,
    // add it to allPqrs + persist in IDB
    this.syncService.registerOnItemConfirmed((created) => {
      this.allPqrs.update(list => [...list, created]);
      if (isPlatformBrowser(this.platformId)) {
        this.indexedDb.put('pqrs', created);
      }
    });
  }

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
    if (this.connectivity.isOnline()) {
      const created = await lastValueFrom(this.pqrsService.create(data));
      this.allPqrs.update(list => [...list, created]);
      if (isPlatformBrowser(this.platformId)) {
        await this.indexedDb.put('pqrs', created);
      }
      return created;
    }

    // Offline: queue to outbox for later sync
    const pending = this.syncService.queue(data);
    const product = this.products().find(pr => pr.id === data.productId);
    const user = this.authService.currentUser();
    return {
      id: 0,
      _localId: pending.localId,
      _status: pending.status,
      type: pending.type,
      title: pending.title,
      description: pending.description,
      productId: pending.productId,
      productName: product?.name ?? '—',
      userId: user?.id ?? 0,
      userEmail: user?.email ?? '—',
      createdAt: pending.createdAt,
    } as Pqrs;
  }

  async retryItem(localId: string): Promise<void> {
    await this.syncService.retryItem(localId);
  }

  async discardItem(localId: string): Promise<void> {
    await this.syncService.discardItem(localId);
  }

  async loadProducts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const cached = await this.loadProductsFromIdb();
    if (cached.length > 0) {
      this.products.set(cached);
    }

    this.productsSyncStatus.set('loading');
    try {
      const fresh = await lastValueFrom(this.productService.getAll());
      this.products.set(fresh);
      await this.saveProductsToIdb(fresh);
      this.productsSyncStatus.set('idle');
    } catch {
      if (cached.length === 0) {
        this.productsSyncStatus.set('error');
      } else {
        this.productsSyncStatus.set('idle');
      }
    }
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

  private async loadProductsFromIdb(): Promise<Product[]> {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      return await this.indexedDb.getAll<Product>('products');
    } catch {
      return [];
    }
  }

  private async saveProductsToIdb(list: Product[]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await this.indexedDb.clear('products');
      for (const p of list) {
        await this.indexedDb.put('products', p);
      }
    } catch {
      /* IDB no disponible */
    }
  }
}
