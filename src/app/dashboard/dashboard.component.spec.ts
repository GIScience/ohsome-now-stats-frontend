import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { DataService } from '../data.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { QueryComponent } from './query/query.component';
import { SummaryComponent } from './summary/summary.component';
import { PlotComponent } from './plot/plot.component';
import { PageNotFoundComponent } from '../page-not-found/page-not-found.component';
import { MapComponent } from './map/map.component';
import { TrendingHashtagsComponent } from './trending-hashtags/trending-hashtags.component';
import { ToastComponent } from '../toast/toast.component';

describe('DashboardComponent', () => {

  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dataService: jasmine.SpyObj<DataService>;

  /* const summaryResponse = {
    changesets: 248932,
    contributors: 12529,
    kmOfRoads: 34908.842,
    buildingEdits: 3555884,
    edits: 6041567,
    latest: "2023-08-15T23:45:06Z"
  }
  const plotResponse = { 
    result: [
      {
          "changesets": 7981,
          "users": 348,
          "roads": 1306.775,
          "buildings": 90840,
          "edits": 171449,
          "startDate": "2022-08-01T00:00",
          "endDate": "2022-09-01T00:00"
      },
      {
          "changesets": 19511,
          "users": 926,
          "roads": 3475.699,
          "buildings": 318896,
          "edits": 515592,
          "startDate": "2022-09-01T00:00",
          "endDate": "2022-10-01T00:00"
      },
      {
          "changesets": 17694,
          "users": 944,
          "roads": 4029.328,
          "buildings": 298996,
          "edits": 534133,
          "startDate": "2022-10-01T00:00",
          "endDate": "2022-11-01T00:00"
      },
      {
          "changesets": 28453,
          "users": 1745,
          "roads": 5417.311,
          "buildings": 332231,
          "edits": 635019,
          "startDate": "2022-11-01T00:00",
          "endDate": "2022-12-01T00:00"
      },
      {
          "changesets": 20492,
          "users": 1050,
          "roads": 1911.042,
          "buildings": 246071,
          "edits": 410787,
          "startDate": "2022-12-01T00:00",
          "endDate": "2023-01-01T00:00"
      },
      {
          "changesets": 16331,
          "users": 1028,
          "roads": 1708.561,
          "buildings": 250919,
          "edits": 433573,
          "startDate": "2023-01-01T00:00",
          "endDate": "2023-02-01T00:00"
      },
      {
          "changesets": 28725,
          "users": 2388,
          "roads": 3630.598,
          "buildings": 435397,
          "edits": 687302,
          "startDate": "2023-02-01T00:00",
          "endDate": "2023-03-01T00:00"
      },
      {
          "changesets": 32749,
          "users": 2766,
          "roads": 3673.338,
          "buildings": 475165,
          "edits": 798496,
          "startDate": "2023-03-01T00:00",
          "endDate": "2023-04-01T00:00"
      },
      {
          "changesets": 19538,
          "users": 1700,
          "roads": 1055.987,
          "buildings": 283915,
          "edits": 463842,
          "startDate": "2023-04-01T00:00",
          "endDate": "2023-05-01T00:00"
      },
      {
          "changesets": 21531,
          "users": 1422,
          "roads": 5980.354,
          "buildings": 367955,
          "edits": 570754,
          "startDate": "2023-05-01T00:00",
          "endDate": "2023-06-01T00:00"
      },
      {
          "changesets": 17877,
          "users": 1209,
          "roads": 968.694,
          "buildings": 174728,
          "edits": 343400,
          "startDate": "2023-06-01T00:00",
          "endDate": "2023-07-01T00:00"
      },
      {
          "changesets": 11932,
          "users": 794,
          "roads": 1516.868,
          "buildings": 177484,
          "edits": 308503,
          "startDate": "2023-07-01T00:00",
          "endDate": "2023-08-01T00:00"
      },
      {
          "changesets": 6118,
          "users": 365,
          "roads": 234.287,
          "buildings": 103287,
          "edits": 168717,
          "startDate": "2023-08-01T00:00",
          "endDate": "2023-09-01T00:00"
      }
  ]}
  const countryStatResponse = { 
    query: {
      "timespan": {
          "startDate": "2022-08-02T10:21:31.000Z",
          "endDate": "2023-08-02T10:21:31.000Z"
      },
      "hashtag": "missingmaps"
    },
    result: [
      {
          "users": 1,
          "roads": 0.0,
          "buildings": 0,
          "edits": 0,
          "latest": "2023-03-09T00:59:48Z",
          "country": "PAN"
      },
      {
          "users": 2,
          "roads": 0.0,
          "buildings": 27,
          "edits": 194,
          "latest": "2022-12-16T09:04:18Z",
          "country": "KIR"
      },
      {
          "users": 1,
          "roads": -0.002,
          "buildings": 0,
          "edits": 10,
          "latest": "2022-09-14T16:56:35Z",
          "country": "KWT"
      },
      {
          "users": 1,
          "roads": 0.674,
          "buildings": 385,
          "edits": 404,
          "latest": "2023-05-27T22:07:42Z",
          "country": "BRN"
      },
  ] }
  const trendingHashtagsResponse = { result: [
    {
        "hashtag": "missingmaps",
        "number_of_users": 12506
    },
    {
        "hashtag": "opencitieslac",
        "number_of_users": 11707
    },
    {
        "hashtag": "türkiyeeq060223",
        "number_of_users": 9231
    },
    {
        "hashtag": "msf",
        "number_of_users": 5670
    },
    {
        "hashtag": "yercizenler",
        "number_of_users": 5371
    },
    {
        "hashtag": "omhap",
        "number_of_users": 4975
    },
    {
        "hashtag": "turkiye",
        "number_of_users": 4802
    },
    {
        "hashtag": "turkey",
        "number_of_users": 4802
    },
    {
        "hashtag": "syria",
        "number_of_users": 4519
    },
    {
        "hashtag": "youthmappers",
        "number_of_users": 3589
    }
  ] }
  const defaultValues = {
    start: "2022-08-16T00:52:40.000Z",
    end: "2023-08-16T00:52:40.000Z",
    interval: "P1M",
    hashtags: "missingmaps"
  } */

  beforeEach(async() => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', ['getDefaultValues', 'requestSummary', 'requestCountryStats', 'getTrendingHashtags']);

    TestBed.configureTestingModule({
      imports: [ RouterTestingModule, HttpClientTestingModule ],
      declarations: [ 
        SummaryComponent,
        QueryComponent,
        PlotComponent,
        DashboardComponent,
        PageNotFoundComponent,
        MapComponent,
        TrendingHashtagsComponent,
        ToastComponent,
       ],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: ActivatedRoute, useValue: { fragment: of('hashtags=missingmaps&interval=P1M') } },
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

  it('should get query params from URL fragment', () => {
    const fragment = 'start=2020-01-01T00:00:00.000Z&end=2020-12-31T00:00:00.000Z';
    const expectedParams = {
      start: '2020-01-01T00:00:00.000Z',
      end: '2020-12-31T00:00:00.000Z'
    };

    const params = component.getQueryParamsFromFragments(fragment);

    expect(params).toEqual(expectedParams);
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