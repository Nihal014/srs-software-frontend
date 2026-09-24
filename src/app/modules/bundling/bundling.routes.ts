import type { Routes } from '@angular/router';

// Production is organised by date: the landing list shows one row per day, /day/:date shows that
// day's runs, and /day/:date/new records another run on it. ':id' (one run's detail) stays last.
export const BUNDLING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/production-list/production-list').then((m) => m.ProductionList) },
  { path: 'day/:date', loadComponent: () => import('./components/production-day/production-day').then((m) => m.ProductionDay) },
  { path: 'day/:date/new', loadComponent: () => import('./components/production-form/production-form').then((m) => m.ProductionForm) },
  { path: ':id', loadComponent: () => import('./components/production-detail/production-detail').then((m) => m.ProductionDetail) },
];

export default BUNDLING_ROUTES;
