import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { MFE1_ROUTES } from './app.routes';
import { NavbarComponent } from './navbar/navbar.component';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(MFE1_ROUTES),
    NavbarComponent
  ]
};
