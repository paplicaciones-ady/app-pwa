import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dbName = 'pwa-app';
  private readonly version = 4;

  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private async getDb(): Promise<IDBDatabase | null> {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      const req = indexedDB.open(this.dbName, this.version);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'localId' });
        }
        if (!db.objectStoreNames.contains('pqrs')) {
          db.createObjectStore('pqrs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chat')) {
          db.createObjectStore('chat');
        }
      };

      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); };
        db.onclose = () => { this.dbPromise = null; };
        resolve(db);
      };

      req.onerror = () => {
        console.warn('IndexedDB no disponible:', req.error);
        this.dbPromise = null;
        resolve(null);
      };
    });

    return this.dbPromise;
  }

  // ── Genéricos ────────────────────────────────────────────────

  async get<T>(store: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => { console.warn(`IDB get(${store}) error:`, req.error); resolve(null); };
    });
  }

  async put(store: string, value: unknown, key?: IDBValidKey): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => console.warn(`IDB put(${store}) error:`, tx.error);
    });
  }

  async delete(store: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => console.warn(`IDB delete(${store}) error:`, tx.error);
    });
  }

  async clear(store: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => console.warn(`IDB clear(${store}) error:`, tx.error);
    });
  }

  async getAll<T>(store: string): Promise<T[]> {
    const db = await this.getDb();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => { console.warn(`IDB getAll(${store}) error:`, req.error); resolve([]); };
    });
  }

  // ── Auth (backward-compatible) ───────────────────────────────

  async getToken(): Promise<string | null> {
    return this.get<string>('auth', 'jwt');
  }

  async setToken(token: string): Promise<void> {
    return this.put('auth', token, 'jwt');
  }

  async removeToken(): Promise<void> {
    return this.delete('auth', 'jwt');
  }

  async getAuthMethod(): Promise<'local' | 'microsoft' | null> {
    return this.get<'local' | 'microsoft'>('auth', 'authMethod');
  }

  async setAuthMethod(method: 'local' | 'microsoft'): Promise<void> {
    return this.put('auth', method, 'authMethod');
  }

  async removeAuthMethod(): Promise<void> {
    return this.delete('auth', 'authMethod');
  }

  async getDeviceCheck<T>(): Promise<T | null> {
    return this.get<T>('auth', 'deviceCheck');
  }

  async setDeviceCheck<T>(data: T): Promise<void> {
    return this.put('auth', { ...data as any, cachedAt: Date.now() }, 'deviceCheck');
  }

  async removeDeviceCheck(): Promise<void> {
    return this.delete('auth', 'deviceCheck');
  }

  // ── Chat (cross-tab session persistence) ──────────────────────

  async getChatSessionId(): Promise<string | null> {
    return this.get<string>('chat', 'sessionId');
  }

  async setChatSessionId(id: string): Promise<void> {
    return this.put('chat', id, 'sessionId');
  }

  async removeChatSessionId(): Promise<void> {
    return this.delete('chat', 'sessionId');
  }

  async getChatMessages<T = any>(): Promise<T[]> {
    return (await this.get<T[]>('chat', 'messages')) ?? [];
  }

  async setChatMessages<T = any>(messages: T[]): Promise<void> {
    return this.put('chat', messages, 'messages');
  }

  async removeChatMessages(): Promise<void> {
    return this.delete('chat', 'messages');
  }
}
