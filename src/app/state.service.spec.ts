import {type MockedObject, vi} from "vitest";
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';

import {StateService} from './state.service';
import {DataService} from './data.service';
import {IStateParams, StatsType} from './dashboard/types';

describe('StateService', () => {
    let service: StateService;
    let mockRouter: MockedObject<Router>;
    let mockDataService: MockedObject<DataService>;

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
        const routerSpy = {
            navigate: vi.fn().mockName("Router.navigate")
        };
        const dataServiceSpy = {
            metaData: vi.fn().mockName("DataService.metaData")
        };
        window.onbeforeunload = () => 'Oh no!';
        dataServiceSpy.metaData.mockReturnValue(mockMetaData);
        TestBed.configureTestingModule({
            providers: [
                StateService,
                {provide: Router, useValue: routerSpy},
                {provide: DataService, useValue: dataServiceSpy},
            ]
        });

        service = TestBed.inject(StateService);
        mockRouter = TestBed.inject(Router) as MockedObject<Router>;
        mockDataService = TestBed.inject(DataService) as MockedObject<DataService>;
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
            // Get the service through TestBed to maintain injection context
            const serviceWithFragment = TestBed.inject(StateService);
            // @ts-ignore
            serviceWithFragment.window = {location: {href: 'stats.now.ohsome.org/dashboard#hashtag=test&start=2023-06-01T00:00:00Z&end=2023-12-01T00:00:00Z&interval=P1D&active_topic=building&countries=DE&topics=building'}};
            serviceWithFragment.updatePartialState(serviceWithFragment.initInitialState());

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
            mockRouter.navigate.mockClear();

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
                fragment: expect.stringContaining('hashtag=test-hashtag')
            });
        });

        it('should include fit_to_content in URL when defined', () => {
            // service.updatePartialState({ fit_to_content: 'true' });
            mockRouter.navigate.mockClear();

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
                fragment: expect.stringContaining('fit_to_content=')
            });
        });
    });

    describe('getQueryParamsFromFragments', () => {
        it('should return null when no fragment exists', () => {
            // @ts-ignore
            service.window = {location: {href: ''}};
            const result = service.getQueryParamsFromFragments();

            expect(result).toBeNull();
        });


        it('should parse fragment into URLSearchParams', () => {
            // @ts-ignore
            service.window = {location: {href: 'stats.now.ohsome.org/dashboard#hashtag=test&start=2023-06-01T00:00:00Z&end=2023-12-01T00:00:00Z&interval=P1D&active_topic=building&countries=DE&topics=building'}};

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
