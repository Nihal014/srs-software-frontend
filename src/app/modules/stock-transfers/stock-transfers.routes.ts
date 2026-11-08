import type { Routes } from '@angular/router';

export const STOCK_TRANSFERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/stock-transfer-list/stock-transfer-list').then((m) => m.StockTransferList),
  },
  {
    path: 'new',
    loadComponent: () => import('./components/stock-transfer-form/stock-transfer-form').then((m) => m.StockTransferForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/stock-transfer-detail/stock-transfer-detail').then((m) => m.StockTransferDetailPage),
  },
];

export default STOCK_TRANSFERS_ROUTES;
