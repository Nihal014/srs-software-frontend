import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

// The whole Sales section is Admin-only. Each document has a list, a "new" screen and a detail screen.
export const SALES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'customers' },
      { path: 'customers', loadComponent: () => import('./components/customers-page/customers-page').then((m) => m.CustomersPage) },
      { path: 'locations', loadComponent: () => import('./components/sales-locations-master/sales-locations-master').then((m) => m.SalesLocationsMaster) },

      { path: 'quotations', loadComponent: () => import('./components/quotation-list/quotation-list').then((m) => m.QuotationList) },
      { path: 'quotations/new', loadComponent: () => import('./components/quotation-form/quotation-form').then((m) => m.QuotationForm) },
      { path: 'quotations/:id', loadComponent: () => import('./components/quotation-detail/quotation-detail').then((m) => m.QuotationDetailPage) },

      { path: 'orders', loadComponent: () => import('./components/sales-order-list/sales-order-list').then((m) => m.SalesOrderList) },
      { path: 'orders/new', loadComponent: () => import('./components/sales-order-form/sales-order-form').then((m) => m.SalesOrderForm) },
      { path: 'orders/:id', loadComponent: () => import('./components/sales-order-detail/sales-order-detail').then((m) => m.SalesOrderDetailPage) },

      { path: 'returns', loadComponent: () => import('./components/sales-return-list/sales-return-list').then((m) => m.SalesReturnList) },
      { path: 'returns/new', loadComponent: () => import('./components/sales-return-form/sales-return-form').then((m) => m.SalesReturnForm) },
      { path: 'returns/:id', loadComponent: () => import('./components/sales-return-detail/sales-return-detail').then((m) => m.SalesReturnDetailPage) },

      { path: 'invoices', loadComponent: () => import('./components/invoices-page/invoices-page').then((m) => m.InvoicesPage) },
      { path: 'invoices/new', loadComponent: () => import('./components/sales-invoice-form/sales-invoice-form').then((m) => m.SalesInvoiceForm) },
      { path: 'invoices/:id', loadComponent: () => import('./components/sales-invoice-detail/sales-invoice-detail').then((m) => m.SalesInvoiceDetailPage) },

      { path: 'delivery-notes', loadComponent: () => import('./components/delivery-note-list/delivery-note-list').then((m) => m.DeliveryNoteList) },
      { path: 'delivery-notes/new', loadComponent: () => import('./components/delivery-note-form/delivery-note-form').then((m) => m.DeliveryNoteForm) },
      { path: 'delivery-notes/:id', loadComponent: () => import('./components/delivery-note-detail/delivery-note-detail').then((m) => m.DeliveryNoteDetailPage) },
    ],
  },
];

export default SALES_ROUTES;
