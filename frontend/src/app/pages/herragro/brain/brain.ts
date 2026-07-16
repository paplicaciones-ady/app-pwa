import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-brain',
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
          <h2>BRAIN</h2>
        </div>
      </div>

      <div class="body">
        <div class="selcard">
          <div class="nm">GARCIA BEDOYA ANDRES FELIPE<small>1053803896-2</small></div>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="bgrid">
          @for (a of acciones; track a.nombre) {
            <div class="bact">
              <div class="ic">
                @switch (a.icono) {
                  @case ('brain') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 5a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 12a2.5 2.5 0 0 0 4 2V5Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M15 5a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 12a2.5 2.5 0 0 1-4 2"
                        stroke="currentColor"
                        stroke-width="1.8"
                      />
                    </svg>
                  }
                  @case ('historico') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M12 8v4l3 2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  }
                  @case ('devoluciones') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 14l-4-4 4-4"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M5 10h9a5 5 0 0 1 0 10h-3"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('gestiones') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="4"
                        y="5"
                        width="16"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M8 9h8M8 13h5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('nocompra') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M6 6l12 12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('cartera') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="8" cy="9" r="2.6" stroke="currentColor" stroke-width="2" />
                      <circle cx="16" cy="9" r="2.6" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M3 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M13 19c0-2.5 2.2-4.5 5-4.5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  }
                  @case ('digitalizacion') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 3v18l6-3 6 3V3"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                    </svg>
                  }
                  @case ('seguimiento') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 7h11v8H3z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M14 10h4l3 3v2h-7z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                      <circle cx="7" cy="17" r="1.6" stroke="currentColor" stroke-width="2" />
                      <circle cx="17" cy="17" r="1.6" stroke="currentColor" stroke-width="2" />
                    </svg>
                  }
                  @case ('waze') {
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3C7.03 3 3 6.58 3 11c0 2.12.96 4.02 2.5 5.38V21l3.08-1.69A10.4 10.4 0 0 0 12 20c4.97 0 9-3.58 9-8s-4.03-9-9-9Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                      />
                      <circle cx="8.5" cy="11" r="1.2" fill="currentColor" />
                      <circle cx="12" cy="11" r="1.2" fill="currentColor" />
                      <circle cx="15.5" cy="11" r="1.2" fill="currentColor" />
                    </svg>
                  }
                }
              </div>
              <span>{{ a.nombre }}</span>
            </div>
          }
        </div>

        <div class="rfm">
          <div class="c">
            <div class="k">RFM: Potenciar</div>
            <div class="v">Prioridad de crecimiento</div>
          </div>
          <div class="c">
            <div class="k">Vocación</div>
            <div class="v">Depósito de materiales de construcción</div>
          </div>
        </div>

        <div class="tabs">
          <span class="tab on">Portafolio</span>
          <span class="tab">Combos</span>
          <span class="tab">Sugerido</span>
          <span class="tab">Innovación</span>
          <span class="tab">Oportunidad</span>
        </div>

        @for (r of recomendaciones; track r.nombre) {
          <div class="rec">
            <div class="rh">
              <div class="nm">{{ r.nombre }}</div>
              <div class="pr">
                {{ r.precio }} <span class="q">{{ r.cantidad }}</span>
              </div>
            </div>
            <span class="seg"
              ><span class="n">{{ r.segmentoN }}</span> {{ r.segmentoLabel }}</span
            >
            <div class="prog">
              <div class="progrow">
                <span class="plabel">Proyectado</span>
                <div class="pbar">
                  <i class="projtotal" [style.width.%]="r.proyectadoTotal"></i>
                </div>
                <span class="pval">{{ r.proyectadoTotal }}%</span>
              </div>
              <div class="progrow">
                <span class="plabel">Actual</span>
                <div class="pbar">
                  <i class="projactual" [style.width.%]="r.proyectadoActual"></i>
                </div>
                <span class="pval">{{ r.proyectadoActual }}%</span>
              </div>
              <div class="progrow">
                <span class="plabel">Real</span>
                <div class="pbar"><i class="real" [style.width.%]="r.real"></i></div>
                <span class="pval">{{ r.real }}%</span>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="bottombar">
        <div class="l">
          <div class="n">6 Productos</div>
          <div class="t">Total: $1.349.811</div>
        </div>
        <div class="r">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6h15l-1.5 9h-12z"
              stroke="#fff"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <circle cx="9" cy="20" r="1.4" fill="#fff" />
            <circle cx="18" cy="20" r="1.4" fill="#fff" />
          </svg>
          Resumen de pedidos
        </div>
      </div>
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

    .body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px 20px;
      position: relative;
      background: var(--bg);
      padding-bottom: 80px;
    }
    .body::-webkit-scrollbar {
      width: 0;
    }

    .selcard {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 13px 15px;
      margin-bottom: 14px;
    }
    .selcard .nm {
      font-family: var(--display);
      font-weight: 700;
      font-size: 13.5px;
      color: var(--ink);
    }
    .selcard .nm small {
      display: block;
      font-family: var(--body);
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
    }
    .selcard svg {
      width: 18px;
      height: 18px;
      color: var(--accent);
    }

    .bgrid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .bact {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 6px;
      text-align: center;
      cursor: default;
    }
    .bact .ic {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--accent-soft);
      display: grid;
      place-items: center;
      margin: 0 auto 6px;
    }
    .bact .ic svg {
      width: 21px;
      height: 21px;
      color: var(--accent);
    }
    .bact span {
      font-size: 10px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.15;
      display: block;
    }

    .rfm {
      display: flex;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .rfm .c {
      flex: 1;
      padding: 11px 13px;
    }
    .rfm .c + .c {
      border-left: 1px solid var(--line);
    }
    .rfm .c .k {
      font-family: var(--display);
      font-weight: 700;
      font-size: 12px;
      color: var(--accent);
    }
    .rfm .c .v {
      font-size: 10.5px;
      color: var(--muted);
      margin-top: 2px;
      line-height: 1.25;
    }

    .tabs {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      margin-bottom: 12px;
      padding-bottom: 2px;
    }
    .tab {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 7px 12px;
      white-space: nowrap;
      cursor: default;
    }
    .tab.on {
      background: var(--accent);
      color: var(--white);
      border-color: var(--accent);
    }

    .rec {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .rec .rh {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .rec .rh .nm {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--ink);
    }
    .rec .rh .pr {
      font-size: 12px;
      font-weight: 800;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rec .rh .pr .q {
      background: var(--accent);
      color: var(--white);
      font-size: 10px;
      border-radius: 6px;
      padding: 1px 6px;
    }
    .rec .seg {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      color: var(--green-deep);
      background: var(--green-soft);
      padding: 3px 9px;
      border-radius: 999px;
      margin-top: 6px;
    }
    .rec .seg .n {
      background: var(--green);
      color: var(--white);
      border-radius: 50%;
      width: 15px;
      height: 15px;
      display: grid;
      place-items: center;
      font-size: 8px;
    }

    .prog {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: 10px;
    }
    .progrow {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .plabel {
      width: 68px;
      font-size: 9.5px;
      font-weight: 600;
      color: var(--muted);
      flex: none;
      text-align: right;
    }
    .pbar {
      flex: 1;
      height: 6px;
      border-radius: 99px;
      background: #eef2f7;
      overflow: hidden;
    }
    .pbar i {
      display: block;
      height: 100%;
      border-radius: 99px;
      transition: width 0.3s ease;
    }
    .pbar i.projtotal {
      background: #c5d0e0;
    }
    .pbar i.projactual {
      background: #f5a623;
    }
    .pbar i.real {
      background: var(--accent);
    }
    .pval {
      width: 32px;
      font-size: 10px;
      font-weight: 700;
      color: var(--ink);
      flex: none;
    }

    .bottombar {
      flex: none;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
    }
    .bottombar .l .n {
      font-size: 11px;
      opacity: 0.9;
    }
    .bottombar .l .t {
      font-family: var(--display);
      font-weight: 800;
      font-size: 15px;
    }
    .bottombar .r {
      display: flex;
      align-items: center;
      gap: 7px;
      font-weight: 800;
      font-size: 12.5px;
      background: rgba(255, 255, 255, 0.16);
      padding: 8px 12px;
      border-radius: 11px;
      cursor: default;
    }
    .bottombar .r svg {
      width: 16px;
      height: 16px;
    }
  `,
})
export class Brain {
  private readonly router = inject(Router);

  protected readonly acciones = [
    { nombre: 'Pedidos Brain', icono: 'brain' },
    { nombre: 'Histórico', icono: 'historico' },
    { nombre: 'Devoluciones', icono: 'devoluciones' },
    { nombre: 'Otras gestiones', icono: 'gestiones' },
    { nombre: 'No compras', icono: 'nocompra' },
    { nombre: 'Cartera', icono: 'cartera' },
    { nombre: 'Digitalización', icono: 'digitalizacion' },
    { nombre: 'Seguimiento', icono: 'seguimiento' },
    { nombre: 'Waze', icono: 'waze' },
  ];

  protected readonly recomendaciones = [
    {
      nombre: 'CARRETAS METÁLICAS',
      precio: '$1.089.560',
      cantidad: '3',
      segmentoN: '5',
      segmentoLabel: 'Potenciales leales',
      proyectadoTotal: 100,
      proyectadoActual: 78,
      real: 62,
    },
    {
      nombre: 'BARRAS',
      precio: '$260.250',
      cantidad: '3',
      segmentoN: '9',
      segmentoLabel: 'Leales de alto valor',
      proyectadoTotal: 100,
      proyectadoActual: 45,
      real: 31,
    },
    {
      nombre: 'ALMADANAS CON CABO',
      precio: '$0',
      cantidad: '0',
      segmentoN: '9',
      segmentoLabel: 'Potenciales leales',
      proyectadoTotal: 100,
      proyectadoActual: 8,
      real: 2,
    },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
