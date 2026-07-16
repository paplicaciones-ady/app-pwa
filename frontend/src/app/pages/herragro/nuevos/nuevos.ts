import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nuevos',
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
          <h2>Productos nuevos</h2>
        </div>
      </div>

      <div class="body">
        <div class="pmodal">
          <div class="img">
            <img
              src="/products/T1398601007.png"
              alt="BOTA HERRAGRO PVC NEGRA AGRICOLA S/P TALLA 42"
              loading="lazy"
              (error)="
                $any($event.target).src =
                  'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 80 80%27 fill=%27none%27%3E%3Crect x=%2710%27 y=%2710%27 width=%2760%27 height=%2760%27 rx=%2710%27 fill=%27%23f0f0f0%27 stroke=%27%23ccc%27 stroke-width=%272%27/%3E%3Cpath d=%27M28 24l4-4h16l4 4v32l-4 4H32l-4-4z%27 fill=%27%23e8e8e8%27 stroke=%27%23bbb%27 stroke-width=%271.5%27/%3E%3Cpath d=%27M36 34h8M40 30v8%27 stroke=%27%23999%27 stroke-width=%272%27 stroke-linecap=%27round%27/%3E%3C/svg%3E'
              "
            />
          </div>
          <div class="in">
            <h3>BOTA HERRAGRO PVC NEGRA AGRICOLA S/P TALLA 42</h3>
            <div class="kv"><b>Código:</b> T1398601007</div>
            <div class="kv"><b>Precio:</b> $33.210 &nbsp;·&nbsp; <b>Total:</b> $39.520</div>
            <div class="kv"><b>Descuento:</b> 0,00 % &nbsp;·&nbsp; <b>Inv:</b> 0</div>
            <div class="kv"><b>Código EAN:</b> —</div>
            <div class="tt">
              <span style="font-weight:700;color:var(--muted)">Total</span
              ><span class="lab">$0</span>
            </div>
            <div class="pfoot" style="padding:12px 0 0;justify-content:center">
              <div class="stepper"><button>&minus;</button><span>0</span><button>+</button></div>
            </div>
            <div class="promo">
              Promociones
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
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
      padding: 16px 14px;
      position: relative;
      background: var(--bg);
      padding-bottom: 80px;
    }
    .body::-webkit-scrollbar {
      width: 0;
    }

    .pmodal {
      background: var(--white);
      border-radius: 18px;
      box-shadow: 0 20px 40px -18px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      border: 1px solid var(--line);
    }
    .pmodal .img {
      height: 150px;
      background: var(--bg);
      display: grid;
      place-items: center;
      color: var(--faint);
    }
    .pmodal .img svg {
      width: 70px;
      height: 70px;
    }
    .pmodal .in {
      padding: 14px;
    }
    .pmodal .in h3 {
      font-size: 13px;
      font-weight: 800;
      color: var(--accent);
      line-height: 1.25;
      margin-bottom: 8px;
    }
    .pmodal .in .kv {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.7;
    }
    .pmodal .in .kv b {
      color: var(--ink);
    }
    .pmodal .tt {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px dashed var(--line);
      margin-top: 10px;
      padding-top: 10px;
    }
    .pmodal .tt .lab {
      font-weight: 800;
      color: var(--accent);
      font-size: 14px;
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
    .promo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg);
      border-radius: 11px;
      padding: 12px;
      margin-top: 12px;
      font-family: var(--display);
      font-weight: 700;
      color: var(--ink);
      font-size: 13px;
      cursor: default;
    }
    .promo svg {
      width: 16px;
      height: 16px;
      color: var(--accent);
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
export class Nuevos {
  private readonly router = inject(Router);

  protected goBack() {
    this.router.navigate(['/herragro']);
  }
}
