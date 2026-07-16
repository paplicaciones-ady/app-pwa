import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-descuentos',
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
          <h2>Descuentos comerciales</h2>
        </div>
      </div>

      <div class="body">
        <div class="budget">
          <div class="bar"><i></i><span class="exe">$2.689.523 · 86%</span></div>
          <span class="vsg">3.142.676,3 V.sg</span>
        </div>

        @for (p of productos; track p.nombre) {
          <div class="pcard">
            <div class="ph">{{ p.nombre }}</div>
            <div class="pb">
              <div class="pthumb">
                <img
                  [src]="'products/' + p.codigo + '.png'"
                  [alt]="p.nombre"
                  (error)="$any($event.target).style.display = 'none'"
                  loading="lazy"
                />
              </div>
              <div class="pdet">
                @for (r of p.rows; track r.label) {
                  <div class="rowd">
                    <span>{{ r.label }}</span
                    ><b>{{ r.value }}</b>
                  </div>
                }
                @if (p.total) {
                  <div class="tot">{{ p.total }}</div>
                }
              </div>
            </div>
            <div class="pfoot">
              <div class="stepper">
                <button>&minus;</button><span>{{ p.cantidad }}</span
                ><button>+</button>
              </div>
              <button class="pctbtn">%</button>
            </div>
          </div>
        }

        <div class="addmore">¿Algo más por agregar?</div>
        <div class="suggest">
          <div class="sug">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8l8-4 8 4-8 4-8-4Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path d="M4 8v8l8 4 8-4V8" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </div>
          <div class="sug">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8l8-4 8 4-8 4-8-4Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path d="M4 8v8l8 4 8-4V8" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </div>
          <div class="sug">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8l8-4 8 4-8 4-8-4Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path d="M4 8v8l8 4 8-4V8" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </div>
        </div>
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
          Finalizar pedidos
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

    .budget {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      font-size: 11px;
      font-weight: 700;
    }
    .budget .bar {
      flex: 1;
      height: 20px;
      border-radius: 6px;
      background: #eef2f7;
      overflow: hidden;
      position: relative;
    }
    .budget .bar i {
      position: absolute;
      inset: 0;
      width: 86%;
      background: linear-gradient(90deg, var(--accent), var(--accent-deep));
      border-radius: 6px;
    }
    .budget .exe {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #fff;
      font-size: 10px;
      font-weight: 800;
    }
    .budget .vsg {
      color: var(--muted);
      white-space: nowrap;
      font-size: 10px;
    }

    .pcard {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .ph {
      background: var(--accent);
      color: #fff;
      font-size: 11.5px;
      font-weight: 800;
      padding: 8px 12px;
      line-height: 1.2;
    }
    .pb {
      display: flex;
      gap: 12px;
      padding: 12px;
    }
    .pthumb {
      width: 64px;
      height: 64px;
      border-radius: 10px;
      background: var(--bg);
      display: grid;
      place-items: center;
      flex: none;
      overflow: hidden;
    }
    .pthumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .pdet {
      flex: 1;
      font-size: 11px;
      color: var(--muted);
      line-height: 1.5;
    }
    .rowd {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .rowd b {
      color: var(--ink);
      font-weight: 700;
    }
    .tot {
      color: var(--accent);
      font-weight: 800;
      font-size: 14px;
      margin-top: 3px;
    }
    .pfoot {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 0 12px 12px;
    }
    .stepper {
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1.5px solid var(--line);
      border-radius: 999px;
      padding: 5px 10px;
    }
    .stepper button {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 0;
      background: var(--bg);
      color: var(--accent);
      font-size: 16px;
      font-weight: 800;
      cursor: default;
      line-height: 1;
    }
    .stepper span {
      font-weight: 800;
      color: var(--ink);
      min-width: 16px;
      text-align: center;
    }
    .pctbtn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-deep));
      color: #fff;
      border: 0;
      font-weight: 800;
      cursor: default;
      display: grid;
      place-items: center;
    }

    .addmore {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      margin: 4px 2px 10px;
    }
    .suggest {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .sug {
      width: 78px;
      height: 70px;
      border: 1.6px dashed #d7dfe9;
      border-radius: 12px;
      display: grid;
      place-items: center;
      flex: none;
      color: #cdd6e1;
    }
    .sug svg {
      width: 30px;
      height: 30px;
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
export class Descuentos {
  private readonly router = inject(Router);

  protected readonly productos = [
    {
      nombre: 'BARRA FORJADA AGRICOLA / INDUSTRIAL 3205-12 LB',
      codigo: 'T1207320512',
      cantidad: 3,
      total: '$260.250',
      rows: [
        { label: 'Codigo', value: 'T1207320512' },
        { label: 'Precio', value: '$97.199' },
        { label: 'Descuento', value: '15,00 %' },
        { label: 'Valor desc.', value: '$14.580' },
        { label: 'IVA', value: '5,0 %' },
        { label: 'Total precio', value: '$86.750' },
      ],
    },
    {
      nombre: 'CARRETA 110 LTS CHASIS MAD VERDE LLANTA ANTIPINCHAZO',
      codigo: 'T1217170020',
      cantidad: 1,
      total: null,
      rows: [
        { label: 'Codigo', value: 'T1217170020' },
        { label: 'Precio', value: '$305.199' },
        { label: 'Descuento', value: '0,00 %' },
        { label: 'IVA', value: '19,0 %' },
        { label: 'Total precio', value: '$363.187' },
      ],
    },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
