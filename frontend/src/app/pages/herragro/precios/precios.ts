import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-precios',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Consulta de precios</h2>
        </div>
      </div>

      <div class="body">
        <div class="searchrow">
          <div class="sb">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input placeholder="Buscar productos">
          </div>
          <div class="scan">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4M7 8v8M10 8v8M13 8v8M17 8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
        </div>

        <div class="selr">
          PDV
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        @for (p of productos; track p.codigo) {
          <div class="prcard">
            <div class="th">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 20L16 8l-2-2L2 18l2 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
            </div>
            <div class="info">
              <div class="cod">{{ p.codigo }}</div>
              <div class="nm">{{ p.nombre }}</div>
              @for (kv of p.detalles; track kv) {
                <div class="kv" [innerHTML]="kv"></div>
              }
            </div>
          </div>
        }
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

    .searchrow {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }
    .sb {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 9px;
      background: var(--white);
      border: 1.5px solid var(--line);
      border-radius: 13px;
      height: 46px;
      padding: 0 13px;
    }
    .sb svg { width: 17px; height: 17px; color: var(--faint); flex: none; }
    .sb input {
      border: 0; outline: 0;
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--ink);
      background: transparent;
    }
    .sb input::placeholder { color: var(--faint); font-weight: 500; }
    .scan {
      width: 46px; height: 46px;
      border-radius: 13px;
      border: 1.5px solid var(--line);
      background: var(--white);
      display: grid; place-items: center;
      flex: none;
      color: var(--accent);
    }
    .scan svg { width: 20px; height: 20px; }

    .selr {
      width: 100%;
      height: 50px;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent-deep));
      color: var(--white);
      font-family: var(--display);
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      cursor: default;
      margin-bottom: 12px;
    }
    .selr svg { width: 16px; height: 16px; }

    .prcard {
      display: flex;
      gap: 12px;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .prcard .th {
      width: 52px; height: 52px;
      border-radius: 10px;
      background: var(--bg);
      display: grid; place-items: center;
      flex: none;
      color: var(--faint);
    }
    .prcard .th svg { width: 26px; height: 26px; }
    .prcard .info .cod {
      font-size: 11px;
      font-weight: 800;
      color: var(--accent);
    }
    .prcard .info .nm {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      line-height: 1.2;
      margin: 1px 0 4px;
    }
    .prcard .info .kv {
      font-size: 10.5px;
      color: var(--muted);
      line-height: 1.5;
    }
    .prcard .info .kv b { color: var(--ink); }
  `,
})
export class Precios {
  private readonly router = inject(Router);

  protected readonly productos = [
    {
      codigo: 'T1201311800',
      nombre: 'AZADÓN FORJADO 3118 REFO ANCHO',
      detalles: [
        '<b>Precio:</b> $27.400 · IVA 5.0',
        '<b>Precio + IVA:</b> $28.770',
        'Unid. empaque: 12.0',
      ],
    },
    {
      codigo: 'T1201311900',
      nombre: 'AZADÓN FORJADO 3119 PAPE ANGOSTO',
      detalles: [
        '<b>Precio:</b> $25.700 · IVA 5.0',
        '<b>Precio + IVA:</b> $26.985',
        'Unid. empaque: 12.0',
      ],
    },
    {
      codigo: 'T1201311901',
      nombre: 'AZADÓN FORJADO 3119 PAPE ANGOSTO C/MUESCA',
      detalles: [
        '<b>Precio:</b> $25.700 · IVA 5.0',
        'Unid. empaque: 12.0',
      ],
    },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
