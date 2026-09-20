import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/payroll-shell/payroll-shell').then((m) => m.PayrollShell),
  },
];

export default PAYROLL_ROUTES;
