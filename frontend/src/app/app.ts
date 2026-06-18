import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ConnectivityService } from './services/connectivity.service';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor() {
    const as = inject(AuthService);
    const cs = inject(ConnectivityService);
    as.init();
    cs.init();

    effect(() => {
      if (cs.isOnline() && as.localSession() && !as.isFullyAuthenticated()) {
        as.tryUpgradeSession();
      }
    });
  }
}
