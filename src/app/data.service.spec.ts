import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ActivatedRoute} from '@angular/router';

import {DataService} from './data.service';
import {environment} from '../environments/environment';
import {IMetaData, IMetadataResponse} from './dashboard/types';

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
        attribution: {url: 'test'},
        query: {timespan: {startDate: '2023-01-01', endDate: '2023-12-31'}, hashtag: 'test'},
        metadata: {executionTime: 100, requestUrl: 'test'}
    };


    beforeEach(() => {
        const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                fragment: 'hashtag=test&start=2023-01-01T00:00:00Z&end=2023-01-31T00:00:00Z'
            }
        });

        // Mock environment
        environment.ohsomeStatsServiceUrl = mockUrl; // Correct way to mock a simple variable

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                DataService,
                {provide: ActivatedRoute, useValue: activatedRouteSpy}
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
            req.error(new ProgressEvent('error'), {status: 0});
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
            req.error(new ProgressEvent('error'), {status: 500, statusText: 'Server Error'});
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