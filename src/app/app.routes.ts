import { Routes } from '@angular/router';
import { Shell } from './layout/components/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'procurement' },
      { path: 'procurement', loadChildren: () => import('./modules/procurement/procurement.routes') },
      { path: 'grn', loadChildren: () => import('./modules/grn/grn.routes') },
      { path: 'masters', loadChildren: () => import('./modules/masters/masters.routes') },
    ],
  },
];
