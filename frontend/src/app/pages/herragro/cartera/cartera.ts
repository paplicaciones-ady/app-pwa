import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cartera',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Estado de cartera</h2>
        </div>
      </div>

      <div class="body">
        <div class="sectitle">Ordenar por <span class="filter">Mora <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>

        @for (c of clientes; track c.nombre) {
          <div class="ccard">
            <div class="cav">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="2"/><path d="M5 20c0-3.4 3.1-6 7-6s7 2.6 7 6" stroke="currentColor" stroke-width="2"/></svg>
            </div>
            <div class="cinfo">
              <div class="nm">{{ c.nombre }}</div>
              <div class="cn">{{ c.documento }}</div>
            </div>
            <div class="batt" [class.red]="c.nivel === 'red'" [class.yellow]="c.nivel === 'yellow'" [class.green]="c.nivel === 'green'">
              <i></i><i></i><i></i><i></i><i></i>
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

    .sectitle {
      font-size: 14px;
      font-weight: 700;
      color: var(--muted);
      margin: 4px 2px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      background: var(--accent-soft);
      padding: 6px 12px;
      border-radius: 999px;
      cursor: default;
    }
    .filter svg { width: 14px; height: 14px; }

    .ccard {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 13px;
      margin-bottom: 10px;
    }
    .cav {
      width: 38px; height: 38px;
      border-radius: 50%;
      border: 2px solid var(--accent-soft);
      display: grid; place-items: center;
      flex: none;
      color: var(--accent);
    }
    .cav svg { width: 20px; height: 20px; }
    .cinfo { flex: 1; min-width: 0; }
    .cinfo .nm {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.2;
    }
    .cinfo .cn {
      font-size: 11px;
      color: var(--muted);
      margin-top: 1px;
    }

    .batt {
      width: 26px; height: 40px;
      border: 2px solid #dfe6ee;
      border-radius: 5px;
      flex: none;
      padding: 2px;
      display: flex;
      flex-direction: column-reverse;
      gap: 2px;
      position: relative;
    }
    .batt::before {
      content: "";
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px; height: 3px;
      background: #dfe6ee;
      border-radius: 2px;
    }
    .batt i {
      height: 5px;
      border-radius: 1px;
      background: #eef2f7;
    }
    .batt.red i:nth-child(-n+1) { background: var(--accent); }
    .batt.yellow i:nth-child(-n+3) { background: var(--yellow); }
    .batt.green i { background: var(--green); }
  `,
})
export class Cartera {
  private readonly router = inject(Router);

  protected readonly clientes = [
    { nombre: 'FERRETERIA MANDROS', documento: 'CN9695934 · Mora alta', nivel: 'red' },
    { nombre: 'FERRETERIA NUEVA CALDAS', documento: 'CN9995105 · Mora alta', nivel: 'red' },
    { nombre: 'PACHON VASQUEZ GUSTAVO', documento: 'CN10273627 · Chinchiná', nivel: 'yellow' },
    { nombre: 'FERREMAGICA', documento: 'CN16071663 · Al día parcial', nivel: 'yellow' },
    { nombre: 'ARANGO MORALES GERMAN', documento: 'CN75033448 · Al día', nivel: 'green' },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
