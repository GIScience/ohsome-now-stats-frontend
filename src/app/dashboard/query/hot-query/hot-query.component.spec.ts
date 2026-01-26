import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../data.service';
import {ToastService} from 'src/app/toast.service';
import {StateService} from '../../../state.service';
import {of} from 'rxjs';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {ActivatedRoute} from '@angular/router';
import {NO_ERRORS_SCHEMA, signal} from '@angular/core';
import {IHashtags, IStateParams} from '../../types';
import {QueryComponent} from "../query.component";
import {HotQueryComponent} from "./hot-query.component";
import {vi} from "vitest";

describe('LiveQueryComponent', () => {
    let component: HotQueryComponent;
    let fixture: ComponentFixture<HotQueryComponent>;
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
            imports: [FormsModule, HotQueryComponent, QueryComponent, UTCToLocalConverterPipe],
            providers: [
                {provide: DataService, useValue: mockDataService},
                {provide: ToastService, useValue: mockToastService},
                {provide: StateService, useValue: mockStateService},
                {provide: ActivatedRoute, useValue: mockActivatedRoute}
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(HotQueryComponent);
        component = fixture.componentInstance;
    });
    it('should create', () => {
        expect(component).toBeTruthy();
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
});

