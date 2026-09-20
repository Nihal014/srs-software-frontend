import type { Routes } from '@angular/router';

export const PROCUREMENT_PRINT_ROUTES: Routes = [
  { path: 'po', loadComponent: () => import('./print/po-print/po-print').then((m) => m.PoPrint) },
];

export default PROCUREMENT_PRINT_ROUTES;
