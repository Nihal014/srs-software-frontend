import type { Routes } from '@angular/router';

export const GRN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/grn-list/grn-list').then((m) => m.GrnList) },
  { path: 'new', loadComponent: () => import('./components/grn-form/grn-form').then((m) => m.GrnForm) },
  { path: ':id', loadComponent: () => import('./components/grn-form/grn-form').then((m) => m.GrnForm) },
];

export default GRN_ROUTES;
