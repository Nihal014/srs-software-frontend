import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { DISPLAY_DATE_FORMAT } from './shared/utils/date.util';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
    // en-GB renders dates as dd/mm/yyyy, matching how the client writes them.
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    // Every `| date` in a template shows dd/MM/yyyy unless it asks for something else.
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: DISPLAY_DATE_FORMAT } },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {
      appearance: 'outline',
      subscriptSizing: 'dynamic'
    } satisfies MatFormFieldDefaultOptions }
  ]
};
