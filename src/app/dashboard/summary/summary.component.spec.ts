import {type MockedObject, vi} from "vitest";
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {SummaryComponent} from './summary.component';
import {DataService} from '../../data.service';
import {StateService} from '../../state.service';
import {IStateParams, IWrappedStatsResult, StatsType} from '../types';
import {Overlay} from '../../overlay.component';

describe('SummaryComponent', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;
    let mockDataService: MockedObject<DataService>;
    let mockStateService: MockedObject<StateService>;

    const mockTopicData: IWrappedStatsResult = {
        result: {
            topics: {
                amenity: {
                    value: 10
                },
                body_of_water: {
                    value: 20
                },
                commercial: {
                    value: 20
                },
                education: {
                    value: 20
                },
                financial: {
                    value: 20
                },
                healthcare: {
                    value: 20
                },
                lulc: {
                    value: 20
                },
                place: {
                    value: 20
                },
                poi: {
                    value: 20
                },
                power: {value: 20},
                social_facility: {
                    value: 20
                },
                wash: {
                    value: 20
                },
                waterway: {
                    value: 20
                },
                contributor: {
                    value: 20
                },
                edit: {
                    value: 20
                },
                building: {
                    value: 20
                },
                road: {
                    value: 20
                }
            }
        }
    };

    const mockQueryParams: IStateParams = {
        hashtag: 'test',
        start: '2023-01-01',
        end: '2023-01-31',
        countries: 'US',
        topics: 'amenity,body_of_water',
        interval: '',
        active_topic: 'building'
    };

    beforeEach(async () => {
        const dataServiceSpy = {
            requestSummary: vi.fn().mockName("DataService.requestSummary"),
            requestTopic: vi.fn().mockName("DataService.requestTopic")
        };
        const stateServiceSpy = {
            appState: vi.fn().mockName("StateService.appState"),
            updatePartialState: vi.fn().mockName("StateService.updatePartialState")
        };

        await TestBed.configureTestingModule({
            imports: [Overlay, SummaryComponent],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        mockDataService = TestBed.inject(DataService) as MockedObject<DataService>;
        mockStateService = TestBed.inject(StateService) as MockedObject<StateService>;

        // Setup default mock returns
        mockStateService.appState.mockReturnValue(mockQueryParams);
        mockDataService.requestSummary.mockReturnValue(of(mockTopicData));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.bignumberData).toEqual([]);
        expect(component.isSummaryLoading).toBe(false);
    });

    describe('requestFromAPI', () => {
        it('should request both summary and topic data when topics are provided', () => {
            vi.spyOn(component, 'updateBigNumber');

            component.requestFromAPI(mockQueryParams);

            expect(mockDataService.requestSummary).toHaveBeenCalledWith(mockQueryParams);
            expect(component.isSummaryLoading).toBe(true);
        });

        it('should request only summary data when topics are not provided', () => {
            const queryParamsWithoutTopics = {...mockQueryParams, topics: ''};
            vi.spyOn(component, 'updateBigNumber');

            component.requestFromAPI(queryParamsWithoutTopics);

            expect(mockDataService.requestSummary).toHaveBeenCalledWith(queryParamsWithoutTopics);
        });
    });

    describe('updateBigNumber', () => {
        beforeEach(() => {
            component['data'] = mockTopicData.result.topics;
        });

        it('should return early if data is not available', () => {
            component['data'] = undefined as any;
            const initialBignumberData = component.bignumberData;

            component.updateBigNumber();

            expect(component.bignumberData).toBe(initialBignumberData);
        });

        it('should update bignumberData with summary data', () => {
            component.updateBigNumber();

            expect(component.bignumberData.length).toBeGreaterThan(0);
            expect(component.isSummaryLoading).toBe(false);
        });
    });

    describe('changeSelectedBigNumber', () => {
        it('should update currentlySelected and call related methods', () => {
            const mockEvent = new MouseEvent('click');
            const newStats = 'buildings';

            component.changeSelectedBigNumber(mockEvent, newStats);

            expect(mockStateService.updatePartialState).toHaveBeenCalledWith({
                active_topic: newStats as StatsType
            });
        });
    });


    describe('computed properties', () => {
        it('should create state computed property', () => {
            expect(component.state).toBeDefined();
        });

        it('should create relevantState computed property with custom equality', () => {
            expect(component['relevantState']).toBeDefined();
        });
    });
});
