import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PqrsStore } from '../../services/pqrs.store';

const TYPE_LABELS: Record<string, string> = {
  peticion: 'Petición',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="s2">
      <div class="s2-head">
        <div class="s2-top">
          <div class="org-chip">
            <span class="org-dot"></span>
            PQRS · Elena 360
          </div>
          <div class="s2-icons">
            <button class="ibtn" (click)="toggleForm()" title="Nueva PQRS">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
            </button>
            <div class="ibtn" (click)="requestGeoCity()" title="Ubicación (ciudad)">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="#fff" stroke-width="2"/></svg>
            </div>
            <div class="ibtn" (click)="requestGeoPrecise()" title="Ubicación (precisión media)">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="#fff" stroke-width="2"/></svg>
            </div>
          </div>
        </div>
        <div class="greet">
          <small>{{ today }}</small>
          <h2>PQRS <span class="wave">📋</span></h2>
        </div>
      </div>

      <div class="s2-body">
        @if (error(); as e) {
          <div class="error-msg">{{ e }}</div>
        }

        @if (showForm()) {
          <div class="form-section">
            <form (ngSubmit)="onSubmit()">
              <div class="field">
                <label>Tipo</label>
                <div class="inp">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  <select [(ngModel)]="formData.type" name="type" required>
                    <option value="" disabled selected>Tipo</option>
                    <option value="peticion">Petición</option>
                    <option value="queja">Queja</option>
                    <option value="reclamo">Reclamo</option>
                    <option value="sugerencia">Sugerencia</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Título</label>
                <div class="inp">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
                  <input [(ngModel)]="formData.title" name="title" type="text" placeholder="Título" required />
                </div>
              </div>
              <div class="field">
                <label>Descripción</label>
                <div class="inp" style="height:auto;padding:10px 14px;">
                  <textarea [(ngModel)]="formData.description" name="description" placeholder="Descripción" rows="3" required style="border:0;outline:0;background:transparent;flex:1;font-family:var(--body);font-size:14.5px;font-weight:600;color:var(--ink);padding:0;width:100%;resize:vertical;"></textarea>
                </div>
              </div>
              <div class="field">
                <label>Producto</label>
                <div class="sel">
                  <select [(ngModel)]="formData.productId" name="productId" required>
                    <option value="" disabled selected>Producto</option>
                    @for (p of products(); track p.id) {
                      <option [value]="p.id">{{ p.name }}</option>
                    }
                    @if (productsSyncStatus() === 'error' && products().length === 0) {
                      <option value="" disabled>Sin conexión — sin productos</option>
                    }
                  </select>
                  <svg class="chev" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
              <div class="s3-foot" style="margin-top:20px;">
                <button type="button" class="btn-ghost" (click)="toggleForm()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Enviando...' : 'Enviar PQRS' }}
                </button>
              </div>
            </form>
          </div>
        }

        @if (pqrsList().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <p>No hay PQRS registradas</p>
            <p class="hint">Crea una nueva para comenzar.</p>
          </div>
        }

        @for (pqrs of pqrsList(); track pqrs.id || pqrs._localId) {
          <div class="mod" [class.mod--pending]="pqrs._localId && pqrs._status !== 'failed'" [class.mod--syncing]="pqrs._status === 'syncing'" [class.mod--failed]="pqrs._status === 'failed'">
            <div class="mod-top">
              <span class="mod-badge" [class]="pqrs.type">{{ TYPE_LABELS[pqrs.type] || pqrs.type }}</span>
              @if (pqrs._localId) {
                <span class="mod-badge mod-badge-status">
                  @if (pqrs._status === 'syncing') { Enviando... }
                  @else if (pqrs._status === 'failed') { Falló }
                  @else { Pendiente }
                </span>
              }
              <span class="mod-date">{{ pqrs.createdAt | date:'short' }}</span>
            </div>
            <h4 class="mod-title">{{ pqrs.title }}</h4>
            @if (pqrs._lastError) {
              <p class="mod-error">{{ pqrs._lastError }}</p>
            }
            <p class="mod-desc">{{ pqrs.description }}</p>
            <div class="mod-meta">
              <span><strong>Producto:</strong> {{ pqrs.productName || '—' }}</span>
              <span><strong>Usuario:</strong> {{ pqrs.userEmail || '—' }}</span>
            </div>
            @if (pqrs._status === 'failed') {
              <div class="mod-actions">
                <button class="mod-btn mod-btn-retry" (click)="retry(pqrs._localId!)">Reintentar</button>
                <button class="mod-btn mod-btn-discard" (click)="discard(pqrs._localId!)">Descartar</button>
              </div>
            }
          </div>
        }
      </div>
    </div>

    @if (showGeoModal()) {
      <div class="geo-overlay" (click)="closeGeo()">
        <div class="geo-modal" (click)="$event.stopPropagation()">
          <div class="geo-header">
            <h3>Ubicación actual</h3>
            <button class="geo-close" (click)="closeGeo()">✕</button>
          </div>
          <div class="geo-body">
            @if (geoLoading()) {
              <p class="geo-loading">Obteniendo ubicación…</p>
            } @else if (geoError()) {
              <p class="geo-error">{{ geoError() }}</p>
            } @else if (geoLocation(); as loc) {
              <p><strong>Ciudad:</strong> {{ loc.city }}</p>
              <p><strong>Departamento:</strong> {{ loc.region }}</p>
              <p><strong>País:</strong> {{ loc.country }}</p>
              <p class="geo-source">Fuente: {{ geoMode() === 'city' ? 'IP aproximada' : 'GPS/WiFi aproximado' }}</p>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .s2 { display: flex; flex-direction: column; min-height: 100vh; }
    .s2-head {
      background: linear-gradient(155deg, #1356a0, var(--blue) 60%, #0d3970);
      padding: 16px 20px 56px;
      position: relative;
      overflow: hidden;
      flex: none;
    }
    .s2-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }
    .org-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,.95);
      padding: 5px 14px 5px 6px;
      border-radius: 999px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
      box-shadow: 0 6px 14px -8px rgba(0,0,0,.4);
    }
    .org-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--green));
    }
    .s2-icons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ibtn {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: rgba(255,255,255,.12);
      border: 1px solid rgba(255,255,255,.16);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: 0.15s;
    }
    .ibtn:hover { background: rgba(255,255,255,.2); }
    .ibtn svg { width: 18px; height: 18px; color: #fff; }
    .greet {
      position: relative;
      z-index: 2;
      margin-top: 22px;
    }
    .greet small {
      color: #9fc1ec;
      font-size: 12.5px;
      font-weight: 600;
    }
    .greet h2 {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 25px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .greet h2 .wave { font-size: 22px; }
    .s2-body {
      flex: 1;
      background: var(--bg);
      border-radius: 24px 24px 0 0;
      margin-top: -30px;
      padding: 22px 20px 90px;
      position: relative;
      z-index: 3;
      overflow-y: auto;
    }
    .s2-body::-webkit-scrollbar { width: 0; }

    /* Form styles */
    .form-section {
      margin-bottom: 20px;
    }
    .form-section form {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 18px;
      padding: 18px;
    }
    .field { margin-bottom: 16px; }
    .field label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--muted);
      margin: 0 0 7px 4px;
      letter-spacing: 0.01em;
    }
    .inp {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--white);
      border: 1.6px solid var(--line);
      border-radius: 14px;
      transition: 0.18s;
      height: 50px;
      padding: 0 14px;
    }
    .inp svg {
      width: 19px;
      height: 19px;
      color: var(--faint);
      flex: none;
      transition: 0.18s;
    }
    .inp select,
    .inp input {
      border: 0;
      outline: 0;
      background: transparent;
      flex: 1;
      font-family: var(--body);
      font-size: 14.5px;
      font-weight: 600;
      color: var(--ink);
      padding: 0 10px;
      width: 100%;
    }
    .inp:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.14);
    }
    .inp:focus-within svg { color: var(--accent); }
    .sel { position: relative; }
    .sel select {
      appearance: none;
      width: 100%;
      height: 50px;
      border: 1.6px solid var(--line);
      border-radius: 14px;
      background: var(--white);
      padding: 0 38px 0 14px;
      font-family: var(--body);
      font-weight: 600;
      font-size: 14px;
      color: var(--ink);
      cursor: pointer;
      outline: 0;
    }
    .sel select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.14);
    }
    .sel .chev {
      position: absolute;
      right: 13px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--faint);
      pointer-events: none;
    }
    .s3-foot { display: flex; gap: 11px; }
    .btn-ghost {
      flex: 1;
      height: 52px;
      border-radius: 15px;
      background: var(--white);
      border: 1.6px solid var(--line);
      font-family: var(--display);
      font-weight: 700;
      font-size: 14px;
      color: var(--muted);
      cursor: pointer;
      transition: 0.15s;
    }
    .btn-ghost:hover { background: var(--bg); }
    .btn-primary { flex: 2; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
    }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .empty-state p { font-size: 14px; }
    .hint { font-size: 12px !important; color: var(--faint); margin-top: 4px !important; }

    /* Mod cards (PQRS items) */
    .mod {
      background: var(--white);
      border: 1.4px solid var(--line);
      border-radius: 18px;
      padding: 16px 15px;
      position: relative;
      transition: transform 0.14s, box-shadow 0.2s, border-color 0.2s;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .mod--pending { border-color: var(--yellow); background: #fffef5; }
    .mod--syncing { border-color: var(--blue); background: #f0f7ff; }
    .mod--failed { border-color: var(--accent); background: var(--accent-soft); }
    .mod-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .mod-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--white);
    }
    .mod-badge.peticion { background: #17a2b8; }
    .mod-badge.queja { background: var(--accent); }
    .mod-badge.reclamo { background: var(--orange); }
    .mod-badge.sugerencia { background: #6f42c1; }
    .mod-badge-status { background: var(--yellow); color: var(--ink); }
    .mod-date { font-size: 11px; color: var(--faint); margin-left: auto; }
    .mod-title {
      font-family: var(--display);
      font-weight: 700;
      font-size: 14.5px;
      color: var(--ink);
      line-height: 1.12;
      margin-bottom: 6px;
    }
    .mod-error {
      font-size: 11px;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 4px;
    }
    .mod-desc {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
      line-height: 1.4;
    }
    .mod-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--faint);
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .mod-meta strong { color: var(--muted); }
    .mod-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
    }
    .mod-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 12px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      transition: 0.15s;
    }
    .mod-btn-retry { background: var(--yellow); color: var(--ink); }
    .mod-btn-retry:hover { background: #e0a800; }
    .mod-btn-discard { background: #eef2f7; color: var(--muted); }
    .mod-btn-discard:hover { background: #e0e5ec; }

    /* Geo modal */
    .geo-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .geo-modal {
      background: var(--white);
      border-radius: 18px;
      padding: 24px;
      min-width: 300px;
      max-width: 90vw;
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
    }
    .geo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .geo-header h3 {
      font-family: var(--display);
      margin: 0;
      font-size: 16px;
      color: var(--ink);
    }
    .geo-close {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 1.4px solid var(--line);
      background: var(--white);
      font-size: 14px;
      cursor: pointer;
      color: var(--faint);
      display: grid;
      place-items: center;
    }
    .geo-close:hover { background: var(--bg); }
    .geo-body p { margin: 6px 0; font-size: 14px; color: var(--ink); }
    .geo-body p strong { color: var(--muted); }
    .geo-loading { color: var(--faint); }
    .geo-error { color: var(--accent); }
    .geo-source { font-size: 11px !important; color: var(--faint) !important; margin-top: 8px !important; }
  `,
})
export class Home implements OnInit {
  private readonly pqrsStore = inject(PqrsStore);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly TYPE_LABELS = TYPE_LABELS;
  protected readonly today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  protected readonly pqrsList = this.pqrsStore.visiblePqrs;
  protected readonly syncStatus = this.pqrsStore.syncStatus;
  protected readonly products = this.pqrsStore.products;
  protected readonly productsSyncStatus = this.pqrsStore.productsSyncStatus;
  protected readonly showForm = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly showGeoModal = signal(false);
  protected readonly geoLoading = signal(false);
  protected readonly geoMode = signal<'city' | 'precise' | null>(null);
  protected readonly geoLocation = signal<{ city: string; region: string; country: string } | null>(null);
  protected readonly geoError = signal<string | null>(null);

  protected readonly formData = {
    type: '',
    title: '',
    description: '',
    productId: '' as any,
  };

  ngOnInit() {
    this.pqrsStore.loadPqrs();
    this.pqrsStore.loadProducts();
  }

  protected async requestGeoCity() {
    this.geoLoading.set(true);
    this.geoError.set(null);
    this.geoLocation.set(null);
    this.geoMode.set('city');
    this.showGeoModal.set(true);

    try {
      const res = await (isPlatformBrowser(this.platformId) ? fetch('https://ipapi.co/json/?fields=country_name,region,city') : Promise.reject());
      const data = await res.json();
      if (data.city && data.country_name) {
        this.geoLocation.set({ city: data.city, region: data.region ?? '', country: data.country_name });
      } else {
        this.geoError.set('No se pudo determinar la ubicación');
      }
    } catch {
      this.geoError.set('Error de conexión');
    } finally {
      this.geoLoading.set(false);
    }
  }

  protected requestGeoPrecise() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.geoLoading.set(true);
    this.geoError.set(null);
    this.geoLocation.set(null);
    this.geoMode.set('precise');
    this.showGeoModal.set(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`, { headers: { 'User-Agent': 'app-pwa/1.0' } });
          const data = await res.json();
          const addr = data.address ?? {};
          this.geoLocation.set({
            city: addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '',
            region: addr.state ?? '',
            country: addr.country ?? '',
          });
        } catch {
          this.geoError.set('No se pudo determinar la dirección');
        } finally {
          this.geoLoading.set(false);
        }
      },
      (err) => {
        const messages: Record<number, string> = {
          [err.PERMISSION_DENIED]: 'Permiso denegado',
          [err.POSITION_UNAVAILABLE]: 'Posición no disponible',
          [err.TIMEOUT]: 'Tiempo de espera agotado',
        };
        this.geoError.set(messages[err.code] ?? 'Error desconocido');
        this.geoLoading.set(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  protected closeGeo() {
    this.showGeoModal.set(false);
  }

  protected toggleForm() {
    this.showForm.update((v) => !v);
    this.error.set(null);
  }

  protected async retry(localId: string) {
    await this.pqrsStore.retryItem(localId);
  }

  protected async discard(localId: string) {
    await this.pqrsStore.discardItem(localId);
  }

  protected async onSubmit() {
    if (!this.formData.type || !this.formData.title || !this.formData.description || !this.formData.productId) return;

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.pqrsStore.createPqrs({
        type: this.formData.type,
        title: this.formData.title,
        description: this.formData.description,
        productId: Number(this.formData.productId),
      });
      this.submitting.set(false);
      this.showForm.set(false);
      this.formData.type = '';
      this.formData.title = '';
      this.formData.description = '';
      this.formData.productId = '';
    } catch (err: any) {
      this.submitting.set(false);
      this.error.set(err?.error?.message ?? 'Error al crear PQRS');
    }
  }
}
