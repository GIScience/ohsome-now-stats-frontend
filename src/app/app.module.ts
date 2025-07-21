import {NgModule, inject, provideAppInitializer} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {NgxDaterangepickerMd} from 'ngx-daterangepicker-material';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeng/themes/aura';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {SummaryComponent} from './dashboard/summary/summary.component';
import {BigNumberComponent} from './dashboard/summary/big-number/big-number.component';
import {QueryComponent} from './dashboard/query/query.component';
import {DataService} from './data.service';
import {PlotComponent} from './dashboard/plot/plot.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {TrendingHashtagsComponent} from './dashboard/trending-hashtags/trending-hashtags.component';
import {ToastComponent} from './toast/toast.component';
import {ToastService} from './toast.service';
import {AboutComponent} from './about/about.component';
import {NgOptimizedImage} from '@angular/common';
import {HelpComponent} from './help/help.component';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {Overlay} from "./overlay.component";
import {UTCToLocalConverterPipe} from './dashboard/query/pipes/utc-to-local-converter.pipe';
import {RouterModule} from "@angular/router";
import {ExportDataComponent} from "./dashboard/export-data/export-data.component";
import {AutoCompleteModule} from 'primeng/autocomplete';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {StatusBannerComponent} from "./status-banner/status-banner.component";
import {DefaultQueryComponent} from "./dashboard/query/default-query/default-query.component";
import {HotQueryComponent} from "./dashboard/query/hot-query/hot-query.component";
import {LiveQueryComponent} from "./dashboard/query/live-query/live-query.component";
import {CountryMapComponent} from './dashboard/country-map/country-map.component';
import {HexMapComponent} from "./dashboard/hex-map/hex-map.component";
import {HexMapLegendComponent} from "./dashboard/hex-map/legend/hex-map-legend.component";
import {CountryMapLegendComponent} from "./dashboard/country-map/country-map-legend/country-map-legend.component";

const routes = [{path: 'help', component: HelpComponent}];

@NgModule({
    declarations: [
        AppComponent,
        SummaryComponent,
        QueryComponent,
        PlotComponent,
        DashboardComponent,
        PageNotFoundComponent,
        TrendingHashtagsComponent,
        ToastComponent,
        AboutComponent,
        HelpComponent,
        BigNumberComponent,
        ExportDataComponent,
        HexMapComponent,
        UTCToLocalConverterPipe,
        StatusBannerComponent,
        DefaultQueryComponent,
        HotQueryComponent,
        LiveQueryComponent
    ],
    bootstrap: [AppComponent],
    imports: [BrowserModule,
        FormsModule,
        AppRoutingModule,
        NgxDaterangepickerMd.forRoot(),
        NgOptimizedImage,
        SelectDropDownModule,
        BrowserAnimationsModule,
        AutoCompleteModule,
        RouterModule.forRoot(routes, {
            scrollOffset: [0, 80]
        }),
        CountryMapComponent,
        HexMapLegendComponent,
        CountryMapLegendComponent,
        Overlay],
    exports: [
        Overlay
    ],
    providers: [
        DataService,
        UTCToLocalConverterPipe,
        ToastService,
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: 'none'
                }
            }
        }),
        provideAppInitializer(() => {
            const initializerFn = (metadataFactory)(inject(DataService));
            return initializerFn();
        }),
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AppModule {
}

export function metadataFactory(provider: DataService) {
    return () => provider.requestMetadata();
}
