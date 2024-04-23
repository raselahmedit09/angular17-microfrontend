import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const MFE2_ROUTES: Routes = [
    {
        path: 'mfe2',
        component: HomeComponent,
        pathMatch: 'full',
        data: { breadcrumb: 'mfe2 home', }
    },
    {
        path: 'mfe2', data: { breadcrumb: 'mfe2', },
        loadChildren: () => import('./routes/dashboard/dashboard.routes').then(routes => routes.DASHBOARD_ROUTES)
    },
];
