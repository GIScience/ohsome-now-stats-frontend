import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DataService } from '../data.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import {Component, EventEmitter, Input, Output} from "@angular/core";

dayjs.extend(duration);

// Mock child components
@Component({
    selector: 'app-query',
    template: '<div></div>'
})
class MockQueryComponent {
    @Input() data: any;
    @Output() dateRangeEmitter = new EventEmitter<any>();
}

@Component({
    selector: 'app-trending-hashtags',
    template: '<div></div>'
})
class MockTrendingHashtagsComponent {
    @Input() data: any;
    @Output() dateRangeEmitter = new EventEmitter<any>();
}

@Component({
    selector: 'app-export-data',
    template: '<div></div>'
})
class MockExportDataComponent {
    @Input() data: any;
    @Output() dateRangeEmitter = new EventEmitter<any>();
}

@Component({
    selector: 'app-summary',
    template: '<div></div>'
})
class MockSummaryComponent {
    @Input() data: any;
    @Output() dateRangeEmitter = new EventEmitter<any>();
}

@Component({
    selector: 'app-plot',
    template: '<div></div>'
})
class MockPlotComponent {
    @Input() data: any;
    @Output() dateRangeEmitter = new EventEmitter<any>();
}

@Component({
    selector: 'app-map',
    template: '<div></div>'
})
class MockMapComponent {
    @Input() data: any;
    @Output() dateRangeEmitter = new EventEmitter<any>();
}

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let route: ActivatedRoute;

    // Mock data
    const mockSummaryData = {
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

    const mockPlotData = {
        changesets: [1, 2, 3],
        buildings: [4, 5, 6],
        users: [7, 8, 9],
        edits: [10, 11, 12],
        roads: [13, 14, 15],
        timestamp: ['2023-01-01', '2023-01-02', '2023-01-03']
    };

    const mockCountryData = [{
        country: 'US',
        changesets: 10,
        buildings: 20,
        users: 5,
        edits: 30,
        roads: 15
    }];

    const mockHashtagsData = [{ hashtag: 'test1' }, { hashtag: 'test2' }];

    // Update the DataService spy creation and typing
    let dataService: jasmine.SpyObj<DataService>;

    beforeEach(() => {
        // Create spy object with proper typing
        const dataServiceSpy = jasmine.createSpyObj<DataService>('DataService', [
            'getQueryParamsFromFragments',
            'updateURL',
            'requestSummary',
            'requestPlot',
            'requestCountryStats',
            'getTrendingHashtags',
            'requestTopic',
            'requestTopicInterval',
            'requestTopicCountryStats',
            'setSummary',
            'getSummary',
            'getDefaultValues',
            'getAbortHashtagReqSubject'
        ], {
            // Properties that need to be mocked
            abortIntervalReqSub: new Subject(),
            abortSummaryReqSub: new Subject(),
            abortHashtagReqSub: new Subject(),
            defaultHashtag: 'missingmaps',
            defaultIntervalValue: 'P1D',
            trendingHashtagLimit: 10
        });

        TestBed.configureTestingModule({
            imports: [MockQueryComponent, MockTrendingHashtagsComponent, MockExportDataComponent, MockSummaryComponent, MockPlotComponent, MockMapComponent],
            declarations: [DashboardComponent],
            providers: [
                { provide: DataService, useValue: dataServiceSpy },
                { provide: ActivatedRoute, useValue: { fragment: new Subject<string | null>() } },
            ]
        });

        // Setup mock return values
        dataServiceSpy.getQueryParamsFromFragments.and.returnValue(null);
        dataServiceSpy.requestSummary.and.returnValue(of({ result: mockSummaryData }));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        dataServiceSpy.requestPlot.and.returnValue(of({ result: mockPlotData }));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        dataServiceSpy.requestCountryStats.and.returnValue(of({ result: mockCountryData }));
        dataServiceSpy.getTrendingHashtags.and.returnValue(of({ result: mockHashtagsData }));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        dataServiceSpy.requestTopic.and.returnValue(of({ result: {} }));
        dataServiceSpy.requestTopicInterval.and.returnValue(of({ result: {} }));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        dataServiceSpy.requestTopicCountryStats.and.returnValue(of({ result: {} }));
        dataServiceSpy.getSummary.and.returnValue(null);
        dataServiceSpy.getDefaultValues.and.returnValue({
            hashtag: 'missingmaps',
            interval: 'P1D',
            start: '2023-01-01',
            end: '2023-01-31',
            countries: '',
            topics: ''
        });
        // dataServiceSpy.getAbortHashtagReqSubject.and.returnValue(new Subject());

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        route = TestBed.inject(ActivatedRoute) as any;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.summaryData).toBeUndefined();
        expect(component.plotData).toBeUndefined();
        expect(component.countryWithTopic).toEqual([]);
        expect(component.hashtagsData).toBeUndefined();
        expect(component.isSummaryLoading).toBe(false);
        expect(component.isPlotsLoading).toBe(false);
        expect(component.isCountriesLoading).toBe(false);
        expect(component.isHashtagsLoading).toBe(false);
    });

    it('should handle fragment changes with complete query params', fakeAsync(() => {
        const mockParams = {
            start: '2023-01-01',
            end: '2023-01-31',
            interval: 'P1D',
            hashtag: 'test',
            countries: 'US',
            topics: 'health'
        };

        dataService.getQueryParamsFromFragments.and.returnValue(mockParams);

        component.ngOnInit();
        (route.fragment as Subject<string | null>).next('test-fragment');
        tick();

        expect(component.queryParams).toEqual(mockParams);
        expect(component.summaryMessage).toContain('Summarized statistics of contributions with #test');
        expect(component.isSummaryLoading).toBe(false);
        expect(component.isPlotsLoading).toBe(false);
        expect(component.isCountriesLoading).toBe(false);
        expect(component.isHashtagsLoading).toBe(false);
    }));

    // it('should handle fragment changes with incomplete query params', fakeAsync(() => {
    //     const mockParams = null // { hashtag: 'test' };
    //     const defaultParams = dataService.getDefaultValues();
    //     if(! defaultParams) return;
    //
    //     dataService.getQueryParamsFromFragments.and.returnValue(mockParams);
    //
    //     component.ngOnInit();
    //     (route.fragment as Subject<string | null>).next('test-fragment');
    //     tick();
    //
    //     expect(dataService.updateURL).toHaveBeenCalledWith({
    //         hashtag: 'test',
    //         interval: defaultParams.interval,
    //         start: '2009-04-21T22:02:04Z',
    //         end: defaultParams.end,
    //         countries: defaultParams.countries,
    //         topics: defaultParams.topics
    //     });
    // }));

    it('should handle "*" hashtag parameter', fakeAsync(() => {
        const mockParams = {
            start: '2023-01-01',
            end: '2023-01-31',
            interval: 'P1D',
            hashtag: '*',
            countries: 'US',
            topics: 'health'
        };

        dataService.getQueryParamsFromFragments.and.returnValue(mockParams);

        component.ngOnInit();
        (route.fragment as Subject<string | null>).next('test-fragment');
        tick();

        expect(component.queryParams.hashtag).toBe('missingmaps');
    }));

    it('should handle invalid interval parameter', fakeAsync(() => {
        const mockParams = {
            start: '2020-01-01',
            end: '2023-01-31', // 3 year range
            interval: 'PT1M', // 1 minute - would create too many bins
            hashtag: 'test',
            countries: 'US',
            topics: 'health'
        };

        dataService.getQueryParamsFromFragments.and.returnValue(mockParams);

        component.ngOnInit();
        (route.fragment as Subject<string | null>).next('test-fragment');
        tick();

        expect(component.queryParams.interval).toBe('P1D'); // Should default to daily for >366 days
    }));

    it('should form correct summary message', () => {
        const queryParams = {
            hashtag: 'test',
            start: '2023-01-01',
            end: '2023-01-31'
        };

        const message = component.formSummaryMessage(queryParams as any);
        expect(message).toBe('Summarized statistics of contributions with #test from 2023-01-01 till 2023-01-31');
    });

    // it('should add topic data to plot', () => {
    //     const topicData = {
    //         health: { value: [1, 2, 3] },
    //         education: { value: [4, 5, 6] }
    //     };
    //     const plotData = {
    //         changesets: [1, 2, 3],
    //         timestamp: ['2023-01-01', '2023-01-02', '2023-01-03']
    //     };
    //
    //     const result = component.addTopicDataToPlot(topicData as any, plotData as any);
    //     expect(result['health']).toEqual([1, 2, 3]);
    //     expect(result['education']).toEqual([4, 5, 6]);
    // });

    // it('should unsubscribe on destroy', () => {
    //     spyOn(component, 'stopHashtagReq').and.callThrough();
    //     spyOn(component, 'stopSummaryReq').and.callThrough();
    //     spyOn(component, 'stopIntervalReq').and.callThrough();
    //
    //     component.ngOnDestroy();
    //
    //     expect(component.stopHashtagReq).toHaveBeenCalled();
    //     expect(component.stopSummaryReq).toHaveBeenCalled();
    //     expect(component.stopIntervalReq).toHaveBeenCalled();
    // });
});