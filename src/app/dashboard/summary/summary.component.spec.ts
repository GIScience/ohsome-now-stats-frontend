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
    let mockDataService: jasmine.SpyObj<DataService>;
    let mockStateService: jasmine.SpyObj<StateService>;

    const mockTopicData: IWrappedStatsResult = {
        result:
            {
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
        const dataServiceSpy = jasmine.createSpyObj('DataService', ['requestSummary', 'requestTopic']);
        const stateServiceSpy = jasmine.createSpyObj('StateService', ['appState', 'updatePartialState']);

        await TestBed.configureTestingModule({
            declarations: [SummaryComponent, Overlay],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;

        // Setup default mock returns
        mockStateService.appState.and.returnValue(mockQueryParams);
        mockDataService.requestSummary.and.returnValue(of(mockTopicData));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.currentlySelected).toBe('contributor');
        expect(component.bignumberData).toEqual([]);
        expect(component.isSummaryLoading).toBe(false);
    });

    describe('requestFromAPI', () => {
        it('should request both summary and topic data when topics are provided', () => {
            spyOn(component, 'updateBigNumber');

            component.requestFromAPI(mockQueryParams);

            expect(mockDataService.requestSummary).toHaveBeenCalledWith(mockQueryParams);
            expect(component.isSummaryLoading).toBe(true);
        });

        it('should request only summary data when topics are not provided', () => {
            const queryParamsWithoutTopics = {...mockQueryParams, topics: ''};
            spyOn(component, 'updateBigNumber');

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
            spyOn(component, 'changeSelectedSummaryComponent');

            component.changeSelectedBigNumber(mockEvent, newStats);

            expect(component.currentlySelected).toBe(newStats);
            expect(component.changeSelectedSummaryComponent).toHaveBeenCalledWith(mockEvent);
            expect(mockStateService.updatePartialState).toHaveBeenCalledWith({
                active_topic: newStats as StatsType
            });
        });
    });

    describe('changeSelectedSummaryComponent', () => {
        let mockElement: HTMLElement;
        let mockParent: HTMLElement;
        let mockGrandParent: HTMLElement;

        beforeEach(() => {
            mockElement = document.createElement('div');
            mockParent = document.createElement('div');
            mockGrandParent = document.createElement('div');

            mockElement.className = 'big_number';
            mockParent.appendChild(mockElement);
            mockGrandParent.appendChild(mockParent);

            document.body.appendChild(mockGrandParent);
        });

        afterEach(() => {
            document.body.removeChild(mockGrandParent);
        });

        it('should return early if target is not found', () => {
            const mockEvent = {
                target: null
            } as any;

            expect(() => component.changeSelectedSummaryComponent(mockEvent)).not.toThrow();
        });
    });

    describe('enableTooltips', () => {
        it('should initialize bootstrap tooltips', () => {
            // Mock bootstrap tooltip elements
            const mockTooltipElement = document.createElement('div');
            mockTooltipElement.setAttribute('data-bs-toggle', 'tooltip');
            document.body.appendChild(mockTooltipElement);

            spyOn(document, 'querySelectorAll').and.returnValue([mockTooltipElement] as any);

            expect(() => component.enableTooltips()).not.toThrow();

            document.body.removeChild(mockTooltipElement);
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