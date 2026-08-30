import type { Routes } from '@angular/router';

export const MASTERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/masters-shell/masters-shell').then((m) => m.MastersShell) },
];

export default MASTERS_ROUTES;
