import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quejas',
  standalone: true,
  template: `
    <div class="s2">
      <div class="appbar">
        <div class="abk" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abtitle">
          <h2>Quejas y reclamos</h2>
        </div>
      </div>

      <div class="body">
        <div class="claimhead">
          <div class="th">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 20L14 10l-2-2L2 18l2 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 10l3-3 3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          </div>
          <div class="info">
            <div class="cod">T1201303700</div>
            <div class="nm">AZADÓN FORJADO 3037 RECTO</div>
            <div class="pr">\$30.000</div>
          </div>
          <div class="stepper"><button>&minus;</button><span>1</span><button>+</button></div>
        </div>

        <div class="claimlab">Selecciona el tipo de reclamo</div>

        @for (c of reclamos; track c.titulo) {
          <div class="claim">
            <div class="t">{{ c.titulo }}</div>
            <div class="s">{{ c.subtitulo }}</div>
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

    .claimhead {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .claimhead .th {
      width: 56px; height: 56px;
      border-radius: 10px;
      background: var(--bg);
      display: grid; place-items: center;
      flex: none;
      color: var(--faint);
    }
    .claimhead .th svg { width: 30px; height: 30px; }
    .claimhead .info { flex: 1; min-width: 0; }
    .claimhead .info .cod {
      font-size: 11px;
      color: var(--muted);
    }
    .claimhead .info .nm {
      font-size: 13px;
      font-weight: 800;
      color: var(--accent);
      line-height: 1.2;
      margin: 2px 0;
    }
    .claimhead .info .pr {
      font-size: 13px;
      font-weight: 800;
      color: var(--ink);
    }
    .claimhead .stepper {
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1.5px solid var(--line);
      border-radius: 999px;
      padding: 5px 10px;
      flex: none;
    }
    .claimhead .stepper button {
      width: 24px; height: 24px;
      border-radius: 50%;
      border: 0;
      background: var(--bg);
      color: var(--accent);
      font-size: 16px;
      font-weight: 800;
      cursor: default;
      line-height: 1;
    }
    .claimhead .stepper span {
      font-weight: 800;
      color: var(--ink);
      min-width: 16px;
      text-align: center;
    }

    .claimlab {
      font-size: 12px;
      font-weight: 700;
      color: var(--muted);
      margin: 2px 2px 10px;
    }

    .claim {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 9px;
      cursor: default;
      transition: .15s;
    }
    .claim:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
    .claim .t {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--ink);
    }
    .claim .s {
      font-size: 10.5px;
      color: var(--muted);
      margin-top: 2px;
    }
  `,
})
export class Quejas {
  private readonly router = inject(Router);

  protected readonly reclamos = [
    { titulo: 'OXIDACIÓN', subtitulo: 'Reclamaciones técnicas (Garantías)' },
    { titulo: 'EMPAQUE DETERIORADO', subtitulo: 'Queja · averías en transporte' },
    { titulo: 'MAL PEDIDO', subtitulo: 'Queja por mal pedido' },
    { titulo: 'PINTURA', subtitulo: 'Reclamaciones técnicas (Garantías)' },
    { titulo: 'FISURA / FRACTURA', subtitulo: 'Reclamaciones técnicas (Garantías)' },
    { titulo: 'FALTANTE UNIDAD DE EMPAQUE', subtitulo: 'Reclamaciones técnicas (Garantías)' },
  ];

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
