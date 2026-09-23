import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// Remotes resolve this token from the shell's root injector: Module Federation shares the
// tsconfig path aliases as singletons, so the shell and mfe1 use the same BASE_PATH instance.
import { BASE_PATH as API_BASE_PATH_LEAVE_MANAGEMENT } from 'api-contract-leave-management';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: API_BASE_PATH_LEAVE_MANAGEMENT, useValue: environment.API_BASE_PATH_LEAVE_MANAGEMENT },
  ]
};
