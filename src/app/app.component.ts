import { Component, OnInit } from '@angular/core';
import {Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import {NgIf} from "@angular/common";
import { AsyncPipe } from '@angular/common';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { LoginService } from './services/login.service';
import {GlobalLoadingComponent} from "./components/global-loading/global-loading.component";
import { LoadingService } from './services/loading.service';
import { RouterLoadingHook } from './services/router-loading.hook';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, ToastContainerComponent, GlobalLoadingComponent, AsyncPipe],
  template: `
    <header class="header">
      <a routerLink="/" class="brand" aria-label="Ir para início">
        <span class="brand-badge">🛠️</span>
        <span>Orçamento por Partes</span>
      </a>

      <nav class="nav-right">
        <!-- Se logado: mostra Meus Orçamentos + Sair; senão: mostra Login -->
        <ng-container *ngIf="logged; else showLogin">
          <a routerLink="/meus" class="nav-link">Meus Orçamentos</a>
          <button class="nav-link" (click)="logout()">Sair</button>
        </ng-container>
        <ng-template #showLogin>
          <a routerLink="/login" class="btn btn-ghost">Login</a>
          <a routerLink="/registrar" class="btn btn-ghost">Registre-se</a>
        </ng-template>

        <!-- Sempre visível -->
        <a routerLink="/novo" class="btn btn-primary">Novo Orçamento</a>

        <!-- Tema -->
        <button class="btn btn-ghost" (click)="toggleTheme()">
          {{ theme === 'dark' ? 'Tema claro' : 'Tema escuro' }}
        </button>
      </nav>
    </header>

    <main class="container grid">
      <router-outlet></router-outlet>
      <app-toast-container></app-toast-container>
      <app-global-loading [show]="loadingService.isLoading$ | async"></app-global-loading>
    </main>
  `
})
export class AppComponent implements OnInit {
  theme: 'light' | 'dark' = 'dark';

  constructor(private auth: AuthService,
              private loginSvc: LoginService,
              private router: Router,
              public loadingService: LoadingService,
              _routerHook: RouterLoadingHook) {}
  get logged(): boolean { return this.auth.isLoggedIn(); }

  ngOnInit() {
    const saved = (localStorage.getItem('theme') as 'light'|'dark') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this._applyTheme(saved);
  }
  toggleTheme() { this._applyTheme(this.theme === 'dark' ? 'light' : 'dark'); }

  logout() {
    this.loginSvc.Logout().subscribe({
      next: () => {
        this.auth.logoutLocal();         // limpa sessão local
        this.router.navigate(['/login']); // 👈 redireciona sempre
      },
      error: () => {
        // mesmo que o backend falhe, força logout e navega
        this.auth.logoutLocal();
        this.router.navigate(['/login']); // 👈 redireciona
      }
    });
  }

  private _applyTheme(t: 'light'|'dark') { this.theme = t; document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t); }
}
