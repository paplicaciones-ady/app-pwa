import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Creación de clientes</h2>
        </div>
      </div>

      <div class="body">
        <div class="note">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="currentColor"/></svg>
          <p>La información debe coincidir con el documento de registro y diligenciarse en MAYÚSCULA, excepto los correos.</p>
        </div>

        <button class="btn btn-primary" style="margin-bottom:16px">Vinculación de cliente</button>

        <div class="sel">
          <select>
            <option>* Seleccione el tipo de persona</option>
            <option>Natural</option>
            <option>Jurídica</option>
          </select>
          <svg class="cv" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <div class="sel">
          <select>
            <option>* Seleccione el tipo de documento</option>
            <option>C.C.</option>
            <option>NIT</option>
            <option>C.E.</option>
          </select>
          <svg class="cv" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <div class="field">
          <input class="inp" placeholder="* Número de documento">
          <span class="cap">0/19</span>
        </div>

        <div class="field">
          <input class="inp" placeholder="* Razón social">
          <span class="cap">0/100</span>
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
    }
    .body::-webkit-scrollbar { width: 0; }

    .note {
      display: flex;
      gap: 10px;
      background: #f0f5fb;
      border: 1px solid #dcebf6;
      border-radius: 13px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .note svg {
      width: 18px; height: 18px;
      color: var(--blue);
      flex: none;
      margin-top: 1px;
    }
    .note p {
      font-size: 11px;
      color: #3a5578;
      line-height: 1.45;
    }

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
      margin-bottom: 12px;
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
      box-shadow: none;
    }

    .sel { position: relative; margin-bottom: 12px; }
    .sel select {
      width: 100%;
      height: 50px;
      border: 1.6px solid var(--accent-soft);
      border-radius: 14px;
      background: var(--white);
      padding: 0 15px;
      font-family: var(--display);
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
      outline: 0;
      appearance: none;
      cursor: pointer;
    }
    .sel select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(var(--accent-rgb), .13);
    }
    .sel .cv {
      position: absolute;
      right: 13px;
      top: 50%;
      transform: translateY(-50%);
      width: 15px; height: 15px;
      color: var(--accent);
      pointer-events: none;
    }

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
    .rowbtn .btn { margin-bottom: 0; }
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
export class Crear {
  private readonly router = inject(Router);

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
