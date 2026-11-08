import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const ANALYTICS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'reports' },
  {
    path: 'reports',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/reports-shell/reports-shell').then((m) => m.ReportsShell),
  },
  {
    path: 'gst',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/gst-reports/gst-reports').then((m) => m.GstReports),
  },
];

export default ANALYTICS_ROUTES;
