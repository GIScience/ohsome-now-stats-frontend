import {DefaultQueryComponent} from './default-query.component';
import {NO_ERRORS_SCHEMA, signal} from "@angular/core";
import {of} from "rxjs";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {QueryComponent} from "../query.component";
import {FormsModule} from "@angular/forms";
import {DataService} from "../../../data.service";
import {ToastService} from "../../../toast.service";
import {StateService} from "../../../state.service";
import {UTCToLocalConverterPipe} from "../pipes/utc-to-local-converter.pipe";
import {ActivatedRoute} from "@angular/router";
import {IHashtags, IStateParams} from "../../types";

describe('DefaultQueryComponent', () => {
    let component: DefaultQueryComponent;
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

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});