import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QueryComponent } from './query.component';
import { DataService } from '../../data.service';
import { ToastService } from 'src/app/toast.service';
import { of } from 'rxjs';
import { UTCToLocalConverterPipe } from './pipes/utc-to-local-converter.pipe';
import { ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import dayjs from 'dayjs';

describe('QueryComponent', () => {
    let component: QueryComponent;
    let fixture: ComponentFixture<QueryComponent>;
    let mockDataService: any;
    let mockToastService: any;
    let mockActivatedRoute: any;

    beforeEach(async () => {
        mockDataService = {
            getMetaData: jasmine.createSpy('getMetaData').and.returnValue(of({
                start: '2024-01-01T00:00:00Z',
                end: '2024-12-31T23:59:59Z'
            })),
            requestAllHashtags: jasmine.createSpy('requestAllHashtags').and.returnValue(of([])),
            updateURL: jasmine.createSpy('updateURL'),
            requestMetadata: jasmine.createSpy('requestMetadata'),
            toggleLiveMode: jasmine.createSpy('toggleLiveMode'),
            timeIntervals: [
                { label: '1 Day', value: 'P1D' },
                { label: '1 Month', value: 'P1M' }
            ],
            defaultIntervalValue: 'P1M'
        };

        mockToastService = {
            show: jasmine.createSpy('show')
        };

        mockActivatedRoute = {
            snapshot: {
                url: []
            }
        };

        await TestBed.configureTestingModule({
            declarations: [QueryComponent, UTCToLocalConverterPipe],
            providers: [
                { provide: DataService, useValue: mockDataService },
                { provide: ToastService, useValue: mockToastService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                UTCToLocalConverterPipe
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(QueryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create QueryComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should load metadata and initialize ranges in ngOnChanges', () => {
        component.ngOnChanges();

        expect(mockDataService.getMetaData).toHaveBeenCalled();
        expect(component.ranges).toBeDefined();
    });

    it('should initialize hashtags in ngOnInit', () => {
        component.ngOnInit();
        expect(mockDataService.requestAllHashtags).toHaveBeenCalled();
    });

    it('should validate hashtag presence', () => {
        component.hashtag = '';
        const result = component.validateForm();
        expect(result).toBeFalse();
        expect(mockToastService.show).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Hashtag is empty'
        }));
    });

    it('should validate date range', () => {
        component.hashtag = 'test';
        const result = component.validateForm();
        expect(result).toBeFalse();
        expect(mockToastService.show).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Date range is empty'
        }));
    });

    it('should clean a hashtag', () => {
        const cleaned = component.cleanHashTag('#testTag');
        expect(cleaned).toBe('testTag');
    });

    it('should emit date range in getStatistics if valid', fakeAsync(() => {
        component.selectedDateRangeUTC = {
            start: dayjs('2024-03-01T00:00:00Z'),
            end: dayjs('2024-03-03T00:00:00Z')
        };
        component.hashtag = 'test';
        component.selectedHashtagOption = { hashtag: 'test', highlighted: '' };
        component.selectedCountries = [];
        component.selectedTopics = [];

        spyOn(component.dateRangeEmitter, 'emit');
        spyOn(component, 'validateForm').and.returnValue(true);

        component.getStatistics();
        tick(1600);

        expect(component.dateRangeEmitter.emit).toHaveBeenCalled();
        expect(mockDataService.updateURL).toHaveBeenCalled();
    }));

    it('should toggle live mode on', fakeAsync(() => {
        spyOn(component, 'getStatistics');
        component.selectedDateRangeUTC = {
            start: dayjs().subtract(1, 'hour'),
            end: dayjs()
        };
        component.interval = 'PT5M';

        component.toggleLiveMode();
        tick(10000);
        expect(component.liveMode).toBeTrue();
        expect(component.getStatistics).toHaveBeenCalled();
    }));

    it('should toggle live mode off', () => {
        component.liveMode = true;
        component.refreshIntervalId = setInterval(() => {}, 1000);
        spyOn(window, 'clearInterval');

        component.turnOffLiveMode();

        expect(component.liveMode).toBeFalse();
        expect(clearInterval).toHaveBeenCalled();
    });

    it('should filter countries on changeHub()', () => {
        const hub = 'asia-pacific';
        component.changeHub(hub);
        expect(component.selectedHub).toBe(hub);
        expect(component.selectedCountries.length).toBeGreaterThan(0);
    });

    it('should filter topics on changeImpactArea()', () => {
        const area = 'disaster';
        component.changeImpactArea(area);

        expect(component.selectedImpactArea).toBe(area);
        expect(component.selectedTopics.length).toBeGreaterThan(0);
    });

});
