import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SummaryComponent } from './dashboard/summary/summary.component';
import { BigNumberComponent } from './dashboard/summary/big-number/big-number.component';
import { QueryComponent } from './dashboard/query/query.component';
import { DataService } from './data.service';
import { PlotComponent } from './dashboard/plot/plot.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MapComponent } from './dashboard/map/map.component';
import { TrendingHashtagsComponent } from './dashboard/trending-hashtags/trending-hashtags.component';
import { ToastComponent } from './toast/toast.component';
import { ToastService } from './toast.service';
import { AboutComponent } from './about/about.component';
import {NgOptimizedImage} from '@angular/common';
import { HelpComponent } from './help/help.component';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import {Overlay} from "./overlay.component";
import {AutocompleteLibModule} from 'angular-ng-autocomplete';
import { UTCToLocalConverterPipe } from './dashboard/query/pipes/utc-to-local-converter.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SummaryComponent,
    QueryComponent,
    PlotComponent,
    DashboardComponent,
    PageNotFoundComponent,
    MapComponent,
    TrendingHashtagsComponent,
    ToastComponent,
    AboutComponent,
    HelpComponent,
    BigNumberComponent,
    UTCToLocalConverterPipe,
    Overlay
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    NgxDaterangepickerMd.forRoot(),
    NgOptimizedImage,
    SelectDropDownModule,
    AutocompleteLibModule
  ],
  providers: [
    DataService,
    UTCToLocalConverterPipe,
    ToastService,
    { provide: APP_INITIALIZER, useFactory: metadataFactory, deps: [DataService], multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function metadataFactory(provider: DataService) {
  return () => provider.requestMetadata();
}
