import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/accounts-shell/accounts-shell').then((m) => m.AccountsShell),
  },
];

export default ACCOUNTS_ROUTES;
