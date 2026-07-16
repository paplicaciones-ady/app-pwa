import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'home',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/cliente',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/encuestas',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/cartera',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/crear',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/descuentos',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/quejas',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/precios',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/nuevos',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/gastos',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/rutero',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/rutas-clientes',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/brain',
    renderMode: RenderMode.Server,
  },
  {
    path: 'herragro/chat',
    renderMode: RenderMode.Server,
  },
  {
    path: 'services',
    renderMode: RenderMode.Server,
  },
  {
    path: 'pqrs',
    renderMode: RenderMode.Server,
  },
  {
    path: 'profile',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
