import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/users-list/users-list').then((m) => m.UsersList),
  },
];

export default USERS_ROUTES;
