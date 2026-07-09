import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Cliente</h2>
          <small>Depósitos El Porvenir · 046</small>
        </div>
        <div class="abact">
          <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 8h6M9 12h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
      </div>

      <div class="body">
        <div class="infocard">
          <div class="cn">SABOGAL SABOGAL LILIA AURORA</div>
          <div class="cd">28823702-0</div>

          <div class="qa">
            <div class="q">
              <div class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l9 9-9 9-9-9 9-9Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></div>
              Waze
            </div>
            <div class="q">
              <div class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="2"/></svg></div>
              Coordenada
            </div>
          </div>

          <div class="kvline"><span class="k">Código</span><span class="v">CN28823702</span></div>
          <div class="kvline"><span class="k">NIT</span><span class="v">28823702-0</span></div>
          <div class="kvline"><span class="k">Dirección</span><span class="v">CRA 15 NO 24-14</span></div>
          <div class="kvline"><span class="k">Lista de precios</span><span class="v">PDV_EJECAFETERO</span></div>
          <div class="kvline"><span class="k">Condición de pago</span><span class="v">30 días factura</span></div>
          <div class="kvline"><span class="k">Cartera</span><span class="v">$0,00</span></div>
          <div class="kvline"><span class="k">Cupo</span><span class="v">$4.500.000,00</span></div>
        </div>

        <div class="actrow">
          <div class="a brain" (click)="goToBrain()">
            <div class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M9 5a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 12a2.5 2.5 0 0 0 4 2V5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 5a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 12a2.5 2.5 0 0 1-4 2" stroke="currentColor" stroke-width="1.8"/></svg></div>
            <span>Pedidos Brain</span>
          </div>
          <div class="a">
            <div class="ic"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <span>Histórico</span>
          </div>
          <div class="a">
            <div class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14l-4-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10h9a5 5 0 0 1 0 10h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
            <span>Devoluciones</span>
          </div>
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
    .abtitle small {
      font-size: 10.5px;
      color: var(--muted);
    }
    .abact {
      width: 34px; height: 34px;
      border-radius: 11px;
      display: grid; place-items: center;
      cursor: pointer; color: var(--accent);
    }
    .abact svg { width: 19px; height: 19px; }

    .body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px 20px;
      position: relative;
      background: var(--bg);
    }
    .body::-webkit-scrollbar { width: 0; }

    .infocard {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 14px;
    }
    .infocard .cn {
      text-align: center;
      font-family: var(--display);
      font-weight: 700;
      font-size: 14px;
      color: var(--ink);
      line-height: 1.2;
    }
    .infocard .cd {
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }
    .qa {
      display: flex;
      justify-content: center;
      gap: 26px;
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
      margin-bottom: 12px;
    }
    .qa .q {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      cursor: default;
    }
    .qa .q .ic {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: var(--accent-soft);
      display: grid; place-items: center;
    }
    .qa .q .ic svg { width: 18px; height: 18px; color: var(--accent); }

    .kvline {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      padding: 5px 0;
    }
    .kvline .k { color: var(--muted); }
    .kvline .v { color: var(--ink); font-weight: 700; text-align: right; }

    .actrow {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }
    .actrow .a.brain { cursor: pointer; }
    .actrow .a.brain:hover { border-color: var(--accent); background: var(--accent-soft); }
    .actrow .a {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 4px;
      text-align: center;
      cursor: default;
    }
    .actrow .a .ic {
      width: 38px; height: 38px;
      border-radius: 12px;
      background: var(--accent-soft);
      display: grid; place-items: center;
      margin: 0 auto 6px;
    }
    .actrow .a .ic svg { width: 20px; height: 20px; color: var(--accent); }
    .actrow .a span { font-size: 10px; font-weight: 700; color: var(--ink); }
  `,
})
export class Cliente {
  private readonly router = inject(Router);

  protected goBack() {
    this.router.navigate(['/herragro']);
  }

  protected goToBrain() {
    this.router.navigate(['/herragro/brain']);
  }
}
