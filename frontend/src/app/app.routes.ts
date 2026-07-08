import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';
import { Home } from './pages/home/home';
import { Services } from './pages/services/services';
import { Pqrs } from './pages/pqrs/pqrs';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { ChatCanvas } from './pages/chat-canvas/chat-canvas';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'services', component: Services, canActivate: [authGuard] },
  { path: 'pqrs', component: Pqrs, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'chat', component: ChatCanvas, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'auth/callback', component: AuthCallback },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
