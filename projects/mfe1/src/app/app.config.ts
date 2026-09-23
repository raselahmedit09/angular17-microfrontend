import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { MFE1_ROUTES } from './app.routes';
import { NavbarComponent } from './navbar/navbar.component';

import { BASE_PATH as API_BASE_PATH_LEAVE_MANAGEMENT } from 'api-contract-leave-management';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(MFE1_ROUTES),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: API_BASE_PATH_LEAVE_MANAGEMENT, useValue: environment.API_BASE_PATH_LEAVE_MANAGEMENT },
    NavbarComponent
  ]
};
