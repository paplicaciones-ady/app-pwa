import {
  Component,
  effect,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

interface Cliente {
  nombre: string;
  direccion: string;
  habilitado: WritableSignal<boolean>;
}

@Component({
  selector: 'app-rutas-clientes',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="abtitle">
          <h2>Rutas y Clientes</h2>
        </div>
      </div>

      <div class="tabs">
        <button
          class="tab"
          [class.on]="activeTab() === 'clientes'"
          (click)="activeTab.set('clientes')"
        >
          Clientes
        </button>
        <button class="tab" [class.on]="activeTab() === 'mapa'" (click)="activeTab.set('mapa')">
          Mapa
        </button>
      </div>

      @if (activeTab() === 'clientes') {
        <div class="content">
          @for (c of clientes; track c.nombre) {
            <div class="ccard">
              <div class="ccinfo">
                <div class="ccname">{{ c.nombre }}</div>
                <div class="ccdir">{{ c.direccion }}</div>
              </div>
              <button
                class="toggle"
                [class.on]="c.habilitado()"
                (click)="c.habilitado.set(!c.habilitado())"
              >
                <span class="knob"></span>
              </button>
            </div>
          }
        </div>
      }

      @if (activeTab() === 'mapa') {
        <div class="mapwrap">
          <div class="mapholder" #mapContainer></div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .s2 {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .appbar {
      flex: none;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 14px 12px;
      background: var(--white);
      border-bottom: 1px solid var(--line);
    }
    .abk {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      border: 1.4px solid var(--line);
      background: var(--white);
      display: grid;
      place-items: center;
      cursor: pointer;
      flex: none;
    }
    .abk:hover {
      background: var(--bg);
    }
    .abk svg {
      width: 17px;
      height: 17px;
      color: var(--ink);
    }
    .abtitle {
      flex: 1;
      min-width: 0;
    }
    .abtitle h2 {
      font-family: var(--display);
      font-weight: 700;
      font-size: 16px;
      color: var(--ink);
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tabs {
      flex: none;
      display: flex;
      gap: 0;
      background: var(--white);
      border-bottom: 1px solid var(--line);
      padding: 0 14px;
    }
    .tab {
      flex: 1;
      padding: 11px 0;
      font-family: var(--display);
      font-size: 13px;
      font-weight: 700;
      color: var(--muted);
      background: none;
      border: 0;
      border-bottom: 2.5px solid transparent;
      cursor: pointer;
      transition:
        color 0.15s,
        border-color 0.15s;
    }
    .tab.on {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px 20px;
      background: var(--bg);
    }
    .content::-webkit-scrollbar {
      width: 0;
    }

    .ccard {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .ccinfo {
      flex: 1;
      min-width: 0;
    }
    .ccname {
      font-size: 13px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.2;
    }
    .ccdir {
      font-size: 11px;
      color: var(--muted);
      margin-top: 3px;
      line-height: 1.3;
    }

    .toggle {
      width: 44px;
      height: 26px;
      border-radius: 999px;
      border: 0;
      padding: 3px;
      background: #d1d5db;
      cursor: pointer;
      flex: none;
      transition: background 0.2s;
      display: flex;
      align-items: center;
    }
    .toggle.on {
      background: var(--green);
    }
    .knob {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--white);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;
    }
    .toggle.on .knob {
      transform: translateX(18px);
    }

    .mapwrap {
      flex: 1;
      position: relative;
      background: var(--bg);
    }
    .mapholder {
      position: absolute;
      inset: 0;
    }
  `,
})
export class RutasClientes implements OnDestroy {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly activeTab = signal<'clientes' | 'mapa'>('clientes');
  protected readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: unknown = null;
  private markersLayer: unknown = null;
  private mapReady = false;
  private Leaflet: typeof import('leaflet') | null = null;

  protected readonly clientes: Cliente[] = [
    {
      nombre: 'Depósitos El Porvenir',
      direccion: 'Calle 48 #22-35, Manizales, Caldas',
      habilitado: signal(true),
    },
    {
      nombre: 'Grescerámica S.A.S.',
      direccion: 'Carrera 21 #73-21, Manizales, Caldas',
      habilitado: signal(true),
    },
    {
      nombre: 'Ferretería La Ye',
      direccion: 'Carrera 22 No. 48C-06, Barrio San Jorge, Manizales, Caldas',
      habilitado: signal(true),
    },
  ];

  private readonly CURRENT_LOCATION = { lat: 5.059, lng: -75.502 };
  private readonly MAP_ZOOM = 14;

  private readonly clientCoords: Record<string, { lat: number; lng: number }> = {
    'Depósitos El Porvenir': { lat: 5.0695, lng: -75.5065 },
    'Grescerámica S.A.S.': { lat: 5.0665, lng: -75.4995 },
    'Ferretería La Ye': { lat: 5.053, lng: -75.5095 },
  };

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    effect(() => {
      const tab = this.activeTab();
      if (tab !== 'mapa' || this.mapReady) return;

      setTimeout(async () => {
        const container = this.mapContainer()?.nativeElement;
        if (!container || this.mapReady) return;

        if (!this.Leaflet) {
          const mod = await import('leaflet');
          this.Leaflet = (mod as any).default ?? mod;
        }
        const L = this.Leaflet!;

        const map = L.map(container, {
          center: [this.CURRENT_LOCATION.lat, this.CURRENT_LOCATION.lng],
          zoom: this.MAP_ZOOM,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        L.marker([this.CURRENT_LOCATION.lat, this.CURRENT_LOCATION.lng], {
          icon: L.divIcon({
            className: 'current-loc-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        })
          .bindPopup('<b>Ubicación actual</b><br>Cl. 103, Manizales')
          .addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        this.map = map;
        this.markersLayer = markersLayer;
        this.mapReady = true;
        this.refreshMarkers();
      }, 60);
    });

    effect(() => {
      if (!this.mapReady) return;
      const _deps = this.clientes.map((c) => c.habilitado());
      this.refreshMarkers();
    });
  }

  ngOnDestroy(): void {
    (this.map as { remove?: () => void })?.remove?.();
  }

  private refreshMarkers(): void {
    const L = this.Leaflet;
    const map = this.map as import('leaflet').Map;
    const layer = this.markersLayer as import('leaflet').LayerGroup;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    this.clientes
      .filter((c) => c.habilitado())
      .forEach((c) => {
        const coords = this.clientCoords[c.nombre];
        if (!coords) return;
        L.marker([coords.lat, coords.lng])
          .bindPopup(`<b>${c.nombre}</b><br>${c.direccion}`)
          .addTo(layer);
      });

    map.invalidateSize();
  }

  protected goBack(): void {
    this.router.navigate(['/herragro/rutero']);
  }
}
