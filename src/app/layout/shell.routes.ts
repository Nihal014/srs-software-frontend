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
      { path: 'procurement', loadChildren: () => import('../modules/procurement/procurement.routes') },
      { path: 'grn', loadChildren: () => import('../modules/grn/grn.routes') },
      { path: 'inventory', loadChildren: () => import('../modules/inventory/inventory.routes') },
      { path: 'bundle-recipes', loadChildren: () => import('../modules/bundle-recipes/bundle-recipes.routes') },
      { path: 'bundling', loadChildren: () => import('../modules/bundling/bundling.routes') },
      { path: 'staff', loadChildren: () => import('../modules/staff/staff.routes') },
      { path: 'payroll', loadChildren: () => import('../modules/payroll/payroll.routes') },
      { path: 'accounts', loadChildren: () => import('../modules/accounts/accounts.routes') },
      { path: 'masters', loadChildren: () => import('../modules/masters/masters.routes') },
      { path: 'users', loadChildren: () => import('../modules/users/users.routes') },
    ],
  },
];

export default SHELL_ROUTES;
