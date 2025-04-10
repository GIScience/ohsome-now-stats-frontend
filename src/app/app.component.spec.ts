import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {ToastComponent} from './toast/toast.component';
import {SummaryComponent} from './dashboard/summary/summary.component';
import {QueryComponent} from './dashboard/query/query.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {TrendingHashtagsComponent} from './dashboard/trending-hashtags/trending-hashtags.component';
import {DataService} from './data.service';
import {BigNumberComponent} from './dashboard/summary/big-number/big-number.component';
import {ExportDataComponent} from "./dashboard/export-data/export-data.component";
import {PlotComponent} from "./dashboard/plot/plot.component";
import {PageNotFoundComponent} from "./page-not-found/page-not-found.component";
import {MapComponent} from "./dashboard/map/map.component";
import {AboutComponent} from "./about/about.component";
import {HelpComponent} from "./help/help.component";
import {UTCToLocalConverterPipe} from "./dashboard/query/pipes/utc-to-local-converter.pipe";
import {Overlay} from "./overlay.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {StatusBannerComponent} from "./status-banner/status-banner.component";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
        ExportDataComponent,
        UTCToLocalConverterPipe,
        Overlay,
        StatusBannerComponent
    ],
    imports: [RouterTestingModule],
    providers: [
        DataService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it(`should have as title 'ohsomeNow Stats'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app.title).toEqual('ohsomeNow Stats');
    });

});
