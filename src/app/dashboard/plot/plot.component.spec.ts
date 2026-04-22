import {type MockedObject, vi} from "vitest";
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';

import {PlotComponent} from './plot.component';
import {DataService} from '../../../lib/data.service';
import {StateService} from '../../../lib/state.service';
import {UTCToLocalConverterPipe} from '../query/pipes/utc-to-local-converter.pipe';
import {IPlotResult, StatsType} from '../../../lib/types';
import {Overlay} from '../../overlay.component';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// Mock Plotly
const mockPlotly = {
    react: vi.fn(),
    relayout: vi.fn()
};


describe('PlotComponent', () => {
    let component: PlotComponent;
    let fixture: ComponentFixture<PlotComponent>;
    let mockDataService: MockedObject<DataService>;
    let mockStateService: MockedObject<StateService>;
    let mockUtcToLocalConverter: MockedObject<UTCToLocalConverterPipe>;

    const mockPlotData: IPlotResult = {
        startDate: ['2023-01-01T00:00:00.000Z', '2023-01-02T00:00:00.000Z', '2023-01-03T00:00:00.000Z'],
        endDate: ['2023-01-01T23:59:59.999Z', '2023-01-02T23:59:59.999Z', '2023-01-03T23:59:59.999Z'],
        topics: {
            contributor: {value: [10, 20, 30]},
            building: {value: [100, 200, 300]},
            road: {value: [50, 75, 100]},
            edit: {value: [500, 1000, 1500]},
            amenity: {value: [500, 1000, 1500]},
            body_of_water: {value: [500, 1000, 1500]},
            commercial: {value: [500, 1000, 1500]},
            education: {value: [500, 1000, 1500]},
            financial: {value: [500, 1000, 1500]},
            healthcare: {value: [500, 1000, 1500]},
            lulc: {value: [500, 1000, 1500]},
            place: {value: [500, 1000, 1500]},
            poi: {value: [500, 1000, 1500]},
            power: {value: [500, 1000, 1500]},
            social_facility: {value: [500, 1000, 1500]},
            wash: {value: [500, 1000, 1500]},
            waterway: {value: [500, 1000, 1500]}
        }
    };

    const mockState = {
        hashtag: 'test',
        start: '2023-01-01',
        end: '2023-01-31',
        countries: 'US',
        interval: 'P1D',
        topics: '',
        active_topic: 'contributor' as StatsType,
        fit_to_content: undefined,
        osm_user_id: ''
    };

    beforeEach(async () => {
        const dataServiceSpy = {
            requestPlot: vi.fn().mockName("DataService.requestPlot"),
            requestTopicInterval: vi.fn().mockName("DataService.requestTopicInterval"),
            metaData: vi.fn().mockName("DataService.metaData")
        };

        const stateServiceSpy = {
            appState: vi.fn().mockName("StateService.appState")
        };

        const utcToLocalConverterSpy = {
            transform: vi.fn().mockName("UTCToLocalConverterPipe.transform")
        };

        // Mock global Plotly
        (window as any).Plotly = mockPlotly;

        await TestBed.configureTestingModule({
            imports: [Overlay, PlotComponent],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy},
                {provide: UTCToLocalConverterPipe, useValue: utcToLocalConverterSpy}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlotComponent);
        component = fixture.componentInstance;
        mockDataService = TestBed.inject(DataService) as MockedObject<DataService>;
        mockStateService = TestBed.inject(StateService) as MockedObject<StateService>;
        mockUtcToLocalConverter = TestBed.inject(UTCToLocalConverterPipe) as MockedObject<UTCToLocalConverterPipe>;

        // Setup default mock returns
        mockStateService.appState.mockReturnValue(mockState);
        mockDataService.requestPlot.mockReturnValue(of({result: mockPlotData}));
        mockDataService.metaData.mockReturnValue({
            min_timestamp: dayjs().toISOString(),
            max_timestamp: dayjs().toISOString()
        });
        mockUtcToLocalConverter.transform.mockReturnValue('2023-01-01 00:00:00');
    });

    afterEach(() => {
        mockPlotly.react.mockClear();
        mockPlotly.relayout.mockClear();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.data()).toBeNull();
        expect(component.activeTopic()).toBeNull();
        expect(component.isPlotsLoading()).toBe(false);
        expect(component.config).toBeDefined();
        expect(component.fitToContentIcon).toBeDefined();
    });

    describe('fetchPlotData', () => {
        beforeEach(() => {
            vi.spyOn(component, 'fitToContent').mockReturnValue(() => {
            });
            vi.spyOn(component, 'resetZoom');
        });

        it('should call requestPlot with correct parameters', () => {
            component['fetchPlotData'](mockState);

            expect(mockDataService.requestPlot).toHaveBeenCalledWith(mockState);
        });

        it('should handle plot data without topics', () => {
            component['fetchPlotData'](mockState);

            expect(component.data()).toBeDefined();
            expect(component.isPlotsLoading()).toBe(false);
        });

        it('should handle plot data with topics', () => {
            const stateWithTopics = {...mockState, topics: 'amenity'};

            component['fetchPlotData'](stateWithTopics);
        });

        it('should call resetZoom when fit_to_content is not set', () => {
            component['fetchPlotData'](mockState);

            expect(component.resetZoom).toHaveBeenCalled();
        });

        it('should handle API errors', () => {
            vi.spyOn(console, 'error');
            mockDataService.requestPlot.mockReturnValue(throwError('API Error'));

            component['fetchPlotData'](mockState);

            expect(console.error).toHaveBeenCalledWith('Error while requesting Plot data  ', 'API Error');
        });
    });

    describe('computed properties and effects', () => {
        it('should call fetchPlotData when relevantState changes', () => {
            vi.spyOn(component as any, 'fetchPlotData');

            fixture.detectChanges();

            expect((component as any).fetchPlotData).toHaveBeenCalled();
        });

        it('should update activeTopic when active_topic changes', () => {
            mockStateService.appState.mockReturnValue({
                ...mockState,
                active_topic: 'building' as StatsType
            });

            fixture.detectChanges();

            expect(component.activeTopic()).toBe('building');
        });
    });
});
