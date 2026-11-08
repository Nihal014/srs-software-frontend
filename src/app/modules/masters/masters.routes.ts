import type { Routes } from '@angular/router';

// Mounted under /purchase: vendors, item codes and stock locations are set up from the Purchase menu.
export const MASTERS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'item-codes' },
  {
    path: 'vendors',
    loadComponent: () => import('./components/vendors-page/vendors-page').then((m) => m.VendorsPage),
  },
  {
    path: 'item-codes',
    loadComponent: () => import('./components/item-codes-shell/item-codes-shell').then((m) => m.ItemCodesShell),
  },
  {
    path: 'stock-locations',
    loadComponent: () => import('./components/stock-locations-page/stock-locations-page').then((m) => m.StockLocationsPage),
  },
];

export default MASTERS_ROUTES;
