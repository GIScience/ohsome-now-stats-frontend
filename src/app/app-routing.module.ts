import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  { 
    path: '', 
    pathMatch: 'full', 
    redirectTo: 'dashboard'
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    pathMatch: 'full',
    data: getDefaultValues()
  },
  // Wild Card Route for 404 request
  { 
    path: '**', 
    pathMatch: 'full', 
    component: PageNotFoundComponent 
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

/**
 * Gives the default values for application
 * 
 * @returns IQueryParam
 */
function getDefaultValues(): any {
  const defaultHashtag = 'missingmaps'
  const defaultInterval = 'P1M'
  let tempStart = new Date()
  let tempEnd = new Date()

  tempStart.setDate(tempStart.getDate() - 366)
  tempStart.setMilliseconds(0)

  tempEnd.setDate(tempEnd.getDate() - 1)
  tempEnd.setMilliseconds(0)

  return {
    start: tempStart.toISOString(),
    end: tempEnd.toISOString(),
    hashtags: defaultHashtag,
    interval: defaultInterval
  }
}