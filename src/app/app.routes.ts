import { Routes } from '@angular/router';
import { Shell } from './layout/components/shell/shell';
import { authGuard } from './core/guards/auth.guard';
import { printRoutes } from './print/print.routes';

export const routes: Routes = [
  ...printRoutes,
  { path: 'login', loadComponent: () => import('./modules/auth/components/login/login').then((m) => m.Login) },
  { path: 'signup', loadComponent: () => import('./modules/auth/components/signup/signup').then((m) => m.Signup) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'procurement' },
      { path: 'procurement', loadChildren: () => import('./modules/procurement/procurement.routes') },
      { path: 'grn', loadChildren: () => import('./modules/grn/grn.routes') },
      { path: 'inventory', loadChildren: () => import('./modules/inventory/inventory.routes') },
      { path: 'bundle-recipes', loadChildren: () => import('./modules/bundle-recipes/bundle-recipes.routes') },
      { path: 'bundling', loadChildren: () => import('./modules/bundling/bundling.routes') },
      { path: 'masters', loadChildren: () => import('./modules/masters/masters.routes') },
      { path: 'users', loadChildren: () => import('./modules/users/users.routes') },
    ],
  },
];
