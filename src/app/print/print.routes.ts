import type { Route } from '@angular/router';
import { authGuard } from 'app/core/guards/auth.guard';
import { PrintLayout } from './print-layout/print-layout';

// Lives on the app's named `print` outlet, so it renders alongside the normal
// page instead of replacing it (global @media print CSS hides everything else).
export const printRoutes: Route[] = [
  {
    path: 'print',
    outlet: 'print',
    component: PrintLayout,
    canActivate: [authGuard],
    children: [
      { path: 'procurement', loadChildren: () => import('app/modules/procurement/procurement-print.routes') },
    ],
  },
];
