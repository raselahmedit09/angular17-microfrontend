import { Routes } from '@angular/router';
import { FlightSearchComponent } from './flight-search/flight-search.component';
import { HomeComponent } from './home/home.component';
import { PassengerSearchComponent } from './passenger-search/passenger-search.component';

export const MFE1_ROUTES: Routes = [
    {
        path: 'mfe1',
        component: HomeComponent,
        pathMatch: 'full',
        data: { breadcrumb: 'mfe1 home', }
    },
    {
        path: 'mfe1', data: { breadcrumb: 'mfe1', },
        children: [
            { path: 'flight-search', component: FlightSearchComponent, data: { breadcrumb: 'flight' } },
            { path: 'passenger-search', component: PassengerSearchComponent, data: { breadcrumb: 'passenger' } },
        ]
    },
    {
        path: 'mfe1', data: { breadcrumb: 'mfe1', },
        loadChildren: () => import('./routes/dashboard/dashboard.routes').then(routes => routes.DASHBOARD_ROUTES)
    },
];
