import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';
import { Home } from './pages/home/home';
import { Herragro } from './pages/herragro/herragro';
import { Cliente } from './pages/herragro/cliente/cliente';
import { Encuestas } from './pages/herragro/encuestas/encuestas';
import { Cartera } from './pages/herragro/cartera/cartera';
import { Crear } from './pages/herragro/crear/crear';
import { Descuentos } from './pages/herragro/descuentos/descuentos';
import { Quejas } from './pages/herragro/quejas/quejas';
import { Precios } from './pages/herragro/precios/precios';
import { Nuevos } from './pages/herragro/nuevos/nuevos';
import { Gastos } from './pages/herragro/gastos/gastos';
import { Rutero } from './pages/herragro/rutero/rutero';
import { Brain } from './pages/herragro/brain/brain';
import { Services } from './pages/services/services';
import { Pqrs } from './pages/pqrs/pqrs';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { ChatCanvas } from './pages/chat-canvas/chat-canvas';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'herragro', component: Herragro, canActivate: [authGuard] },
  { path: 'herragro/cliente', component: Cliente, canActivate: [authGuard] },
  { path: 'herragro/encuestas', component: Encuestas, canActivate: [authGuard] },
  { path: 'herragro/cartera', component: Cartera, canActivate: [authGuard] },
  { path: 'herragro/crear', component: Crear, canActivate: [authGuard] },
  { path: 'herragro/descuentos', component: Descuentos, canActivate: [authGuard] },
  { path: 'herragro/quejas', component: Quejas, canActivate: [authGuard] },
  { path: 'herragro/precios', component: Precios, canActivate: [authGuard] },
  { path: 'herragro/nuevos', component: Nuevos, canActivate: [authGuard] },
  { path: 'herragro/gastos', component: Gastos, canActivate: [authGuard] },
  { path: 'herragro/rutero', component: Rutero, canActivate: [authGuard] },
  { path: 'herragro/brain', component: Brain, canActivate: [authGuard] },
  { path: 'herragro/chat', component: ChatCanvas, canActivate: [authGuard] },
  { path: 'services', component: Services, canActivate: [authGuard] },
  { path: 'pqrs', component: Pqrs, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'chat', component: ChatCanvas, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'auth/callback', component: AuthCallback },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
