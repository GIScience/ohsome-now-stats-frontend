import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FlatpickrModule } from 'angularx-flatpickr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SummaryComponent } from './dashboard/summary/summary.component';
import { QueryComponent } from './dashboard/query/query.component';
import { DataService } from './data.service';
import { PlotComponent } from './dashboard/plot/plot.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MapComponent } from './dashboard/map/map.component';

@NgModule({
  declarations: [
    AppComponent,
    SummaryComponent,
    QueryComponent,
    PlotComponent,
    DashboardComponent,
    PageNotFoundComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    FlatpickrModule.forRoot()
  ],
  providers: [
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
