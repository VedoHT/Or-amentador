import { Routes } from '@angular/router';
import { WizardComponent } from './pages/wizard/wizard.component';
import { ResultComponent } from './pages/result/result.component';
import { PublicComponent } from './pages/public/public.component';
import { ListComponent } from './pages/list/list.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';   // 👈
import { guestGuard } from './guards/guest.guard'; // 👈
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'novo', pathMatch: 'full' },
  { path: 'novo', component: WizardComponent },
  { path: 'meus', component: ListComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'registrar', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'resultado/:slug', component: ResultComponent },
  { path: 'orcamento/:slug',  component: ResultComponent, data: { public: true } },
  { path: '**', redirectTo: 'novo' }
];
