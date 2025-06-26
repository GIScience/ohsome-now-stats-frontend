import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {LiveQueryComponent} from './live-query.component';
import {DataService} from '../../../data.service';
import {ToastService} from 'src/app/toast.service';
import {StateService} from '../../../state.service';
import {of} from 'rxjs';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {ActivatedRoute} from '@angular/router';
import {NO_ERRORS_SCHEMA, signal} from '@angular/core';
import dayjs from 'dayjs';
import {IHashtags, IStateParams} from '../../types';
import {QueryComponent} from "../query.component";

describe('LiveQueryComponent', () => {
    let component: LiveQueryComponent;
    let fixture: ComponentFixture<LiveQueryComponent>;
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
            defaultIntervalValue: 'P1M',
            requestMetadata: jasmine.createSpy('requestMetadata').and.returnValue(of(mockMetaData))
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
            declarations: [LiveQueryComponent, QueryComponent],
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

        fixture = TestBed.createComponent(LiveQueryComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    describe('Live Mode', () => {
        beforeEach(() => {
            component.selectedDateRange = {
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
            spyOn(component, 'triggerMetaDataRetrieval');

            component.toggleLiveMode();

            expect(component.liveMode).toBe(true);
            expect(component.triggerMetaDataRetrieval).toHaveBeenCalled();
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
});