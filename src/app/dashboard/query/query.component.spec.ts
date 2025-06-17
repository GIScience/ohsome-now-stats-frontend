import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {QueryComponent} from './query.component';
import {DataService} from '../../data.service';
import {ToastService} from 'src/app/toast.service';
import {StateService} from '../../state.service';
import {of} from 'rxjs';
import {UTCToLocalConverterPipe} from './pipes/utc-to-local-converter.pipe';
import {ActivatedRoute} from '@angular/router';
import {NO_ERRORS_SCHEMA, signal} from '@angular/core';
import dayjs from 'dayjs';
import {IHashtags, IStateParams} from '../types';
import {AutoCompleteCompleteEvent} from 'primeng/autocomplete';

describe('QueryComponent', () => {
    let component: QueryComponent;
    let fixture: ComponentFixture<QueryComponent>;
    let mockDataService: any;
    let mockToastService: any;
    let mockStateService: any;
    let mockActivatedRoute: any;
    let mockUTCConverter: any;

    const mockMetaData = {
        min_timestamp: '2020-01-01T00:00:00Z',
        max_timestamp: '2024-12-31T23:59:59Z'
    };

    const mockHashtags: IHashtags[] = [
        {hashtag: 'missingmaps', count: 100},
        {hashtag: 'hotosm-project-123', count: 50},
        {hashtag: 'mapathon', count: 25},
        {hashtag: 'hotosm-project-456', count: 75}
    ];

    const mockAppState: IStateParams = {
        countries: 'USA,CAN',
        hashtag: 'missingmaps',
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
        interval: 'P1M',
        topics: 'road,building',
        active_topic: 'road'
    };

    beforeEach(async () => {
        mockDataService = {
            metaData: signal(mockMetaData),
            requestAllHashtags: jasmine.createSpy('requestAllHashtags').and.returnValue(of(mockHashtags)),
            toggleLiveMode: jasmine.createSpy('toggleLiveMode'),
            timeIntervals: [
                {label: '1 Day', value: 'P1D'},
                {label: '1 Month', value: 'P1M'},
                {label: '5 Minutes', value: 'PT5M'}
            ],
            defaultIntervalValue: 'P1M'
        };

        mockToastService = {
            show: jasmine.createSpy('show')
        };

        mockStateService = {
            appState: signal(mockAppState),
            updatePartialState: jasmine.createSpy('updatePartialState')
        };

        mockUTCConverter = {
            transform: jasmine.createSpy('transform').and.returnValue('2024-06-10 15:30:00')
        };

        mockActivatedRoute = {
            snapshot: {
                url: []
            }
        };

        await TestBed.configureTestingModule({
            declarations: [QueryComponent],
            imports: [FormsModule],
            providers: [
                {provide: DataService, useValue: mockDataService},
                {provide: ToastService, useValue: mockToastService},
                {provide: StateService, useValue: mockStateService},
                {provide: UTCToLocalConverterPipe, useValue: mockUTCConverter},
                {provide: ActivatedRoute, useValue: mockActivatedRoute}
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(QueryComponent);
        component = fixture.componentInstance;
    });

    it('should create QueryComponent', () => {
        expect(component).toBeTruthy();
    });

    describe('Component Initialization', () => {
        it('should initialize with default values', () => {
            expect(component.hashtag).toBe('');
            expect(component.interval).toBe(undefined);
            expect(component.liveMode).toBe(false);
            expect(component.hot_controls).toBe(false);
            expect(component.selectedCountries).toEqual([]);
            expect(component.selectedTopics).toEqual([]);
        });

        it('should set intervals from DataService', () => {
            fixture.detectChanges();
            expect(component.intervals).toEqual(mockDataService.timeIntervals);
        });

        it('should compute min and max dates correctly', () => {
            fixture.detectChanges();
            const minDate = component.minDate();
            const maxDate = component.maxDate();

            expect(minDate.isValid()).toBe(true);
            expect(maxDate.isValid()).toBe(true);
            expect(minDate.isBefore(maxDate)).toBe(true);
        });

        it('should compute date ranges correctly', () => {
            fixture.detectChanges();
            const ranges = component.ranges();

            expect(ranges['Today']).toBeDefined();
            expect(ranges['Yesterday']).toBeDefined();
            expect(ranges['Last 3 Hours']).toBeDefined();
            expect(ranges['Last 7 Days']).toBeDefined();
            expect(ranges['Last 30 Days']).toBeDefined();
            expect(ranges['Last Year']).toBeDefined();
            expect(ranges['Entire Duration']).toBeDefined();
        });
    });

    describe('ngOnInit', () => {
        it('should initialize hashtags', () => {
            spyOn(component, 'enableTooltips');
            component.ngOnInit();

            expect(mockDataService.requestAllHashtags).toHaveBeenCalled();
            expect(component.allHashtagOptions).toEqual(mockHashtags);
        });

        it('should enable HOT controls when on hotosm route', () => {
            mockActivatedRoute.snapshot.url = [
                {path: 'dashboard'},
                {path: 'hotosm'}
            ];
            spyOn(component, 'enableTooltips');
            spyOn(component, 'updateStateToFromSelection');

            component.ngOnInit();

            expect(component.hot_controls).toBe(true);
            expect(component.selectedHashtagOption.hashtag).toBe('hotosm-project-*');
            expect(component.updateStateToFromSelection).toHaveBeenCalled();
        });

        it('should not enable HOT controls for regular routes', () => {
            mockActivatedRoute.snapshot.url = [{path: 'dashboard'}];
            spyOn(component, 'enableTooltips');

            component.ngOnInit();

            expect(component.hot_controls).toBe(false);
        });
    });

    describe('buildTopicOptions', () => {
        it('should build topic options excluding specific keys', () => {
            component.buildTopicOptions();

            expect(component.topicOptions.length).toBeGreaterThan(0);

            // Check that excluded topics are not present
            const excludedTopics = component.topicOptions.filter(option =>
                ['roads', 'buildings', 'edits', 'users'].includes(option.value)
            );
            expect(excludedTopics.length).toBe(0);
        });
    });

    describe('Form Validation', () => {
        let getElementByIdSpy: jasmine.Spy;
        beforeEach(() => {
            // Mock getElementById to return a valid input element
            getElementByIdSpy = spyOn(document, 'getElementById');
        });

        afterEach(() => {
            // Reset the spy after each test
            getElementByIdSpy.calls.reset();
        });


        it('should fail validation when date range input is empty', () => {
            const result = component.validateForm();

            expect(result).toBe(false);
            expect(mockToastService.show).toHaveBeenCalledWith({
                title: 'Date range is empty',
                body: 'Please provide a valid Date range',
                type: 'error',
                time: 5000
            });
        });

        it('should fail validation when selectedDateRangeUTC is undefined', () => {
            component.selectedDateRangeUTC = undefined;

            const result = component.validateForm();
            expect(result).toBe(false);
        });

        it('should fail validation when start or end date is missing', () => {
            component.selectedDateRangeUTC = {
                start: dayjs('2024-01-01'),
                end: undefined as any
            };

            const result = component.validateForm();

            expect(result).toBe(false);
        });
    });

    describe('getStatistics', () => {
        beforeEach(() => {
            component.selectedDateRangeUTC = {
                start: dayjs('2024-01-01'),
                end: dayjs('2024-12-31')
            };
            component.selectedHashtagOption = {hashtag: 'missingmaps', highlighted: ''};
            component.selectedCountries = [];
            component.selectedTopics = [];
            component.dropdownOptions = [
                {name: 'United States', value: 'USA'},
                {name: 'Canada', value: 'CAN'}
            ];
        });

        it('should not proceed if validation fails', () => {
            spyOn(component, 'validateForm').and.returnValue(false);

            component.updateStateToFromSelection();

            expect(mockStateService.updatePartialState).not.toHaveBeenCalled();
        });

        it('should update state with form values when validation passes', () => {
            spyOn(component, 'validateForm').and.returnValue(true);
            spyOn(component, 'cleanHashTag').and.returnValue('missingmaps');
            component.interval = "P1M"
            component.updateStateToFromSelection();

            expect(mockStateService.updatePartialState).toHaveBeenCalledWith(jasmine.objectContaining({
                hashtag: 'missingmaps',
                interval: 'P1M'
            }));
        });

        it('should handle all countries selection', () => {
            spyOn(component, 'validateForm').and.returnValue(true);
            spyOn(component, 'cleanHashTag').and.returnValue('test');

            component.selectedCountries = component.dropdownOptions;

            component.updateStateToFromSelection();

            expect(component.countries).toEqual(['']);
        });

        it('should handle live mode date adjustment', fakeAsync(() => {
            spyOn(component, 'validateForm').and.returnValue(true);
            spyOn(component, 'cleanHashTag').and.returnValue('test');
            component.liveMode = true;

            component.updateStateToFromSelection();
            tick(2000);

            expect(component.selectedDateRangeUTC?.start.diff(component.maxDate(), 'hours')).toBe(-3);
        }));
    });

    describe('cleanHashTag', () => {
        it('should clean hashtag string correctly', () => {
            const testCases = [
                {input: '#missingmaps', expected: 'missingmaps'},
                {input: 'hotosm-project-123', expected: 'hotosm-project-123'},
                {input: '  #test  ', expected: 'test'}
            ];

            testCases.forEach(testCase => {
                const result = component.cleanHashTag(testCase.input);
                expect(decodeURIComponent(result)).toBe(testCase.expected);
            });
        });

        it('should clean hashtag object correctly', () => {
            const hashtagObj = {hashtag: '#test-hashtag', highlighted: ''};
            const result = component.cleanHashTag(hashtagObj);
            expect(decodeURIComponent(result)).toBe('test-hashtag');
        });
    });

    describe('Hub Selection', () => {
        beforeEach(() => {
            component.dropdownOptions = [
                {name: 'Afghanistan', value: 'AFG'},
                {name: 'Bangladesh', value: 'BGD'},
                {name: 'Brunei', value: 'BRN'},
                {name: 'United States', value: 'USA'}
            ];
        });

        it('should select countries for asia-pacific hub', () => {
            component.changeHub('asia-pacific');

            expect(component.selectedHub).toBe('asia-pacific');
            expect(component.selectedCountries.length).toBeGreaterThan(0);
            expect(component.selectedCountries.some(c => c.value === 'AFG')).toBe(true);
            expect(component.selectedCountries.some(c => c.value === 'BGD')).toBe(true);
        });

        it('should select countries for other hubs', () => {
            const hubs = ['la-carribean', 'wna', 'esa'];

            hubs.forEach(hub => {
                component.changeHub(hub);
                expect(component.selectedHub).toBe(hub);
                expect(Array.isArray(component.selectedCountries)).toBe(true);
            });
        });
    });

    describe('Impact Area Selection', () => {
        beforeEach(() => {
            component.topicOptions = [
                {name: 'Water & Sanitation', value: 'wash'},
                {name: 'Waterways', value: 'waterway'},
                {name: 'Social Facilities', value: 'social_facility'},
                {name: 'Places', value: 'place'},
                {name: 'Land Use', value: 'lulc'}
            ];
        });

        it('should select topics for disaster impact area', () => {
            component.changeImpactArea('disaster');

            expect(component.selectedImpactArea).toBe('disaster');
            expect(component.selectedTopics.length).toBeGreaterThan(0);
            expect(component.selectedTopics.some(t => t.value === 'wash')).toBe(true);
        });

        it('should select topics for all impact areas', () => {
            const impactAreas = ['disaster', 'sus_cities', 'pub_health', 'migration', 'g_equality'];

            impactAreas.forEach(area => {
                component.changeImpactArea(area);
                expect(component.selectedImpactArea).toBe(area);
                expect(Array.isArray(component.selectedTopics)).toBe(true);
            });
        });
    });

    describe('Hashtag Search', () => {
        beforeEach(() => {
            component.allHashtagOptions = mockHashtags;
        });

        it('should filter hashtags based on search query', () => {
            const event: AutoCompleteCompleteEvent = {query: 'missing'} as any;

            component.searchChange(event);

            expect(component.filteredHashtagOptions.length).toBe(1);
            expect(component.filteredHashtagOptions[0].hashtag).toBe('missingmaps');
            expect(component.filteredHashtagOptions[0].highlighted).toContain('<b>missing</b>');
        });

        it('should sort results with exact matches first', () => {
            const event: AutoCompleteCompleteEvent = {query: 'hotosm'} as any;

            component.searchChange(event);

            expect(component.filteredHashtagOptions.length).toBe(2);
            // Results should be sorted by count for items starting with the query
            expect(component.filteredHashtagOptions[0].hashtag).toBe('hotosm-project-456'); // higher count
        });

        it('should limit results to 100 items', () => {
            // Create more than 100 matching hashtags
            const manyHashtags = Array.from({length: 150}, (_, i) => ({
                hashtag: `test${i}`,
                count: i
            }));
            component.allHashtagOptions = manyHashtags;

            const event: AutoCompleteCompleteEvent = {query: 'test'} as any;
            component.searchChange(event);

            expect(component.filteredHashtagOptions.length).toBe(100);
        });
    });

    describe('Interval Validation', () => {
        it('should allow interval when date range is within limits', () => {
            component.selectedDateRangeUTC = {
                start: dayjs('2024-01-01'),
                end: dayjs('2024-01-02') // 1 day difference
            };

            const result = component.isForbiddenInterval('P1D');
            expect(result).toBe(false);
        });
    });

    describe('Date Updates', () => {
        it('should handle manual date updates', () => {
            const mockEvent = {
                startDate: dayjs('2024-01-01'),
                endDate: dayjs('2024-12-31'),
                target: {}
            };
            spyOn(component, 'validateForm').and.returnValue(true);
            spyOn(component, 'onDateRangeChange');

            component.dateUpdated(mockEvent as any);

            expect(component.selectedDateRangeUTC?.start.format('YYYY-MM-DD')).toBe('2024-01-01');
            expect(component.selectedDateRangeUTC?.end.format('YYYY-MM-DD')).toBe('2024-12-31');
            expect(component.onDateRangeChange).toHaveBeenCalled();
        });

        it('should not update dates if event is null', () => {
            component.dateUpdated(null);
            // Should not throw error
            expect(component.selectedDateRangeUTC).toBeUndefined();
        });

        it('should not update dates if validation fails', () => {
            const mockEvent = {
                startDate: dayjs('2024-01-01'),
                endDate: dayjs('2024-12-31'),
                target: {}
            };
            spyOn(component, 'validateForm').and.returnValue(false);

            component.dateUpdated(mockEvent as any);

            expect(component.selectedDateRangeUTC).toBeUndefined();
        });
    });

    describe('Live Mode', () => {
        beforeEach(() => {
            component.selectedDateRangeUTC = {
                start: dayjs().subtract(2, 'hours'),
                end: dayjs()
            };
            component.interval = 'PT5M';
        });

        it('should enable live mode button when conditions are met', () => {
            const canEnable = component.enableLiveModeButton();
            expect(canEnable).toBe(true);
        });

        it('should not enable live mode button when interval is not PT5M', () => {
            component.interval = 'P1D';

            const canEnable = component.enableLiveModeButton();
            expect(canEnable).toBe(false);
        });

        it('should toggle live mode on', fakeAsync(() => {
            spyOn(component, 'updateStateToFromSelection');

            component.toggleLiveMode();

            expect(component.liveMode).toBe(true);
            expect(component.updateStateToFromSelection).toHaveBeenCalled();
            expect(mockDataService.toggleLiveMode).toHaveBeenCalledWith(true);
        }));

        it('should toggle live mode off', () => {
            component.liveMode = true;
            spyOn(component, 'turnOffLiveMode');

            component.toggleLiveMode();

            expect(component.turnOffLiveMode).toHaveBeenCalled();
        });

        it('should turn off live mode completely', () => {
            component.liveMode = true;
            component.refreshIntervalId = 123;
            spyOn(window, 'clearInterval');

            component.turnOffLiveMode();

            expect(component.liveMode).toBe(false);
            expect(mockDataService.toggleLiveMode).toHaveBeenCalledWith(false);
            expect(clearInterval).toHaveBeenCalledWith(123);
        });
    });

    describe('Date Range Changes', () => {
        it('should handle date range changes and update state', () => {
            const dateRange = {
                start: dayjs('2024-01-01'),
                end: dayjs('2024-12-31')
            };

            component.onDateRangeChange(dateRange);

            expect(mockStateService.updatePartialState).toHaveBeenCalledWith({
                start: '2024-01-01T00:00:00Z',
                end: '2024-12-31T00:00:00Z'
            });
        });

        it('should not update state if dates are missing', () => {
            const dateRange = {
                start: null,
                end: dayjs('2024-12-31')
            };

            component.onDateRangeChange(dateRange as any);

            expect(mockStateService.updatePartialState).not.toHaveBeenCalled();
        });
    });

    describe('State Updates', () => {
        it('should update form from state correctly', () => {
            const inputData: IStateParams = {
                start: '2024-01-01T00:00:00Z',
                end: '2024-12-31T23:59:59Z',
                hashtag: 'test%20hashtag',
                interval: 'P1W',
                countries: 'USA,CAN',
                topics: 'roads,buildings',
                active_topic: 'road'
            };

            component.dropdownOptions = [
                {name: 'United States', value: 'USA'},
                {name: 'Canada', value: 'CAN'}
            ];
            component.topicOptions = [
                {name: 'Roads', value: 'roads'},
                {name: 'Buildings', value: 'buildings'}
            ];

            // Call the private method through type assertion and fixture detection
            fixture.detectChanges();

            // Simulate state change by updating the signal
            mockStateService.appState.set(inputData);
            fixture.detectChanges();

            expect(component.hashtag).toBe('test hashtag');
            expect(component.interval).toBe('P1W');
        });
    });

    describe('Component Cleanup', () => {
        it('should cleanup on destroy', () => {
            spyOn(component, 'turnOffLiveMode');
            component['subscription'] = jasmine.createSpyObj('Subscription', ['unsubscribe']);

            component.ngOnDestroy();

            expect(component['subscription'].unsubscribe).toHaveBeenCalled();
            expect(component.turnOffLiveMode).toHaveBeenCalled();
        });
    });
});