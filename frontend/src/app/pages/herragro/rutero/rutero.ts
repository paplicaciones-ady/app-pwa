import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rutero',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Rutero</h2>
        </div>
      </div>

      <div class="body">
        <div class="kpis">
          @for (k of kpis; track k.label) {
            <div class="kpi" [style.gridColumn]="k.span ? 'span 2' : ''">
              <div class="v">{{ k.valor }}</div>
              <div class="k">{{ k.label }}</div>
            </div>
          }
        </div>

        <div class="toggle">
          <span>Día</span>
          <span class="on">Mes</span>
        </div>

        <div class="chart">
          <div class="ct">Resumen</div>
          <div class="bars">
            @for (b of bars; track b.label) {
              <div class="barcol">
                <div class="bl">{{ b.valor }}</div>
                <div class="bk" [style.height.%]="b.height"></div>
                <div class="bx">{{ b.label }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="subnav">
        <div class="t on">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1v-8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          Home
        </div>
        <div class="t">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="2"/></svg>
          Rutero
        </div>
        <div class="t">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 19V9M10 19V5M15 19v-7M20 19v-11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Estadísticas
        </div>
        <div class="t">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" stroke="currentColor" stroke-width="2"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Herramientas
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .s2 { display: flex; flex-direction: column; min-height: 100vh; }

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
      width: 34px; height: 34px;
      border-radius: 11px;
      border: 1.4px solid var(--line);
      background: var(--white);
      display: grid; place-items: center;
      cursor: pointer; flex: none;
    }
    .abk:hover { background: var(--bg); }
    .abk svg { width: 17px; height: 17px; color: var(--ink); }
    .abtitle { flex: 1; min-width: 0; }
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
    }
    .body::-webkit-scrollbar { width: 0; }

    .kpis {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 9px;
      text-align: center;
    }
    .kpi .v {
      font-family: var(--display);
      font-weight: 700;
      font-size: 15px;
      color: var(--accent);
    }
    .kpi .k {
      font-size: 9px;
      color: var(--muted);
      margin-top: 2px;
      line-height: 1.1;
    }

    .toggle {
      display: flex;
      background: #eef2f7;
      border-radius: 10px;
      padding: 3px;
      margin-bottom: 14px;
      width: 150px;
    }
    .toggle span {
      flex: 1;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      padding: 6px;
      border-radius: 8px;
      cursor: default;
      color: var(--muted);
    }
    .toggle span.on {
      background: var(--white);
      color: var(--accent);
      box-shadow: 0 3px 8px -4px rgba(0,0,0,.2);
    }

    .chart {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
    }
    .chart .ct {
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
      text-align: center;
      margin-bottom: 12px;
    }
    .bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 130px;
      gap: 12px;
    }
    .barcol {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      height: 100%;
      justify-content: flex-end;
    }
    .barcol .bl {
      font-size: 9px;
      font-weight: 800;
      color: var(--ink);
    }
    .barcol .bk {
      width: 100%;
      border-radius: 6px 6px 0 0;
      background: linear-gradient(180deg, var(--accent), var(--accent-deep));
    }
    .barcol .bx {
      font-size: 9.5px;
      color: var(--muted);
    }

    .subnav {
      flex: none;
      background: var(--white);
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-around;
      padding: 8px 4px 14px;
    }
    .subnav .t {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      font-weight: 700;
      color: var(--faint);
    }
    .subnav .t.on { color: var(--accent); }
    .subnav .t svg { width: 20px; height: 20px; }
  `,
})
export class Rutero {
  private readonly router = inject(Router);

  protected readonly kpis = [
    { valor: '12', label: 'Cliente ruta' },
    { valor: '8', label: 'Visitas' },
    { valor: '4', label: 'Sin visitar' },
    { valor: '0', label: 'Pedidos' },
    { valor: '66,67%', label: 'Eficacia rutero' },
    { valor: '9', label: 'Novedades' },
    { valor: '$56.000.000', label: 'Presupuesto', span: true },
    { valor: '9,00%', label: 'Cumplimiento' },
  ];

  protected readonly bars = [
    { label: 'Mes', valor: '$56.0M', height: 100 },
    { label: 'Pedidos', valor: '$4.0M', height: 22 },
    { label: 'DropSize', valor: '$44K', height: 8 },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
