import type { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/inventory-shell/inventory-shell').then((m) => m.InventoryShell) },
];

export default INVENTORY_ROUTES;
