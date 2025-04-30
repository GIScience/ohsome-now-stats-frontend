import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DataService } from './data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BigNumberComponent } from './dashboard/summary/big-number/big-number.component';

describe('DataService', () => {
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
//   let activatedRouteSpy : jasmine.SpyObj<ActivatedRoute>;
//   let routerSpy : jasmine.SpyObj<Router>;
  let service: DataService;
  let httpTestingController: HttpTestingController;


  const summaryResponse = { 
    result: {
        changesets: 248932,
        users: 12529,
        roads: 34908.842,
        buildings: 3555884,
        edits: 6041567,
        latest: "2023-08-15T23:45:06Z"
    }}
  const plotResponse = { 
    "result": {
        "changesets": [
            7981,
            19511,
            17696,
            28455,
            20493,
            16331,
            28725,
            32751,
            19542,
            21531,
            17877,
            12061,
            6140
        ],
        "users": [
            348,
            926,
            944,
            1746,
            1050,
            1028,
            2388,
            2766,
            1700,
            1422,
            1209,
            795,
            366
        ],
        "roads": [
            1806.682,
            4703.66,
            5762.056,
            7137.748,
            5186.577,
            2490.931,
            3557.867,
            3840.707,
            1209.167,
            6250.944,
            1148.684,
            1850.827,
            350.268
        ],
        "buildings": [
            91974,
            318981,
            299781,
            332963,
            245761,
            270123,
            436225,
            476306,
            283482,
            368828,
            176580,
            179328,
            105144
        ],
        "edits": [
            171449,
            515592,
            534133,
            635019,
            410787,
            433573,
            687302,
            798496,
            463884,
            570754,
            343400,
            308874,
            170214
        ],
        "startDate": [
            "2022-08-01T00:00:00",
            "2022-09-01T00:00:00",
            "2022-10-01T00:00:00",
            "2022-11-01T00:00:00",
            "2022-12-01T00:00:00",
            "2023-01-01T00:00:00",
            "2023-02-01T00:00:00",
            "2023-03-01T00:00:00",
            "2023-04-01T00:00:00",
            "2023-05-01T00:00:00",
            "2023-06-01T00:00:00",
            "2023-07-01T00:00:00",
            "2023-08-01T00:00:00"
        ],
        "endDate": [
            "2022-09-01T00:00:00",
            "2022-10-01T00:00:00",
            "2022-11-01T00:00:00",
            "2022-12-01T00:00:00",
            "2023-01-01T00:00:00",
            "2023-02-01T00:00:00",
            "2023-03-01T00:00:00",
            "2023-04-01T00:00:00",
            "2023-05-01T00:00:00",
            "2023-06-01T00:00:00",
            "2023-07-01T00:00:00",
            "2023-08-01T00:00:00",
            "2023-09-01T00:00:00"
        ]
    }
  }

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
  const statsByCountryResponse = {
    result: [
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 6,
        "edits": 51,
        "latest": "2023-03-28T10:54:23Z",
        "country": "COD"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 139,
        "edits": 142,
        "latest": "2023-03-15T13:58:33Z",
        "country": "HUN"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 1,
        "edits": 1,
        "latest": "2023-03-01T13:27:58Z",
        "country": "TUN"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 19,
        "latest": "2023-03-01T14:43:13Z",
        "country": "ISR"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 2,
        "latest": "2023-02-23T15:44:18Z",
        "country": "SVK"
    },
    {
        "changesets": 3,
        "users": 2,
        "roads": -0.276,
        "buildings": 0,
        "edits": 12,
        "latest": "2023-02-25T23:26:35Z",
        "country": "TGO"
    },
    {
        "changesets": 20,
        "users": 20,
        "roads": 0.0,
        "buildings": 0,
        "edits": 64,
        "latest": "2023-03-01T14:43:13Z",
        "country": "IRQ"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 33,
        "latest": "2023-03-01T14:43:13Z",
        "country": "GRC"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 2,
        "latest": "2023-02-26T20:59:17Z",
        "country": "SWE"
    },
    {
        "changesets": 1071,
        "users": 332,
        "roads": 359.686,
        "buildings": 6308,
        "edits": 17169,
        "latest": "2023-06-27T11:48:02Z",
        "country": "TUR"
    },
    {
        "changesets": 2,
        "users": 2,
        "roads": 7.262,
        "buildings": 94,
        "edits": 100,
        "latest": "2023-03-29T17:27:46Z",
        "country": "IND"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 2,
        "latest": "2023-02-20T06:33:38Z",
        "country": "IDN"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 9,
        "edits": 10,
        "latest": "2023-03-30T09:36:59Z",
        "country": "PHL"
    },
    {
        "changesets": 27,
        "users": 23,
        "roads": 0.0,
        "buildings": 0,
        "edits": 27,
        "latest": "2023-03-13T19:07:25Z",
        "country": "LBN"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 19,
        "latest": "2023-03-01T14:43:13Z",
        "country": "JOR"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 11,
        "edits": 11,
        "latest": "2023-02-27T14:47:04Z",
        "country": "BGD"
    },
    {
        "changesets": 41,
        "users": 2,
        "roads": -0.545,
        "buildings": 34,
        "edits": 254,
        "latest": "2023-03-14T14:24:47Z",
        "country": "TLS"
    },
    {
        "changesets": 2,
        "users": 2,
        "roads": 0.0,
        "buildings": 2,
        "edits": 2,
        "latest": "2023-03-04T02:04:42Z",
        "country": "PAK"
    },
    {
        "changesets": 6,
        "users": 1,
        "roads": 0.0,
        "buildings": 303,
        "edits": 390,
        "latest": "2023-03-18T16:25:57Z",
        "country": "MWI"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 1,
        "edits": 1,
        "latest": "2023-02-13T12:29:45Z",
        "country": "TZA"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 38,
        "latest": "2023-03-01T14:43:13Z",
        "country": "GEO"
    },
    {
        "changesets": 2,
        "users": 1,
        "roads": 0.0,
        "buildings": 2,
        "edits": 5,
        "latest": "2023-04-28T10:26:05Z",
        "country": "ZMB"
    },
    {
        "changesets": 2,
        "users": 1,
        "roads": 0.0,
        "buildings": 7,
        "edits": 7,
        "latest": "2023-02-17T09:17:09Z",
        "country": "SAU"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 2,
        "edits": 2,
        "latest": "2023-07-15T01:36:28Z",
        "country": "ECU"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 9,
        "latest": "2023-02-11T21:13:25Z",
        "country": "GHA"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 2,
        "latest": "2023-02-10T02:31:44Z",
        "country": "MYS"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 42,
        "latest": "2023-03-15T13:56:44Z",
        "country": "AUS"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 38,
        "latest": "2023-03-01T14:43:13Z",
        "country": "IRN"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 38,
        "latest": "2023-03-01T14:43:13Z",
        "country": "ARM"
    },
    {
        "changesets": 2,
        "users": 1,
        "roads": 0.0,
        "buildings": 4,
        "edits": 9,
        "latest": "2023-03-03T13:20:54Z",
        "country": "UGA"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 1,
        "edits": 1,
        "latest": "2023-02-24T11:18:40Z",
        "country": "SEN"
    },
    {
        "changesets": 2,
        "users": 1,
        "roads": 0.0,
        "buildings": 355,
        "edits": 355,
        "latest": "2023-02-11T15:36:33Z",
        "country": "ZWE"
    },
    {
        "changesets": 5,
        "users": 4,
        "roads": 0.001,
        "buildings": 196,
        "edits": 214,
        "latest": "2023-03-15T13:58:33Z",
        "country": "GBR"
    },
    {
        "changesets": 17,
        "users": 3,
        "roads": 8.148,
        "buildings": 4005,
        "edits": 4200,
        "latest": "2023-04-07T14:56:18Z",
        "country": "NGA"
    },
    {
        "changesets": 5,
        "users": 3,
        "roads": 0.017,
        "buildings": 56,
        "edits": 60,
        "latest": "2023-03-11T18:56:38Z",
        "country": "LBY"
    },
    {
        "changesets": 47055,
        "users": 4501,
        "roads": 15124.886,
        "buildings": 687311,
        "edits": 1168207,
        "latest": "2023-08-04T11:18Z",
        "country": "SYR"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 0,
        "edits": 1,
        "latest": "2023-02-10T12:23:54Z",
        "country": "NER"
    },
    {
        "changesets": 2,
        "users": 2,
        "roads": 0.169,
        "buildings": 0,
        "edits": 5,
        "latest": "2023-03-13T16:54:11Z",
        "country": "USA"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 1,
        "edits": 1,
        "latest": "2023-02-10T14:23:08Z",
        "country": "NLD"
    },
    {
        "changesets": 2,
        "users": 2,
        "roads": 0.071,
        "buildings": 1,
        "edits": 19,
        "latest": "2023-02-19T17:00Z",
        "country": "FRA"
    },
    {
        "changesets": 1,
        "users": 1,
        "roads": 0.0,
        "buildings": 130,
        "edits": 137,
        "latest": "2023-02-13T15:02:03Z",
        "country": "UKR"
    },
    {
        "changesets": 13,
        "users": 2,
        "roads": -0.002,
        "buildings": 487,
        "edits": 514,
        "latest": "2023-02-23T16:28:50Z",
        "country": "NPL"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 19,
        "latest": "2023-03-01T14:43:13Z",
        "country": "BGR"
    },
    {
        "changesets": 19,
        "users": 19,
        "roads": 0.0,
        "buildings": 0,
        "edits": 38,
        "latest": "2023-03-01T14:43:13Z",
        "country": "AZE"
    }
  ],
  query: {
    "timespan": {
        "startDate": "2022-08-16T00:52:40.000Z",
        "endDate": "2023-08-16T00:52:40.000Z"
    },
    "hashtag": "syria"
  }}

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    TestBed.configureTestingModule({
    declarations: [BigNumberComponent],
    imports: [],
    providers: [
        DataService,
        { provide: ActivatedRoute, useValue: { fragment: of('hashtag=missingmaps&interval=P1M') } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});
    service = TestBed.inject(DataService)
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch summary data', (done: DoneFn) => {
    const queryParams = {
      start: '2022-08-16T00:52:40.000Z',
      end: '2023-08-16T00:52:40.000Z',
      hashtag: 'missingmaps',
      countries: ''
    };
  
    service.requestSummary( queryParams ).subscribe({
      next: res => { 
        console.log('>>> should fetch plot data >>> ', queryParams, res)
        expect(res).toEqual(summaryResponse); 
        done()
      },
      error: done.fail
    });  

    const req = httpTestingController.expectOne(
        `${service.url}/stats/${queryParams['hashtag']}?startdate=${queryParams['start']}&enddate=${queryParams['end']}&countries=`
    );
    expect(req.request.method).toBe('GET');
    req.flush(summaryResponse);
  });

  it('should fetch plot data', (done: DoneFn) => {
    const queryParams = {
      start: "2022-08-16T00:52:40.000Z",
      end: "2023-08-16T00:52:40.000Z",
      interval: "P1M",
      hashtag: 'missingmaps',
      countries: ''
    };
  
    service.requestPlot( queryParams ).subscribe({
      next: result => { 
        expect(result).toEqual(plotResponse); 
        done()
      },
      error: done.fail
    });  
    
    const req = httpTestingController.expectOne(
        `${service.url}/stats/${queryParams['hashtag']}/interval?startdate=${queryParams['start']}&enddate=${queryParams['end']}&interval=${queryParams['interval']}&countries=`
    );
    expect(req.request.method).toBe('GET');
    req.flush(plotResponse);
  });

  it('should fetch trending hashtags ', (done: DoneFn) => {
    const queryParams = {
      start: '2022-08-16T00:52:40.000Z',
      end: '2023-08-16T00:52:40.000Z',
      limit: 10,
      countries: ''
    };
  
    service.getTrendingHashtags( queryParams ).subscribe({
      next: result => { 
        expect(result).toEqual(trendingHashtagsResponse); 
        done()
      },
      error: done.fail
    });  
    
    const req = httpTestingController.expectOne(
        `${service.url}/most-used-hashtags?startdate=${queryParams['start']}&enddate=${queryParams['end']}&limit=${queryParams['limit']}&countries=${queryParams['countries']}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(trendingHashtagsResponse);
  });

  it('should fetch stats by country ', (done: DoneFn) => {
    const queryParams = {
      start: '2022-08-16T00:52:40.000Z',
      end: '2023-08-16T00:52:40.000Z',
      hashtag: 'syria'
    };

    service.requestCountryStats( queryParams ).subscribe({
      next: result => { 
        expect(result)
          .withContext('expected stats grouped by countries')
          .toEqual(statsByCountryResponse); 
        done()
      },
      error: done.fail
    });  

    const req = httpTestingController.expectOne(
        `${service.url}/stats/${queryParams['hashtag']}/country?startdate=${queryParams['start']}&enddate=${queryParams['end']}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(statsByCountryResponse);
}); 

});
