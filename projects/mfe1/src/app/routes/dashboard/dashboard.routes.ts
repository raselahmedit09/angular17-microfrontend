import { Routes } from '@angular/router';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';

export const DASHBOARD_ROUTES: Routes = [

    { path: 'about', component: AboutComponent, data: { breadcrumb: 'about', } },
    {
        path: 'about', data: { breadcrumb: 'about', },
        children: [
            { path: 'contact', component: ContactComponent, data: { breadcrumb: 'contact' } },
        ]
    },
];