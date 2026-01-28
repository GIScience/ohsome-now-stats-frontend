import {Routes} from '@angular/router';

import {DefaultDashboardComponent} from './dashboard/views/default-dashboard/default-dashboard.component';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {AboutComponent} from './about/about.component';
import {HelpComponent} from './help/help.component';
import {UserDashboardComponent} from "@app/dashboard/views/user-dashboard/user-dashboard.component";

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'dashboard',
        component: DefaultDashboardComponent,
        children: [
            {
                path: 'hotosm',
                component: DefaultDashboardComponent,
            }, {
                path: 'live',
                component: DefaultDashboardComponent,
            }
        ]
    },
    {
        path: 'user-dashboard',
        pathMatch: 'full',
        component: UserDashboardComponent
    },
    {
        path: 'about',
        pathMatch: 'full',
        component: AboutComponent
    },
    {
        path: 'help',
        pathMatch: 'full',
        component: HelpComponent
    },
    // Wild Card Route for 404 request
    {
        path: '**',
        pathMatch: 'full',
        component: PageNotFoundComponent
    },
];

