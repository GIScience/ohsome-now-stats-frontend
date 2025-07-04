import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';

import {StateService} from './state.service';
import {DataService} from './data.service';
import {IStateParams, StatsType} from './dashboard/types';

describe('StateService', () => {
    let service: StateService;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: { snapshot: { fragment: string | null }; };
    let mockDataService: jasmine.SpyObj<DataService>;

    const mockMetaData = {
        max_timestamp: '2024-01-01T00:00:00Z'
    };

    const defaultState: IStateParams = {
        hashtag: '',
        start: '2023-01-01T00:00:00Z',
        end: '2024-01-01T00:00:00Z',
        interval: 'P1M',
        countries: '',
        topics: '',
        fit_to_content: undefined,
        active_topic: 'contributor' as StatsType
    };

    beforeEach(() => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const dataServiceSpy = jasmine.createSpyObj('DataService', ['metaData']);

        mockActivatedRoute = {
            snapshot: {
                fragment: null
            }
        };

        dataServiceSpy.metaData.and.returnValue(mockMetaData);

        TestBed.configureTestingModule({
            providers: [
                StateService,
                {provide: Router, useValue: routerSpy},
                {provide: ActivatedRoute, useValue: mockActivatedRoute},
                {provide: DataService, useValue: dataServiceSpy}
            ]
        });

        service = TestBed.inject(StateService);
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('initialization', () => {
        it('should initialize with default state when no URL fragment', () => {
            const currentState = service.appState();
            expect(currentState.hashtag).toBe('');
            expect(currentState.interval).toBe('P1M');
            expect(currentState.active_topic).toBe('contributor');
        });

        it('should initialize from URL fragment when present', () => {
            mockActivatedRoute.snapshot.fragment = 'hashtag=test&start=2023-06-01T00:00:00Z&end=2023-12-01T00:00:00Z&interval=P1D&active_topic=building&countries=DE&topics=building';

            // Recreate the TestBed with the updated fragment
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    StateService,
                    {provide: Router, useValue: mockRouter},
                    {provide: ActivatedRoute, useValue: mockActivatedRoute},
                    {provide: DataService, useValue: mockDataService}
                ]
            });

            // Get the service through TestBed to maintain injection context
            const serviceWithFragment = TestBed.inject(StateService);

            const currentState = serviceWithFragment.appState();
            expect(currentState.hashtag).toBe('test');
            expect(currentState.start).toBe('2023-06-01T00:00:00Z');
            expect(currentState.end).toBe('2023-12-01T00:00:00Z');
            expect(currentState.interval).toBe('P1D');
            expect(currentState.active_topic).toBe('building');
            expect(currentState.countries).toBe('DE');
            expect(currentState.topics).toBe('building');
        });
    });

    describe('state updates', () => {

        it('should update partial state', () => {
            service.updatePartialState({hashtag: 'partial-update'});

            expect(service.appState().hashtag).toBe('partial-update');
            // Other properties should remain unchanged
            expect(service.appState().interval).toBe('P1M');
        });
    });

    describe('URL updates', () => {
        it('should update URL when state changes', () => {
            mockRouter.navigate.calls.reset();

            const testState: IStateParams = {
                hashtag: 'test-hashtag',
                start: '2023-01-01T00:00:00Z',
                end: '2023-12-01T00:00:00Z',
                interval: 'P1M',
                countries: 'DE',
                topics: 'buildings',
                fit_to_content: undefined,
                active_topic: 'users' as StatsType
            };

            // Access private method for testing
            (service as any).updateURL(testState);

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                fragment: jasmine.stringContaining('hashtag=test-hashtag')
            });
        });

        it('should include fit_to_content in URL when defined', () => {
            // service.updatePartialState({ fit_to_content: 'true' });
            mockRouter.navigate.calls.reset();

            const testState: IStateParams = {
                hashtag: 'test-hashtag',
                start: '2023-01-01T00:00:00Z',
                end: '2023-12-01T00:00:00Z',
                interval: 'P1M',
                countries: 'DE',
                topics: 'buildings',
                fit_to_content: 'true',
                active_topic: 'users' as StatsType
            };

            // Access private method for testing
            (service as any).updateURL(testState);

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                fragment: jasmine.stringContaining('fit_to_content=')
            });
        });
    });

    describe('getQueryParamsFromFragments', () => {
        it('should return null when no fragment exists', () => {
            mockActivatedRoute.snapshot.fragment = null;

            const result = service.getQueryParamsFromFragments();

            expect(result).toBeNull();
        });

        it('should return null when fragment is empty', () => {
            mockActivatedRoute.snapshot.fragment = '';

            const result = service.getQueryParamsFromFragments();

            expect(result).toBeNull();
        });

        it('should parse fragment into URLSearchParams', () => {
            mockActivatedRoute.snapshot.fragment = 'hashtag=test&interval=P1D';

            const result = service.getQueryParamsFromFragments();

            expect(result).toBeInstanceOf(URLSearchParams);
            expect(result?.get('hashtag')).toBe('test');
            expect(result?.get('interval')).toBe('P1D');
        });
    });

    describe('signal equality function', () => {
        it('should detect state changes correctly', () => {
            // Change hashtag - should trigger update
            service.updatePartialState({hashtag: 'new-hashtag'});
            expect(service.appState().hashtag).toBe('new-hashtag');

            // Set same values - should not trigger unnecessary updates
            service.updatePartialState(service.appState());
            expect(mockRouter.navigate).toHaveBeenCalledTimes(0);
        });
    });
});