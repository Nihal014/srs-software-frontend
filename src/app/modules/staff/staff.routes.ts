import type { Routes } from '@angular/router';
import { adminGuard } from 'app/core/guards/admin.guard';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/staff-list/staff-list').then((m) => m.StaffList),
  },
];

export default STAFF_ROUTES;
