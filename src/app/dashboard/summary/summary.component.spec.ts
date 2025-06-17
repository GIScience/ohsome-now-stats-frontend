import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import {SummaryComponent} from './summary.component';
import {DataService} from '../../data.service';
import {StateService} from '../../state.service';
import {IQueryParam, ISummaryData, IWrappedSummaryData, IWrappedTopicData, StatsType} from '../types';
import {Overlay} from '../../overlay.component';

describe('SummaryComponent', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;
    let mockDataService: jasmine.SpyObj<DataService>;
    let mockStateService: jasmine.SpyObj<StateService>;

    const mockSummaryData: ISummaryData = {
        changesets: 100,
        buildings: 200,
        users: 50,
        edits: 300,
        roads: 150,
        latest: '2023-01-01',
        hashtag: 'test',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
    };

    const mockWrappedSummaryData: IWrappedSummaryData = {
        result: mockSummaryData
    };

    const mockTopicData: IWrappedTopicData = {
        result: {
            amenity: {
                hashtag: 'test',
                topic: 'amenity',
                value: 10
            },
            body_of_water: {
                hashtag: 'test',
                topic: 'body_of_water',
                value: 20
            },
            commercial: {
                hashtag: 'test',
                topic: 'commercial',
                value: 20
            },
            education: {
                hashtag: 'test',
                topic: 'education',
                value: 20
            },
            financial: {
                hashtag: 'test',
                topic: 'financial',
                value: 20
            },
            healthcare: {
                hashtag: 'test',
                topic: 'healthcare',
                value: 20
            },
            lulc: {
                hashtag: 'test',
                topic: 'lulc',
                value: 20
            },
            place: {
                hashtag: 'test',
                topic: 'place',
                value: 20
            },
            poi: {
                hashtag: 'test',
                topic: 'poi',
                value: 20
            },
            social_facility: {
                hashtag: 'test',
                topic: 'social_facility',
                value: 20
            },
            wash: {
                hashtag: 'test',
                topic: 'wash',
                value: 20
            },
            waterway: {
                hashtag: 'test',
                topic: 'waterway',
                value: 20
            }
        }
    };

    const mockQueryParams: IQueryParam = {
        hashtag: 'test',
        start: '2023-01-01',
        end: '2023-01-31',
        countries: 'US',
        topics: 'amenity,body_of_water',
        interval: '',
        active_topic: 'buildings'
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
        mockDataService.requestSummary.and.returnValue(of(mockWrappedSummaryData));
        mockDataService.requestTopic.and.returnValue(of(mockTopicData));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.currentlySelected).toBe('users');
        expect(component.bignumberData).toEqual([]);
        expect(component.isSummaryLoading).toBe(false);
    });

    describe('requestFromAPI', () => {
        it('should request both summary and topic data when topics are provided', () => {
            spyOn(component, 'updateBigNumber');

            component.requestFromAPI(mockQueryParams);

            expect(mockDataService.requestSummary).toHaveBeenCalledWith(mockQueryParams);
            expect(mockDataService.requestTopic).toHaveBeenCalledWith(mockQueryParams);
            expect(component.isSummaryLoading).toBe(true);
        });

        it('should request only summary data when topics are not provided', () => {
            const queryParamsWithoutTopics = {...mockQueryParams, topics: ''};
            spyOn(component, 'updateBigNumber');

            component.requestFromAPI(queryParamsWithoutTopics);

            expect(mockDataService.requestSummary).toHaveBeenCalledWith(queryParamsWithoutTopics);
            expect(mockDataService.requestTopic).not.toHaveBeenCalled();
        });

        it('should handle error when requesting data with topics', () => {
            spyOn(console, 'error');
            mockDataService.requestSummary.and.returnValue(throwError('API Error'));

            component.requestFromAPI(mockQueryParams);

            expect(console.error).toHaveBeenCalledWith('Error while requesting data: ', 'API Error');
        });

        it('should handle error when requesting summary only', () => {
            const queryParamsWithoutTopics = {...mockQueryParams, topics: ''};
            spyOn(console, 'error');
            mockDataService.requestSummary.and.returnValue(throwError('API Error'));

            component.requestFromAPI(queryParamsWithoutTopics);

            expect(console.error).toHaveBeenCalledWith('Error while requesting Summary data ', 'API Error');
        });
    });

    describe('updateBigNumber', () => {
        beforeEach(() => {
            component['data'] = mockSummaryData;
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

        // it('should merge topic data when available', () => {
        //     component['topicData'] = {topic1: 10, topic2: 20};
        //
        //     component.updateBigNumber();
        //
        //     expect(component['data']).toEqual(jasmine.objectContaining({
        //         ...mockSummaryData,
        //         topic1: 10,
        //         topic2: 20
        //     }));
        // });
    });

    describe('formatNumbertoNumberformatString', () => {
        it('should format numbers correctly', () => {
            expect(component.formatNumbertoNumberformatString(1000)).toBe('1,000');
            expect(component.formatNumbertoNumberformatString(1000000)).toBe('1,000,000');
            expect(component.formatNumbertoNumberformatString(123.456)).toBe('123');
        });
    });

    describe('changeSelectedBigNumber', () => {
        it('should update currentlySelected and call related methods', () => {
            const mockEvent = new MouseEvent('click');
            const newStats = 'buildings';

            component.changeSelectedBigNumber(mockEvent, newStats);

            expect(component.currentlySelected).toBe(newStats);
            expect(mockStateService.updatePartialState).toHaveBeenCalledWith({
                active_topic: newStats as StatsType
            });
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

    describe('ngOnDestroy', () => {
        it('should unsubscribe from subscriptions', () => {
            spyOn(component['subscription'], 'unsubscribe');

            component.ngOnDestroy();

            expect(component['subscription'].unsubscribe).toHaveBeenCalled();
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