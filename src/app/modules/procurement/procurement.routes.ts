import type { Routes } from '@angular/router';

export const PROCUREMENT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/po-list/po-list').then((m) => m.PoList) },
  { path: 'new', loadComponent: () => import('./components/po-detail/po-detail').then((m) => m.PoDetail) },
  { path: ':id', loadComponent: () => import('./components/po-detail/po-detail').then((m) => m.PoDetail) },
];

export default PROCUREMENT_ROUTES;
