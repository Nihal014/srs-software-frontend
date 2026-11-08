import type { Routes } from '@angular/router';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { Shell } from './components/shell/shell';

// Everything after login lives here, loaded on demand so the login page doesn't download the sidebar,
// dialogs, tables and the rest of Angular Material up front.
export const SHELL_ROUTES: Routes = [
  {
    path: '',
    component: Shell,
    providers: [
      // An option whose value is null (the "All accounts" / "All" filters) shows its own label when chosen,
      // instead of leaving the select looking empty.
      { provide: MAT_SELECT_CONFIG, useValue: { canSelectNullableOptions: true } },
    ],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('../modules/dashboard/dashboard.routes') },
      { path: 'purchase', loadChildren: () => import('../modules/masters/masters.routes') },
      // The old Master Data page now lives under Purchase (bookmarks keep working).
      { path: 'masters', pathMatch: 'full', redirectTo: 'purchase/item-codes' },
      { path: 'procurement', loadChildren: () => import('../modules/procurement/procurement.routes') },
      { path: 'grn', loadChildren: () => import('../modules/grn/grn.routes') },
      { path: 'purchase-returns', loadChildren: () => import('../modules/purchase-returns/purchase-returns.routes') },
      { path: 'stock-transfers', loadChildren: () => import('../modules/stock-transfers/stock-transfers.routes') },
      { path: 'product-transfers', loadChildren: () => import('../modules/product-transfers/product-transfers.routes') },
      { path: 'product-inventory', loadChildren: () => import('../modules/product-inventory/product-inventory.routes') },
      { path: 'purchase-invoices', loadChildren: () => import('../modules/purchase-invoices/purchase-invoices.routes') },
      { path: 'inventory', loadChildren: () => import('../modules/inventory/inventory.routes') },
      { path: 'sales', loadChildren: () => import('../modules/sales/sales.routes') },
      { path: 'bundle-recipes', loadChildren: () => import('../modules/bundle-recipes/bundle-recipes.routes') },
      { path: 'bundling', loadChildren: () => import('../modules/bundling/bundling.routes') },
      { path: 'staff', loadChildren: () => import('../modules/staff/staff.routes') },
      { path: 'payroll', loadChildren: () => import('../modules/payroll/payroll.routes') },
      { path: 'accounts', loadChildren: () => import('../modules/accounts/accounts.routes') },
      { path: 'analytics', loadChildren: () => import('../modules/analytics/analytics.routes') },
      { path: 'users', loadChildren: () => import('../modules/users/users.routes') },
    ],
  },
];

export default SHELL_ROUTES;
