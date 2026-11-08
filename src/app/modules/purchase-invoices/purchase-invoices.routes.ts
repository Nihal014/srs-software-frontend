import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const PURCHASE_INVOICES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/purchase-invoice-list/purchase-invoice-list').then((m) => m.PurchaseInvoiceList),
      },
      {
        path: 'new',
        loadComponent: () => import('./components/purchase-invoice-form/purchase-invoice-form').then((m) => m.PurchaseInvoiceForm),
      },
      {
        path: ':id',
        loadComponent: () => import('./components/purchase-invoice-detail/purchase-invoice-detail').then((m) => m.PurchaseInvoiceDetailPage),
      },
    ],
  },
];

export default PURCHASE_INVOICES_ROUTES;
