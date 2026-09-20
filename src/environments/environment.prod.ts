// Same-origin: nginx serves this app and forwards /api to the backend, so the identical
// build works on production and on a preprod server, with no CORS involved.
export const environment = {
  production: true,
  apiUrl: '/api',
};
