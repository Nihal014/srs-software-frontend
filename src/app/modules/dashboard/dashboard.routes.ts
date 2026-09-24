import type { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.DashboardPage) },
];

export default DASHBOARD_ROUTES;
