import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

function parseColombianPrice(v: string): number {
  return Number(v.replace(/[^0-9]/g, '')) || 0;
}

function formatCOP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

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
          <div class="bar">
            <i [style.width.%]="budgetPct()"></i
            ><span class="exe">{{ formatCOP(budgetExecuted()) }} · {{ budgetPct() }}%</span>
          </div>
          <span class="vsg">3.142.676,3 V.sg</span>
        </div>

        <div class="products">
          @for (p of productos; track p.codigo) {
            <div class="pcard">
              <div class="ph">{{ p.nombre }}</div>
              <div class="pb">
                <div class="pthumb">
                  <img
                    [src]="'/products/' + p.codigo + '.png'"
                    [alt]="p.nombre"
                    (error)="
                      $any($event.target).src =
                        'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 80 80%27 fill=%27none%27%3E%3Crect x=%2710%27 y=%2710%27 width=%2760%27 height=%2760%27 rx=%2710%27 fill=%27%23f0f0f0%27 stroke=%27%23ccc%27 stroke-width=%272%27/%3E%3Cpath d=%27M28 24l4-4h16l4 4v32l-4 4H32l-4-4z%27 fill=%27%23e8e8e8%27 stroke=%27%23bbb%27 stroke-width=%271.5%27/%3E%3Cpath d=%27M36 34h8M40 30v8%27 stroke=%27%23999%27 stroke-width=%272%27 stroke-linecap=%27round%27/%3E%3C/svg%3E'
                    "
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
                  <div class="tot">{{ formatCOP(p.unitPrice * p.cantidad()) }}</div>
                </div>
              </div>
              <div class="pfoot">
                <div class="stepper">
                  <button (click)="p.cantidad.set(Math.max(0, p.cantidad() - 1))">−</button>
                  <span>{{ p.cantidad() }}</span>
                  <button (click)="p.cantidad.set(p.cantidad() + 1)">+</button>
                </div>
                <button class="pctbtn">%</button>
              </div>
            </div>
          }
        </div>

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

      @if (summaryOpen()) {
        <div class="summarypanel">
          <div class="sp-title">Resumen del pedido</div>
          @for (p of productos; track p.codigo) {
            @if (p.cantidad() > 0) {
              <div class="sp-row">
                <span class="sp-name">{{ p.nombre }}</span>
                <span class="sp-qty">×{{ p.cantidad() }}</span>
                <span class="sp-sub">{{ formatCOP(p.unitPrice * p.cantidad()) }}</span>
              </div>
            }
          }
          <div class="sp-divider"></div>
          <div class="sp-row sp-total">
            <span>Total</span>
            <span>{{ formatCOP(total()) }}</span>
          </div>
        </div>
      }

      <button class="summarybtn" (click)="summaryOpen.set(!summaryOpen())">
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
        <span class="sb-info">
          <span class="sb-count">{{ totalItems() }} productos</span>
          <span class="sb-total">{{ formatCOP(total()) }}</span>
        </span>
        <svg class="sb-chevron" [class.open]="summaryOpen()" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="bottombar">
        <div class="l">
          <div class="n">{{ totalItems() }} Productos</div>
          <div class="t">Total: {{ formatCOP(total()) }}</div>
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
      background: linear-gradient(90deg, var(--accent), var(--accent-deep));
      border-radius: 6px;
      transition: width 0.3s ease;
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
      cursor: pointer;
      line-height: 1;
      transition:
        background 0.15s,
        transform 0.1s;
    }
    .stepper button:hover {
      background: var(--accent-soft);
    }
    .stepper button:active {
      transform: scale(0.9);
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

    .summarybtn {
      position: fixed;
      bottom: 56px;
      left: 14px;
      right: 14px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 10px;
      height: 46px;
      padding: 0 14px;
      border: 1.5px solid var(--accent);
      border-radius: 14px;
      background: var(--white);
      box-shadow: 0 4px 16px rgba(var(--accent-rgb), 0.15);
      cursor: pointer;
      transition:
        transform 0.15s,
        box-shadow 0.15s;
    }
    .summarybtn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.22);
    }
    .summarybtn:active {
      transform: scale(0.98);
    }
    .summarybtn svg:first-child {
      width: 20px;
      height: 20px;
      color: var(--accent);
      flex: none;
    }
    .sb-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      text-align: left;
      line-height: 1.15;
    }
    .sb-count {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
    }
    .sb-total {
      font-family: var(--display);
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
    }
    .sb-chevron {
      width: 18px;
      height: 18px;
      color: var(--muted);
      flex: none;
      transition: transform 0.2s;
    }
    .sb-chevron.open {
      transform: rotate(180deg);
    }

    .summarypanel {
      position: fixed;
      bottom: 108px;
      left: 14px;
      right: 14px;
      z-index: 20;
      background: var(--white);
      border: 1.5px solid var(--accent);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .sp-title {
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
      margin-bottom: 10px;
    }
    .sp-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      padding: 4px 0;
    }
    .sp-name {
      flex: 1;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sp-qty {
      font-weight: 700;
      color: var(--accent);
      flex: none;
    }
    .sp-sub {
      font-weight: 700;
      color: var(--ink);
      flex: none;
      text-align: right;
    }
    .sp-divider {
      height: 1px;
      background: var(--line);
      margin: 6px 0;
    }
    .sp-total {
      font-weight: 800;
      font-size: 13px;
      color: var(--ink);
    }
    .sp-total span:last-child {
      color: var(--accent);
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

  protected readonly Math = Math;
  protected readonly formatCOP = formatCOP;
  protected readonly summaryOpen = signal(false);

  protected readonly productos = [
    {
      codigo: 'T1207320512',
      nombre: 'BARRA FORJADA AGRICOLA / INDUSTRIAL 3205-12 LB',
      unitPrice: 86750,
      cantidad: signal(3),
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
      codigo: 'T1217170020',
      nombre: 'CARRETA 110 LTS CHASIS MAD VERDE LLANTA ANTIPINCHAZO',
      unitPrice: 363187,
      cantidad: signal(1),
      rows: [
        { label: 'Codigo', value: 'T1217170020' },
        { label: 'Precio', value: '$305.199' },
        { label: 'Descuento', value: '0,00 %' },
        { label: 'IVA', value: '19,0 %' },
        { label: 'Total precio', value: '$363.187' },
      ],
    },
  ];

  protected readonly total = computed(() =>
    this.productos.reduce((sum, p) => sum + p.unitPrice * p.cantidad(), 0),
  );

  protected readonly totalItems = computed(() =>
    this.productos.reduce((sum, p) => sum + p.cantidad(), 0),
  );

  private readonly budgetTotal = 3_142_676;
  protected readonly budgetExecuted = computed(() => this.total());
  protected readonly budgetPct = computed(() =>
    Math.min(100, Math.round((this.budgetExecuted() / this.budgetTotal) * 100)),
  );

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
