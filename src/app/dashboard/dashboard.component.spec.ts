import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { DataService } from '../data.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dataService: DataService;
  let route: ActivatedRoute;
  let router: Router;

  const summaryResponse = {
    result: {
      "changesets": 248807,
      "users": 12529,
      "roads": 34933.711,
      "buildings": 3552649,
      "edits": 6038786,
      "latest": "2023-08-15T14:20:16Z"
    }
  }
  const plotResponse = { 
    result: [
      {
          "changesets": 8105,
          "users": 354,
          "roads": 1314.792,
          "buildings": 92499,
          "edits": 174063,
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
          "changesets": 5866,
          "users": 358,
          "roads": 233.153,
          "buildings": 98436,
          "edits": 162564,
          "startDate": "2023-08-01T00:00",
          "endDate": "2023-09-01T00:00"
      }
  ] }
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [DashboardComponent, HttpClientTestingModule],
      providers: [
        DataService,
        { provide: ActivatedRoute, useValue: { fragment: of('hashtags=test&interval=month') } },
        { provide: Router, useValue: {} },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    route = TestBed.inject(ActivatedRoute);
    router = TestBed.inject(Router);

    spyOn(dataService, 'requestSummary').and.returnValue(of( summaryResponse ));
    spyOn(dataService, 'requestPlot').and.returnValue(of( plotResponse ));
    spyOn(dataService, 'requestCountryStats').and.returnValue(of( countryStatResponse ));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of( trendingHashtagsResponse ));
  });

  it('should not navigate or make API requests if route.data is empty', () => {
    spyOn(component.router, 'navigate');
    spyOn(dataService, 'requestSummary');
    spyOn(dataService, 'requestPlot');
    spyOn(dataService, 'getTrendingHashtags');

    component.route.data.next(null);
    component.route.fragment.next(null);

    expect(component.router.navigate).not.toHaveBeenCalled();
    expect(dataService.requestSummary).not.toHaveBeenCalled();
    expect(dataService.requestPlot).not.toHaveBeenCalled();
    expect(dataService.getTrendingHashtags).not.toHaveBeenCalled();
  });

  it('should navigate and make API requests with queryParams from route.data and empty fragment', () => {
    spyOn(component.router, 'navigate');
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot').and.returnValue(of({ result: [] }));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const data = { hashtags: 'tag1,tag2', start: '2023-01-01', end: '2023-01-31', interval: 'monthly' };
    component.route.data.next(data);
    component.route.fragment.next(null);

    expect(component.router.navigate).toHaveBeenCalledWith([], {
      fragment: `hashtags=${data.hashtags}&start=${data.start}&end=${data.end}&interval=${data.interval}`
    });
    expect(dataService.requestSummary).toHaveBeenCalledWith(data);
    expect(dataService.requestPlot).toHaveBeenCalledWith(data);
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should make API requests with queryParams from fragment and populate summaryData and hashtagsData', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot').and.returnValue(of({ result: [] }));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const fragment = 'hashtags=tag1,tag2&start=2023-01-01&end=2023-01-31&interval=monthly';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly'
    });
    expect(dataService.requestPlot).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly'
    });
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should handle invalid queryParams from fragment', () => {
    spyOn(dataService, 'requestSummary');
    spyOn(dataService, 'requestPlot');
    spyOn(dataService, 'getTrendingHashtags');

    const fragment = 'hashtags=tag1,tag2&start=invalid-date&end=2023-01-31&interval=monthly';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).not.toHaveBeenCalled();
    expect(dataService.requestPlot).not.toHaveBeenCalled();
    expect(dataService.getTrendingHashtags).not.toHaveBeenCalled();
    expect(component.summaryData).toBeUndefined();
    expect(component.hashtagsData).toBeUndefined();
  });

  it('should handle missing keys in queryParams from fragment', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot');
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const fragment = 'start=2023-01-01&end=2023-01-31';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31'
    });
    expect(dataService.requestPlot).not.toHaveBeenCalled();
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should handle additional keys in queryParams from fragment', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot').and.returnValue(of({ result: [] }));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const fragment = 'hashtags=tag1,tag2&start=2023-01-01&end=2023-01-31&interval=monthly&extraKey=value';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly',
      extraKey: 'value'
    });
    expect(dataService.requestPlot).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly',
      extraKey: 'value'
    });
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should handle API request errors', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(throwError('Error requesting summary'));
    spyOn(dataService, 'requestPlot').and.returnValue(throwError('Error requesting plot'));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(throwError('Error requesting trending hashtags'));

    const fragment = 'hashtags=tag1,tag2&start=2023-01-01&end=2023-01-31&interval=monthly';
    component.route.fragment.next(fragment);

    expect(component.summaryData).toBeUndefined();
    expect(component.hashtagsData).toBeUndefined();
    // You can also test error handling behavior, such as displaying an error message on the component.
  });
});
