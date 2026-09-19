import type { Routes } from '@angular/router';

export const BUNDLING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/production-list/production-list').then((m) => m.ProductionList) },
  { path: 'new', loadComponent: () => import('./components/production-form/production-form').then((m) => m.ProductionForm) },
  { path: ':id', loadComponent: () => import('./components/production-detail/production-detail').then((m) => m.ProductionDetail) },
];

export default BUNDLING_ROUTES;
