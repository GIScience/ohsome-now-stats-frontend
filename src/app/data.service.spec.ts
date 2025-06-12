import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ActivatedRoute} from '@angular/router';

import {DataService} from './data.service';
import {environment} from '../environments/environment';
import {
    IHashtag,
    IMetaData,
    IMetadataResponse,
    ISummaryData,
    ITrendingHashtagResponse,
    IWrappedCountryStatsData,
    IWrappedPlotData,
    IWrappedSummaryData,
    IWrappedTopicCountryData,
    IWrappedTopicData,
    IWrappedTopicPlotData,
    TopicResponse
} from './dashboard/types';

describe('DataService', () => {
    let service: DataService;
    let httpMock: HttpTestingController;
    let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

    const mockUrl = 'https://int-stats.now.ohsome.org/api';
    const mockMetaData: IMetaData = {
        min_timestamp: '2023-01-01T00:00:00.000Z',
        max_timestamp: '2023-12-31T23:59:59.000Z'
    };

    const mockMetadataResponse: IMetadataResponse = {
        result: mockMetaData,
        attribution: { url: 'test' },
        query: { timespan: { startDate: '2023-01-01', endDate: '2023-12-31' }, hashtag: 'test' },
        metadata: { executionTime: 100, requestUrl: 'test' }
    };

    const mockSummaryData: ISummaryData = {
        users: 100,
        edits: 500,
        buildings: 200,
        roads: 150,
        changesets: 50,
        latest: '2023-01-01T00:00:00.000Z',
        hashtag: 'test',
        countries: 'US',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
    };

    const mockWrappedSummaryData: IWrappedSummaryData = {
        result: mockSummaryData
    };

    const mockTopicResponse: TopicResponse = {
        amenity: { hashtag: 'test', topic: 'amenity', value: 10 },
        body_of_water: { hashtag: 'test', topic: 'body_of_water', value: 20 },
        commercial: { hashtag: 'test', topic: 'commercial', value: 30 },
        education: { hashtag: 'test', topic: 'education', value: 40 },
        financial: { hashtag: 'test', topic: 'financial', value: 50 },
        healthcare: { hashtag: 'test', topic: 'healthcare', value: 60 },
        lulc: { hashtag: 'test', topic: 'lulc', value: 70 },
        place: { hashtag: 'test', topic: 'place', value: 80 },
        poi: { hashtag: 'test', topic: 'poi', value: 90 },
        social_facility: { hashtag: 'test', topic: 'social_facility', value: 100 },
        wash: { hashtag: 'test', topic: 'wash', value: 110 },
        waterway: { hashtag: 'test', topic: 'waterway', value: 120 }
    };

    const mockWrappedTopicData: IWrappedTopicData = {
        result: mockTopicResponse
    };

    const mockQueryParams = {
        hashtag: 'test',
        start: '2023-01-01',
        end: '2023-01-31',
        countries: 'US',
        interval: 'P1M',
        topics: 'amenity,buildings'
    };

    beforeEach(() => {
        const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                fragment: 'hashtag=test&start=2023-01-01T00:00:00Z&end=2023-01-31T00:00:00Z'
            }
        });

        // Mock environment
        // spyOnProperty(environment, 'ohsomeStatsServiceUrl', 'get').and.returnValue(mockUrl); // OLD INCORRECT WAY
        environment.ohsomeStatsServiceUrl = mockUrl; // Correct way to mock a simple variable

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                DataService,
                { provide: ActivatedRoute, useValue: activatedRouteSpy }
            ]
        });

        service = TestBed.inject(DataService);
        httpMock = TestBed.inject(HttpTestingController);
        mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(service.url).toBe(mockUrl);
        expect(service.trendingHashtagLimit).toBe(10);
        expect(service.defaultIntervalValue).toBe('P1M');
        expect(service.timeIntervals).toEqual([
            {label: 'five minutes', value: 'PT5M'},
            {label: 'hourly', value: 'PT1H'},
            {label: 'daily', value: 'P1D'},
            {label: 'weekly', value: 'P1W'},
            {label: 'monthly', value: 'P1M'},
            {label: 'quarterly', value: 'P3M'},
            {label: 'yearly', value: 'P1Y'},
        ]);
    });

    describe('requestMetadata', () => {
        it('should fetch metadata and update signal', () => {
            service.requestMetadata().subscribe(metadata => {
                expect(metadata).toEqual(mockMetaData);
                expect(service.metaData()).toEqual(mockMetaData);
            });

            const req = httpMock.expectOne(`${mockUrl}/metadata`);
            expect(req.request.method).toBe('GET');
            req.flush(mockMetadataResponse);
        });

        it('should handle client-side errors', () => {
            spyOn(console, 'error');

            service.requestMetadata().subscribe({
                next: () => fail('should have failed'),
                error: (error) => {
                    expect(error.message).toBe('ohsomeNow Stats Service did not respond with a metadata response.');
                    expect(console.error).toHaveBeenCalledWith('An error occurred:', jasmine.any(Object));
                }
            });

            const req = httpMock.expectOne(`${mockUrl}/metadata`);
            req.error(new ProgressEvent('error'), { status: 0 });
        });

        it('should handle server errors', () => {
            spyOn(console, 'error');

            service.requestMetadata().subscribe({
                next: () => fail('should have failed'),
                error: (error) => {
                    expect(error.message).toBe('ohsomeNow Stats Service did not respond with a metadata response.');
                    expect(console.error).toHaveBeenCalledWith(
                        'Backend returned code 500, body was: ',
                        'Server Error'
                    );
                }
            });

            const req = httpMock.expectOne(`${mockUrl}/metadata`);
            req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
        });
    });

    describe('requestAllHashtags', () => {
        it('should fetch all hashtags', () => {
            const mockHashtags = [{ hashtag: 'test1' }, { hashtag: 'test2' }];
            const mockResponse = { result: mockHashtags };

            service.requestAllHashtags().subscribe(hashtags => {
                expect(hashtags).toEqual(mockHashtags);
            });

            const req = httpMock.expectOne(`${mockUrl}/hashtags`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });

    describe('getQueryParamsFromFragments', () => {
        it('should parse query params from URL fragment', () => {
            const result = service.getQueryParamsFromFragments();
            expect(result).toEqual({
                hashtag: 'test',
                start: '2023-01-01T00:00:00Z',
                end: '2023-01-31T00:00:00Z'
            });
        });

        it('should return null for empty fragment', () => {
            mockActivatedRoute.snapshot.fragment = null;
            const result = service.getQueryParamsFromFragments();
            expect(result).toBeNull();
        });

        it('should return null for short fragment', () => {
            mockActivatedRoute.snapshot.fragment = 'a';
            const result = service.getQueryParamsFromFragments();
            expect(result).toBeNull();
        });
    });

    describe('requestSummary', () => {
        it('should fetch summary data', () => {
            service.requestSummary(mockQueryParams).subscribe(data => {
                expect(data).toEqual(mockWrappedSummaryData);
            });

            const expectedUrl = `${mockUrl}/stats?hashtag=${mockQueryParams.hashtag}&startdate=${mockQueryParams.start}&enddate=${mockQueryParams.end}&countries=${mockQueryParams.countries}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockWrappedSummaryData);
        });

        // it('should be cancellable via abort subject', () => {
        //     const subscription = service.requestSummary(mockQueryParams).subscribe();
        //
        //     service.abortSummaryReqSub.next();
        //
        //     expect(subscription.closed).toBe(true);
        // });
    });

    describe('requestTopic', () => {
        it('should fetch topic data', () => {
            service.requestTopic(mockQueryParams).subscribe(data => {
                expect(data).toEqual(mockWrappedTopicData);
            });

            const expectedUrl = `${mockUrl}/topic/${mockQueryParams.topics}?hashtag=${mockQueryParams.hashtag}&startdate=${mockQueryParams.start}&enddate=${mockQueryParams.end}&countries=${mockQueryParams.countries}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockWrappedTopicData);
        });
    });

    describe('requestTopicInterval', () => {
        it('should fetch topic interval data', () => {
            const mockTopicPlotData: IWrappedTopicPlotData = {
                result: {
                    amenity: {
                        value: [10, 20, 30],
                        topic: 'amenity',
                        startDate: ['2023-01-01', '2023-01-02', '2023-01-03'],
                        endDate: ['2023-01-01', '2023-01-02', '2023-01-03']
                    }
                }
            };

            service.requestTopicInterval(mockQueryParams).subscribe(data => {
                expect(data).toEqual(mockTopicPlotData);
            });

            const expectedUrl = `${mockUrl}/topic/${mockQueryParams.topics}/interval?hashtag=${mockQueryParams.hashtag}&startdate=${mockQueryParams.start}&enddate=${mockQueryParams.end}&countries=${mockQueryParams.countries}&interval=${mockQueryParams.interval}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockTopicPlotData);
        });
    });

    describe('requestTopicCountryStats', () => {
        it('should fetch topic country stats', () => {
            const mockTopicCountryData: IWrappedTopicCountryData = {
                query: { timespan: { startDate: '2023-01-01', endDate: '2023-01-31' }, hashtag: 'test' },
                result: {
                    amenity: [{ topic: 'amenity', country: 'US', value: 100 }],
                    body_of_water: [{ topic: 'body_of_water', country: 'US', value: 200 }],
                    commercial: [{ topic: 'commercial', country: 'US', value: 300 }],
                    education: [{ topic: 'education', country: 'US', value: 400 }],
                    financial: [{ topic: 'financial', country: 'US', value: 500 }],
                    healthcare: [{ topic: 'healthcare', country: 'US', value: 600 }],
                    lulc: [{ topic: 'lulc', country: 'US', value: 700 }],
                    place: [{ topic: 'place', country: 'US', value: 800 }],
                    poi: [{ topic: 'poi', country: 'US', value: 900 }],
                    social_facility: [{ topic: 'social_facility', country: 'US', value: 1000 }],
                    wash: [{ topic: 'wash', country: 'US', value: 1100 }],
                    waterway: [{ topic: 'waterway', country: 'US', value: 1200 }],
                    users: [{ topic: 'users', country: 'US', value: 50 }],
                    edits: [{ topic: 'edits', country: 'US', value: 500 }],
                    buildings: [{ topic: 'buildings', country: 'US', value: 200 }],
                    roads: [{ topic: 'roads', country: 'US', value: 150 }]
                }
            };

            service.requestTopicCountryStats(mockQueryParams).subscribe(data => {
                expect(data).toEqual(mockTopicCountryData);
            });

            const expectedUrl = `${mockUrl}/topic/${mockQueryParams.topics}/country?hashtag=${mockQueryParams.hashtag}&startdate=${mockQueryParams.start}&enddate=${mockQueryParams.end}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockTopicCountryData);
        });
    });

    describe('requestPlot', () => {
        it('should fetch plot data', () => {
            const mockPlotData: IWrappedPlotData = {
                result: {
                    users: [10, 20, 30],
                    roads: [100, 200, 300],
                    buildings: [50, 100, 150],
                    edits: [500, 1000, 1500],
                    changesets: [5, 10, 15],
                    latest: '2023-01-31T00:00:00.000Z',
                    hashtag: ['test'],
                    startDate: ['2023-01-01', '2023-01-02', '2023-01-03'],
                    endDate: ['2023-01-01', '2023-01-02', '2023-01-03'],
                    countries: ['US']
                }
            };

            service.requestPlot(mockQueryParams).subscribe(data => {
                expect(data).toEqual(mockPlotData);
            });

            const expectedUrl = `${mockUrl}/stats/interval?hashtag=${mockQueryParams.hashtag}&startdate=${mockQueryParams.start}&enddate=${mockQueryParams.end}&interval=${mockQueryParams.interval}&countries=${mockQueryParams.countries}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockPlotData);
        });
    });

    describe('requestCountryStats', () => {
        it('should fetch country stats', () => {
            const mockCountryStatsData: IWrappedCountryStatsData = {
                query: { timespan: { startDate: '2023-01-01', endDate: '2023-01-31' }, hashtag: 'test' },
                result: [{
                    users: 100,
                    roads: 200,
                    buildings: 150,
                    edits: 500,
                    amenity: 10,
                    body_of_water: 20,
                    commercial: 30,
                    education: 40,
                    financial: 50,
                    healthcare: 60,
                    lulc: 70,
                    place: 80,
                    poi: 90,
                    social_facility: 100,
                    wash: 110,
                    waterway: 120,
                    latest: '2023-01-31T00:00:00.000Z',
                    country: 'US'
                }]
            };

            service.requestCountryStats(mockQueryParams).subscribe(data => {
                expect(data).toEqual(mockCountryStatsData);
            });

            const expectedUrl = `${mockUrl}/stats/country?hashtag=${mockQueryParams.hashtag}&startdate=${mockQueryParams.start}&enddate=${mockQueryParams.end}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockCountryStatsData);
        });
    });

    describe('getTrendingHashtags', () => {
        it('should fetch trending hashtags', () => {
            const mockHashtags: IHashtag[] = [
                { hashtag: 'trending1', number_of_users: 100 },
                { hashtag: 'trending2', number_of_users: 200 }
            ];

            const mockTrendingResponse: ITrendingHashtagResponse = {
                result: mockHashtags,
                attribution: { url: 'test' },
                query: { timespan: { startDate: '2023-01-01', endDate: '2023-01-31' }, hashtag: 'test' },
                metadata: { executionTime: 100, requestUrl: 'test' }
            };

            const params = {
                start: '2023-01-01',
                end: '2023-01-31',
                limit: 10,
                countries: 'US'
            };

            service.getTrendingHashtags(params).subscribe(hashtags => {
                expect(hashtags).toEqual(mockHashtags);
            });

            const expectedUrl = `${mockUrl}/most-used-hashtags?startdate=${params.start}&enddate=${params.end}&limit=${params.limit}&countries=${params.countries}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockTrendingResponse);
        });

        // it('should be cancellable via abort subject', () => {
        //     const params = { start: '2023-01-01', end: '2023-01-31', limit: 10, countries: 'US' };
        //     const subscription = service.getTrendingHashtags(params).subscribe();
        //
        //     service.abortHashtagReqSub.next();
        //
        //     expect(subscription.closed).toBe(true);
        // });
    });

    describe('abort subjects', () => {
        it('should create new abort subjects', () => {
            const initialHashtagSub = service.abortHashtagReqSub;
            const initialSummarySub = service.abortSummaryReqSub;
            const initialTopicSub = service.abortTopicReqSub;
            const initialIntervalSub = service.abortIntervalReqSub;

            service.getAbortHashtagReqSubject();
            service.getAbortSummaryReqSubject();
            service.getAbortTopicReqSubject();
            service.getAbortIntervalReqSubject();

            expect(service.abortHashtagReqSub).not.toBe(initialHashtagSub);
            expect(service.abortSummaryReqSub).not.toBe(initialSummarySub);
            expect(service.abortTopicReqSub).not.toBe(initialTopicSub);
            expect(service.abortIntervalReqSub).not.toBe(initialIntervalSub);
        });
    });

    describe('live mode', () => {
        it('should toggle live mode', () => {
            let currentMode: boolean | undefined;
            service.liveMode.subscribe(mode => currentMode = mode);

            expect(currentMode).toBe(false);

            service.toggleLiveMode(true);
            expect(currentMode).toBe(true);

            service.toggleLiveMode(false);
            expect(currentMode).toBe(false);
        });
    });

    describe('metadata signal', () => {
        it('should provide readonly access to metadata', () => {
            const initialMetadata = service.metaData();
            expect(initialMetadata).toBeDefined();

            // Test that the signal is readonly (should not have set method)
            expect((service.metaData as any).set).toBeUndefined();
        });

        it('should update metadata signal when requestMetadata is called', () => {
            service.requestMetadata().subscribe();

            const req = httpMock.expectOne(`${mockUrl}/metadata`);
            req.flush(mockMetadataResponse);

            expect(service.metaData()).toEqual(mockMetaData);
        });
    });
});