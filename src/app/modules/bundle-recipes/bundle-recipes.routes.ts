import type { Routes } from '@angular/router';

export const BUNDLE_RECIPES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./components/bundle-recipes/bundle-recipes').then((m) => m.BundleRecipes) },
];

export default BUNDLE_RECIPES_ROUTES;
