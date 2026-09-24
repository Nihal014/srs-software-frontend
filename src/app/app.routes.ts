import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { printRoutes } from './print/print.routes';

export const routes: Routes = [
  ...printRoutes,
  { path: 'login', loadComponent: () => import('./modules/auth/components/login/login').then((m) => m.Login) },
  { path: 'signup', loadComponent: () => import('./modules/auth/components/signup/signup').then((m) => m.Signup) },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./layout/shell.routes'),
  },
];
