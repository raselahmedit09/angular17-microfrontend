import { Routes } from '@angular/router';
import { FlightSearchComponent } from './flight-search/flight-search.component';
import { HomeComponent } from './home/home.component';
import { PassengerSearchComponent } from './passenger-search/passenger-search.component';

export const MFE1_ROUTES: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
    },
    {
        path: 'flight-search',
        component: FlightSearchComponent
    },
    {
        path: 'passenger-search',
        component: PassengerSearchComponent
    },
    {
        path: '',
        loadChildren: () => import('./routes/dashboard/dashboard.routes').then(routes => routes.DASHBOARD_ROUTES)
    },
];
