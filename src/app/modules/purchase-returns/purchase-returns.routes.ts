import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const PURCHASE_RETURNS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/purchase-return-list/purchase-return-list').then((m) => m.PurchaseReturnList),
  },
  {
    path: 'new',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/purchase-return-form/purchase-return-form').then((m) => m.PurchaseReturnForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/purchase-return-detail/purchase-return-detail').then((m) => m.PurchaseReturnDetailPage),
  },
];

export default PURCHASE_RETURNS_ROUTES;
