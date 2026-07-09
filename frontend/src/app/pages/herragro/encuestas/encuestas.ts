import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-encuestas',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Encuestas</h2>
        </div>
      </div>

      <div class="body">
        @for (item of encuestas; track $index) {
          <div class="list-item">
            <div class="li-ic">
              @if ($index === 0) {
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 9h6M9 13h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              }
            </div>
            <div class="li-tx">
              <div class="t">{{ item.nombre }}</div>
            </div>
            <span class="li-ch">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
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

    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 13px;
      margin-bottom: 10px;
      cursor: default;
      transition: .15s;
    }
    .list-item:hover {
      border-color: #dbe3ec;
      box-shadow: 0 10px 20px -14px rgba(16,40,80,.3);
    }
    .li-ic {
      width: 40px; height: 40px;
      border-radius: 11px;
      background: var(--accent-soft);
      display: grid; place-items: center;
      flex: none;
    }
    .li-ic svg { width: 20px; height: 20px; color: var(--accent); }
    .li-tx { flex: 1; min-width: 0; }
    .li-tx .t {
      font-size: 13px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.25;
    }
    .li-ch { color: var(--faint); }
    .li-ch svg { width: 16px; height: 16px; }
  `,
})
export class Encuestas {
  private readonly router = inject(Router);

  protected readonly encuestas = [
    { nombre: 'MERCADO 2026' },
    { nombre: 'Encuesta de Visita Leads GO TO MARKET COSTA' },
    { nombre: 'Encuesta de Visita Leads GO TO MARKET CUNDINAMARCA' },
    { nombre: 'Encuesta de Visita Leads GO TO MARKET AGRO EJE CAF' },
    { nombre: 'Encuesta de Visita Leads GO TO MARKET AGRO VALLE' },
    { nombre: 'Encuesta de Visita Leads GO TO MARKET SANTANDER 2' },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
