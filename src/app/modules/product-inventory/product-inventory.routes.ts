import type { Routes } from '@angular/router';

export const PRODUCT_INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/product-inventory-shell/product-inventory-shell').then((m) => m.ProductInventoryShell),
  },
];

export default PRODUCT_INVENTORY_ROUTES;
