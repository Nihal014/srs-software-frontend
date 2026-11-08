import type { Routes } from '@angular/router';

export const PRODUCT_TRANSFERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/product-transfer-list/product-transfer-list').then((m) => m.ProductTransferList),
  },
  {
    path: 'new',
    loadComponent: () => import('./components/product-transfer-form/product-transfer-form').then((m) => m.ProductTransferForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/product-transfer-detail/product-transfer-detail').then((m) => m.ProductTransferDetailPage),
  },
];

export default PRODUCT_TRANSFERS_ROUTES;
