import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-services',
  standalone: true,
  template: `
    <div class="s2">
      <div class="s2-head">
        <div class="s2-top">
          <div class="cback" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="org-chip">
            <span class="org-dot"></span>
            Elena 360 · Servicios
          </div>
        </div>
        <div class="greet">
          <div class="welcome">
            <div class="elena-ava">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="1.2"/><circle cx="12" cy="10" r="3.4" stroke="#fff" stroke-width="1.8"/><path d="M5 20c0-3.4 3.1-6 7-6s7 2.6 7 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
            </div>
            <div>
              <h2>Hola, {{ userName() }} <span class="wave">👋</span></h2>
              <p class="elena-sub">Soy Elena. ¿Con qué área te ayudo?</p>
            </div>
          </div>
        </div>
        <h1 class="page-title">Selecciona un servicio</h1>
        <p class="lead below">Elige el área que atenderá tu solicitud.</p>
      </div>

      <div class="s2-body">
        <div class="seclab">Servicios disponibles <span class="cnt">5</span></div>

        <div class="grid">
          <!-- TEC — Tecnología (ACTIVO) -->
          <div class="svc hero" style="--g:linear-gradient(140deg,#2168bd,#0c3a73)" (click)="goToPqrs()">
            <span class="tag">TEC</span>
            <div class="ico"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
            <div class="right">
              <div class="nm">Tecnología</div>
              <div class="ds">Soporte TI, accesos, sistemas y equipos</div>
              <div class="av"><span class="d"></span> EN LÍNEA · ~2 MIN</div>
            </div>
            <span class="wm">TEC</span>
          </div>

          <!-- CON — Contabilidad (DESHABILITADO) -->
          <div class="svc disabled" style="--g:linear-gradient(140deg,#49ad6d,#2c7849)">
            <span class="tag">CON</span>
            <span class="coming-soon">Próximamente</span>
            <div class="ico"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
            <div class="nm">Contabilidad</div>
            <div class="ds">Registros y cierres contables</div>
            <div class="av"><span class="d"></span> EN LÍNEA · ~5 MIN</div>
            <span class="wm">CON</span>
          </div>

          <!-- TES — Tesorería (DESHABILITADO) -->
          <div class="svc disabled" style="--g:linear-gradient(140deg,#d99a16,#a96f05)">
            <span class="tag">TES</span>
            <span class="coming-soon">Próximamente</span>
            <div class="ico"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="2"/></svg></div>
            <div class="nm">Tesorería</div>
            <div class="ds">Pagos, recaudos y caja</div>
            <div class="av"><span class="d"></span> EN LÍNEA · ~5 MIN</div>
            <span class="wm">TES</span>
          </div>

          <!-- GAD — Gestión Administrativa (DESHABILITADO) -->
          <div class="svc disabled" style="--g:linear-gradient(140deg,#7b7b75,#4a4a44)">
            <span class="tag">GAD</span>
            <span class="coming-soon">Próximamente</span>
            <div class="ico"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20V8l8-4 8 4v12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 20v-5h6v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
            <div class="nm">Gestión Adm.</div>
            <div class="ds">Activos, compras y servicios</div>
            <div class="av sched"><span class="d"></span> 8:00 – 18:00</div>
            <span class="wm">GAD</span>
          </div>

          <!-- SEL — Selección (DESHABILITADO) -->
          <div class="svc disabled" style="--g:linear-gradient(140deg,#f5904f,#d85f22)">
            <span class="tag">SEL</span>
            <span class="coming-soon">Próximamente</span>
            <div class="ico"><svg viewBox="0 0 24 24" fill="none"><circle cx="10" cy="8" r="3.4" stroke="currentColor" stroke-width="2"/><path d="M4 19c0-3.3 3.1-6 7-6 1 0 2 .2 2.8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 14l2 2 4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="nm">Selección</div>
            <div class="ds">Vacantes y candidatos</div>
            <div class="av"><span class="d"></span> EN LÍNEA · ~10 MIN</div>
            <span class="wm">SEL</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .s2 { display: flex; flex-direction: column; min-height: 100vh; }
    .s2-head {
      background: linear-gradient(155deg, #1356a0, var(--blue) 60%, #0d3970);
      padding: 16px 20px 32px;
      position: relative;
      overflow: hidden;
      flex: none;
    }
    .s2-top {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      z-index: 2;
    }
    .cback {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: rgba(255,255,255,.14);
      border: 1px solid rgba(255,255,255,.18);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: .15s;
      flex: none;
    }
    .cback:hover { background: rgba(255,255,255,.24); }
    .cback svg { width: 20px; height: 20px; color: #fff; }
    .org-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,.95);
      padding: 5px 14px 5px 6px;
      border-radius: 999px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
      box-shadow: 0 6px 14px -8px rgba(0,0,0,.4);
      margin-left: auto;
    }
    .org-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--green));
    }
    .greet {
      position: relative;
      z-index: 2;
      margin-top: 18px;
    }
    .welcome {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .elena-ava {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,.1);
      display: grid;
      place-items: center;
      flex: none;
    }
    .elena-ava svg { width: 26px; height: 26px; color: #fff; }
    .greet h2 {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 22px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .greet h2 .wave { font-size: 20px; }
    .elena-sub {
      color: #bcd6f4;
      font-size: 13px;
      margin-top: 2px;
    }
    .page-title {
      font-family: var(--display);
      font-weight: 700;
      color: var(--white);
      font-size: 20px;
      margin-top: 18px;
      position: relative;
      z-index: 2;
    }
    .lead.below {
      color: #bcd6f4;
      font-size: 13px;
      margin-top: 2px;
      position: relative;
      z-index: 2;
    }
    .s2-body {
      flex: 1;
      background: var(--bg);
      border-radius: 24px 24px 0 0;
      margin-top: -20px;
      padding: 22px 20px 90px;
      position: relative;
      z-index: 3;
      overflow-y: auto;
    }
    .s2-body::-webkit-scrollbar { width: 0; }

    .seclab {
      font-family: var(--display);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--faint);
      margin: 2px 4px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .seclab .cnt {
      background: #eef2f7;
      color: var(--muted);
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 99px;
    }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }

    .svc {
      position: relative;
      border-radius: 20px;
      padding: 14px;
      cursor: pointer;
      overflow: hidden;
      color: #fff;
      background: var(--g);
      box-shadow: 0 14px 26px -16px rgba(8,24,52,.55);
      transition: transform .18s, box-shadow .22s, opacity .22s;
      min-height: 138px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      isolation: isolate;
    }
    .svc::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(120% 95% at 14% 6%, rgba(255,255,255,.30), transparent 52%);
      z-index: 0;
    }
    .svc > * { position: relative; z-index: 1; }
    .svc:hover { transform: translateY(-4px); box-shadow: 0 24px 36px -16px rgba(8,24,52,.62); }
    .svc:active { transform: translateY(-1px) scale(.99); }
    .svc .ico {
      width: 40px;
      height: 40px;
      border-radius: 13px;
      background: rgba(255,255,255,.22);
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.28);
      margin-bottom: auto;
    }
    .svc .ico svg { width: 21px; height: 21px; color: #fff; }
    .svc .tag {
      position: absolute;
      top: 13px;
      right: 13px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: .07em;
      background: rgba(255,255,255,.24);
      padding: 5px 10px;
      border-radius: 9px;
      border: 1px solid rgba(255,255,255,.3);
      z-index: 1;
    }
    .svc .nm {
      font-family: var(--display);
      font-weight: 700;
      font-size: 15px;
      line-height: 1.08;
      margin-top: 12px;
    }
    .svc .ds {
      font-size: 10.5px;
      opacity: .9;
      margin-top: 3px;
      line-height: 1.3;
    }
    .svc .av {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 9.5px;
      font-weight: 800;
      margin-top: 10px;
      background: rgba(255,255,255,.2);
      padding: 4px 9px;
      border-radius: 99px;
      width: max-content;
      letter-spacing: .01em;
    }
    .svc .av .d {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #c8ffd9;
      box-shadow: 0 0 0 3px rgba(200,255,217,.25);
    }
    .svc .av.sched .d { background: #ffe6b3; box-shadow: 0 0 0 3px rgba(255,230,179,.25); }
    .svc.hero {
      grid-column: 1 / -1;
      min-height: 110px;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 15px;
    }
    .svc.hero .ico { width: 50px; height: 50px; border-radius: 15px; margin-bottom: 0; }
    .svc.hero .ico svg { width: 26px; height: 26px; }
    .svc.hero .right { flex: 1; }
    .svc.hero .nm { font-size: 18px; margin-top: 0; }
    .svc.hero .wm { font-size: 96px; bottom: -26px; right: 8px; }
    .svc .wm {
      position: absolute;
      right: -4px;
      bottom: -16px;
      font-family: var(--display);
      font-weight: 700;
      font-size: 60px;
      line-height: 1;
      color: rgba(255,255,255,.17);
      letter-spacing: -.03em;
      z-index: 0;
      pointer-events: none;
    }

    .svc.disabled {
      opacity: .5;
      filter: grayscale(.5);
      cursor: default;
      pointer-events: none;
    }
    .svc.disabled:hover { transform: none; box-shadow: 0 14px 26px -16px rgba(8,24,52,.55); }
    .coming-soon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--display);
      font-weight: 700;
      font-size: 13px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: rgba(255,255,255,.85);
      background: rgba(0,0,0,.25);
      backdrop-filter: blur(3px);
      border-radius: 20px;
      z-index: 5;
    }
  `,
})
export class Services {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly userName = computed(() => this.authService.currentUser()?.name?.split(' ')[0] || 'Usuario');

  protected goBack() {
    this.router.navigate(['/home']);
  }

  protected goToPqrs() {
    this.router.navigate(['/pqrs']);
  }
}
