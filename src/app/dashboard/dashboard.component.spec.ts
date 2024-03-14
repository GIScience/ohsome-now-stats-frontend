import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {DashboardComponent} from './dashboard.component';
import {DataService} from '../data.service';
import {of} from 'rxjs';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRoute} from '@angular/router';
import {QueryComponent} from './query/query.component';
import {SummaryComponent} from './summary/summary.component';
import {PlotComponent} from './plot/plot.component';
import {PageNotFoundComponent} from '../page-not-found/page-not-found.component';
import {MapComponent} from './map/map.component';
import {TrendingHashtagsComponent} from './trending-hashtags/trending-hashtags.component';
import {ToastComponent} from '../toast/toast.component';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {BigNumberComponent} from './summary/big-number/big-number.component';
import {Overlay} from "../overlay.component";
import {UTCToLocalConverterPipe} from './query/pipes/utc-to-local-converter.pipe';
import {ExportDataComponent} from "./export-data/export-data.component";
import {AutoCompleteModule} from "primeng/autocomplete";

describe('DashboardComponent', () => {

    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let dataService: jasmine.SpyObj<DataService>;

    beforeEach(async () => {
        const dataServiceSpy = jasmine.createSpyObj('DataService', ['getDefaultValues', 'requestSummary', 'requestCountryStats', 'getTrendingHashtags', 'getQueryParamsFromFragments']);

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule, SelectDropDownModule, AutoCompleteModule],
            declarations: [
                SummaryComponent,
                QueryComponent,
                PlotComponent,
                DashboardComponent,
                PageNotFoundComponent,
                MapComponent,
                TrendingHashtagsComponent,
                ToastComponent,
                BigNumberComponent,
                ExportDataComponent,
                UTCToLocalConverterPipe,
                Overlay,
            ],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {
                    provide: ActivatedRoute,
                    useValue: {fragment: of('hashtags=missingmaps&interval=P1M&countries=DE,UGA')}
                },
                {provide: UTCToLocalConverterPipe}
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardComponent);
        dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        component = TestBed.createComponent(DashboardComponent).componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    // it('should call data service to fetch summary data', () => {
    //   const queryParams = {
    //     start: '2022-08-16T00:52:40.000Z',
    //     end: '2023-08-16T00:52:40.000Z'
    //   };

    //   dataService.requestSummary.and.returnValue(of({result: summaryResponse}));

    //   component.queryParams = queryParams;

    //   component.ngOnInit();

    //   expect(dataService.requestSummary).toHaveBeenCalledWith(queryParams);
    //   expect(component.summaryData).toEqual(summaryResponse);
    // });

    /* it('should dispatch summary data on setSummary', () => {

      dataService.setSummary(summaryResponse);

      dataService.summaryData.subscribe(result => {
        expect(result).toBe(summaryResponse);
      });

    }); */

    // it('should call data service to fetch plot data', () => {
    //   const queryParams = {
    //     start: "2022-08-16T00:52:40.000Z",
    //     end: "2023-08-16T00:52:40.000Z",
    //     interval: "P1M"
    //   };

    //   dataService.requestPlot.and.returnValue(of({result: plotResponse.result}));
    //   // component.queryParams = queryParams;

    //   component.ngOnInit();

    //   expect(dataService.requestPlot).toHaveBeenCalledWith(queryParams);
    //   expect(component.plotData).toEqual(plotResponse.result);
    // });

    /* it('should call data service to fetch plot data', () => {

      const queryParams = {
        start: "2022-08-16T00:52:40.000Z",
        end: "2023-08-16T00:52:40.000Z",
        interval: "P1M"
      };

      // spyOn(dataService, 'requestPlot').and.returnValue(of({result: plotResponse.result}));
      // const dataServiceSpy = jasmine.createSpyObj('DataService', ['requestPlot']);
      // dataServiceSpy.requestPlot.and.returnValue(of({result: plotResponse.result}))

      dataService.requestPlot( queryParams ).subscribe(result => {
        expect(result).toEqual(plotResponse);
      });

      // expect(dataService.requestPlot).toHaveBeenCalledTimes(1);

    }); */

});
