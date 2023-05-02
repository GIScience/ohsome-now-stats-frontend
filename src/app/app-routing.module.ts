import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { RouteResolver } from './resolvers/route.resolver';

const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent,
    resolve: {
      summaryData: RouteResolver
    }
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    resolve: {
      summaryData: RouteResolver
    }
  },
  { 
    path: 'dashboard/:hashtags', 
    component: DashboardComponent,
    resolve: {
      summaryData: RouteResolver
    }
  },
  { 
    path: 'dashboard/:hashtags/:start/:end/:interval', 
    component: DashboardComponent,
    // resolve: {
    //   summaryData: RouteResolver
    // }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
