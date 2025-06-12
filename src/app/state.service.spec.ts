import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';

import {StateService} from './state.service';
import {DataService} from './data.service';
import {IQueryParam, StatsType} from './dashboard/types';

describe('StateService', () => {
    let service: StateService;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: { snapshot: { fragment: string | null }; };
    let mockDataService: jasmine.SpyObj<DataService>;

    const mockMetaData = {
        max_timestamp: '2024-01-01T00:00:00Z'
    };

    const defaultState: IQueryParam = {
        hashtag: '',
        start: '2023-01-01T00:00:00Z',
        end: '2024-01-01T00:00:00Z',
        interval: 'P1M',
        countries: '',
        topics: '',
        fit_to_content: undefined,
        active_topic: 'users' as StatsType
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
            expect(currentState.active_topic).toBe('users');
        });

        it('should initialize from URL fragment when present', () => {
            mockActivatedRoute.snapshot.fragment = 'hashtag=test&start=2023-06-01T00:00:00Z&end=2023-12-01T00:00:00Z&interval=P1D&active_topic=changesets&countries=DE&topics=buildings';

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
            expect(currentState.active_topic).toBe('changesets');
            expect(currentState.countries).toBe('DE');
            expect(currentState.topics).toBe('buildings');
        });
    });

    describe('state updates', () => {
        it('should update entire state', () => {
            const newState: IQueryParam = {
                ...defaultState,
                hashtag: 'newhashtag',
                interval: 'P1D'
            };

            service.updateState(newState);

            expect(service.appState().hashtag).toBe('newhashtag');
            expect(service.appState().interval).toBe('P1D');
        });

        it('should update partial state', () => {
            service.updatePartialState({hashtag: 'partial-update'});

            expect(service.appState().hashtag).toBe('partial-update');
            // Other properties should remain unchanged
            expect(service.appState().interval).toBe('P1M');
        });

        it('should update interval using setInterval method', () => {
            service.setInterval('P1W');

            expect(service.appState().interval).toBe('P1W');
        });
    });

    describe('URL updates', () => {
        it('should update URL when state changes', () => {
            mockRouter.navigate.calls.reset();

            const testState: IQueryParam = {
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

            const testState: IQueryParam = {
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

    describe('getCurrentState', () => {
        it('should return current state from BehaviorSubject', () => {
            const currentState = service.getCurrentState();
            expect(currentState).toBeDefined();
            expect(currentState.active_topic).toBe('users');
        });
    });

    describe('resetState', () => {
        it('should reset state to initial values', () => {
            // First change the state
            service.updatePartialState({hashtag: 'changed'});
            expect(service.appState().hashtag).toBe('changed');

            // Then reset
            service.resetState();

            // Note: resetState only updates BehaviorSubject, not the signal
            const resetState = service.getCurrentState();
            expect(resetState.hashtag).toBe('');
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
            service.updateState(service.appState());
            expect(mockRouter.navigate).toHaveBeenCalledTimes(0);
        });
    });

    describe('BehaviorSubject integration', () => {
        it('should have queryParamSubject initialized', () => {
            expect(service.queryParamSubject).toBeInstanceOf(BehaviorSubject);
            expect(service.queryParamSubject.value).toBeDefined();
        });

        it('should emit values through queryParamSubject', (done) => {
            service.queryParamSubject.subscribe(state => {
                expect(state.active_topic).toBe('users');
                done();
            });
        });
    });
});