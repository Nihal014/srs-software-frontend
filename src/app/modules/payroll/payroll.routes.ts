import type { Routes } from '@angular/router';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/payroll-shell/payroll-shell').then((m) => m.PayrollShell),
  },
];

export default PAYROLL_ROUTES;
