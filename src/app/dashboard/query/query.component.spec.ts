import {type Mock, vi} from "vitest";
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {QueryComponent} from './query.component';
import {DataService} from '../../../lib/data.service';
import {ToastService} from '../../../lib/toast.service';
import {StateService} from '../../../lib/state.service';
import {of} from 'rxjs';
import {UTCToLocalConverterPipe} from './pipes/utc-to-local-converter.pipe';
import {ActivatedRoute} from '@angular/router';
import {NO_ERRORS_SCHEMA, signal} from '@angular/core';
import {IHashtags, IStateParams} from '../../../lib/types';
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
            requestAllHashtags: vi.fn().mockReturnValue(of(mockHashtags)),
            toggleLiveMode: vi.fn(),
            timeIntervals: [
                {label: '1 Day', value: 'P1D'},
                {label: '1 Month', value: 'P1M'},
                {label: '5 Minutes', value: 'PT5M'}
            ],
            defaultIntervalValue: 'P1M',
            requestMetadata: vi.fn().mockReturnValue(of(mockMetaData))
        };

        mockToastService = {
            show: vi.fn()
        };

        mockStateService = {
            appState: signal(mockAppState),
            updatePartialState: vi.fn()
        };

        mockUTCConverter = {
            transform: vi.fn().mockReturnValue('2024-06-10 15:30:00')
        };

        mockActivatedRoute = {
            snapshot: {
                url: []
            }
        };

        await TestBed.configureTestingModule({
            imports: [FormsModule, QueryComponent, UTCToLocalConverterPipe],
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
            expect(component.interval).toBe(undefined);
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
            component.ngOnInit();

            expect(mockDataService.requestAllHashtags).toHaveBeenCalled();
            expect(component.allHashtagOptions).toEqual(mockHashtags);
        });

    });

    describe('buildTopicOptions', () => {
        it('should build topic options excluding specific keys', () => {
            component.buildTopicOptions();

            expect(component.topicOptions.length).toBeGreaterThan(0);

            // Check that excluded topics are not present
            const excludedTopics = component.topicOptions.filter(option => ['roads', 'buildings', 'edits', 'users'].includes(option.value));
            expect(excludedTopics.length).toBe(0);
        });
    });

    describe('Form Validation', () => {
        let getElementByIdSpy: Mock;
        beforeEach(() => {
            // Mock getElementById to return a valid input element
            getElementByIdSpy = vi.spyOn(document, 'getElementById');
        });

        afterEach(() => {
            // Reset the spy after each test
            getElementByIdSpy.mockClear();
        });

        it('should fail validation when selectedDateRangeUTC is undefined', () => {
            component.selectedDateRange = undefined;

            const result = component.validateForm();
            expect(result).toBe(false);
        });

        it('should fail validation when start or end date is missing', () => {
            component.selectedDateRange = [
                new Date('2024-01-01'),
                undefined as any
            ];

            const result = component.validateForm();

            expect(result).toBe(false);
        });
    });

    describe('getStatistics', () => {
        beforeEach(() => {
            component.selectedDateRange = [
                new Date('2024-01-01'),
                new Date('2024-12-31')
            ];
            component.selectedHashtagOption = {hashtag: 'missingmaps', highlighted: ''};
            component.selectedCountries = [];
            component.selectedTopics = [];
            component.dropdownOptions = [
                {name: 'United States', value: 'USA'},
                {name: 'Canada', value: 'CAN'}
            ];
        });

        it('should not proceed if validation fails', () => {
            vi.spyOn(component, 'validateForm').mockReturnValue(false);

            component.updateStateFromSelection();

            expect(mockStateService.updatePartialState).not.toHaveBeenCalled();
        });

        it('should update state with form values when validation passes', () => {
            vi.spyOn(component, 'validateForm').mockReturnValue(true);
            vi.spyOn(component, 'cleanHashTag').mockReturnValue('missingmaps');
            component.interval = "P1M";
            component.updateStateFromSelection();

            expect(mockStateService.updatePartialState).toHaveBeenCalledWith(expect.objectContaining({
                hashtag: 'missingmaps',
                interval: 'P1M'
            }));
        });

        it('should handle all countries selection', () => {
            vi.spyOn(component, 'validateForm').mockReturnValue(true);
            vi.spyOn(component, 'cleanHashTag').mockReturnValue('test');

            component.selectedCountries = component.dropdownOptions;

            component.updateStateFromSelection();

            expect(component.countries).toEqual(['']);
        });
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
            component.selectedDateRange = [
                new Date('2024-01-01'),
                new Date('2024-01-02') // 1 day difference
            ];

            const result = component.isForbiddenInterval('P1D');
            expect(result).toBe(false);
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

            expect(component.interval).toBe('P1W');
        });
    });
});
