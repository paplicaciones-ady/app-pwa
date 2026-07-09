import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gastos',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Gastos de viaje</h2>
        </div>
      </div>

      <div class="body">
        <div class="selr">
          Dependencia
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <div class="field">
          <input class="inp" placeholder="Ruta">
          <span class="cap">0/500</span>
        </div>
        <div class="field">
          <input class="inp" placeholder="📅  Fecha inicio de viaje" style="color:var(--faint)">
        </div>
        <div class="field">
          <input class="inp" placeholder="📅  Fecha fin del viaje" style="color:var(--faint)">
        </div>
        <div class="field">
          <input class="inp" placeholder="Valor anticipo">
          <span class="cap">0/20</span>
        </div>

        <div class="rowbtn">
          <button class="btn btn-ghost">Cancelar</button>
          <button class="btn btn-primary">Aceptar</button>
        </div>
      </div>

      <button class="fab">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>
      </button>
    </div>
  `,
  styles: `
    :host { display: block; }
    .s2 { display: flex; flex-direction: column; min-height: 100vh; position: relative; }

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
      padding-bottom: 90px;
    }
    .body::-webkit-scrollbar { width: 0; }

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

    .field { margin-bottom: 12px; position: relative; }
    .field .cap {
      position: absolute;
      right: 12px;
      bottom: -15px;
      font-size: 9px;
      color: var(--faint);
    }
    .inp {
      width: 100%;
      height: 50px;
      border: 1.6px solid var(--line);
      border-radius: 14px;
      background: var(--white);
      padding: 0 15px;
      font-family: var(--body);
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      outline: 0;
    }
    .inp::placeholder { color: var(--faint); font-weight: 500; }
    .inp:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(var(--accent-rgb), .13);
    }

    .rowbtn { display: flex; gap: 10px; margin-top: 20px; }
    .btn {
      width: 100%;
      height: 50px;
      border: 0;
      border-radius: 14px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 14.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform .12s;
    }
    .btn:active { transform: scale(.99); }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--accent-deep));
      color: var(--white);
      box-shadow: 0 12px 20px -10px rgba(var(--accent-rgb), .55);
    }
    .btn-ghost {
      background: var(--white);
      border: 1.5px solid var(--line);
      color: var(--muted);
    }

    .fab {
      position: absolute;
      bottom: 76px;
      right: 16px;
      width: 50px; height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-deep));
      border: 0;
      display: grid; place-items: center;
      cursor: pointer;
      box-shadow: 0 12px 22px -8px rgba(var(--accent-rgb), .6);
      z-index: 10;
    }
    .fab svg { width: 22px; height: 22px; color: #fff; }
  `,
})
export class Gastos {
  private readonly router = inject(Router);

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
