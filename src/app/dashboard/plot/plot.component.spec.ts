import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {of, throwError} from 'rxjs';

import {PlotComponent} from './plot.component';
import {DataService} from '../../data.service';
import {StateService} from '../../state.service';
import {UTCToLocalConverterPipe} from '../query/pipes/utc-to-local-converter.pipe';
import {IPlotResult, StatsType} from '../types';
import {Overlay} from '../../overlay.component';
import dayjs from "dayjs";

// Mock Plotly
const mockPlotly = {
    react: jasmine.createSpy('react'),
    relayout: jasmine.createSpy('relayout')
};


describe('PlotComponent', () => {
    let component: PlotComponent;
    let fixture: ComponentFixture<PlotComponent>;
    let mockDataService: jasmine.SpyObj<DataService>;
    let mockStateService: jasmine.SpyObj<StateService>;
    let mockUtcToLocalConverter: jasmine.SpyObj<UTCToLocalConverterPipe>;

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
        active_topic: 'users' as StatsType,
        fit_to_content: undefined
    };

    beforeEach(async () => {
        const dataServiceSpy = jasmine.createSpyObj('DataService', [
            'requestPlot',
            'requestTopicInterval',
            'metaData'
        ]);

        const stateServiceSpy = jasmine.createSpyObj('StateService', [
            'appState'
        ]);

        const utcToLocalConverterSpy = jasmine.createSpyObj('UTCToLocalConverterPipe', [
            'transform'
        ]);

        // Mock global Plotly
        (window as any).Plotly = mockPlotly;

        await TestBed.configureTestingModule({
            declarations: [PlotComponent],
            imports: [Overlay],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy},
                {provide: UTCToLocalConverterPipe, useValue: utcToLocalConverterSpy}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlotComponent);
        component = fixture.componentInstance;
        mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
        mockUtcToLocalConverter = TestBed.inject(UTCToLocalConverterPipe) as jasmine.SpyObj<UTCToLocalConverterPipe>;

        // Setup default mock returns
        mockStateService.appState.and.returnValue(mockState);
        mockDataService.requestPlot.and.returnValue(of({result: mockPlotData}));
        mockDataService.metaData.and.returnValue({
            min_timestamp: dayjs().toISOString(),
            max_timestamp: dayjs().toISOString()
        });
        mockUtcToLocalConverter.transform.and.returnValue('2023-01-01 00:00:00');
    });

    afterEach(() => {
        mockPlotly.react.calls.reset();
        mockPlotly.relayout.calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.data).toBeUndefined();
        expect(component.activeTopic).toBeUndefined();
        expect(component.isPlotsLoading).toBe(false);
        expect(component.config).toBeDefined();
        expect(component.fitToContentIcon).toBeDefined();
    });

    describe('ngAfterContentInit', () => {
        it('should call initChart', () => {
            spyOn(component, 'initChart');

            component.ngAfterContentInit();

            expect(component.initChart).toHaveBeenCalled();
        });
    });

    describe('initChart', () => {
        it('should initialize layout and call Plotly.react', () => {
            component.initChart();

            expect(component.layout).toBeDefined();
            expect(component.layout.autosize).toBe(true);
            expect(component.layout.height).toBe(350);
            // expect(mockPlotly.react).toHaveBeenCalledWith('summaryplot', [], component.layout, component.config);
        });

        it('should set correct layout properties', () => {
            component.initChart();

            expect(component.layout.margin).toEqual({l: 50, r: 20, t: 20, b: 40});
            expect(component.layout.legend).toEqual({orientation: 'h'});
            expect(component.layout.barmode).toBe('group');
            expect(component.layout.font.family).toContain('Roboto');
        });
    });

    describe('requestToAPI', () => {
        beforeEach(() => {
            spyOn(component, 'refreshPlot');
            spyOn(component, 'fitToContent').and.returnValue(() => {
            });
            spyOn(component, 'resetZoom');
        });

        it('should call requestPlot with correct parameters', () => {
            component['requestToAPI'](mockState);

            expect(mockDataService.requestPlot).toHaveBeenCalledWith(mockState);
        });

        it('should handle plot data without topics', fakeAsync(() => {
            component['requestToAPI'](mockState);
            tick();

            expect(component.data).toBeDefined();
            expect(component.refreshPlot).toHaveBeenCalled();
            expect(component.isPlotsLoading).toBe(false);
        }));

        it('should handle plot data with topics', fakeAsync(() => {
            const stateWithTopics = {...mockState, topics: 'amenity'};

            component['requestToAPI'](stateWithTopics);
            tick();
        }));

        it('should call resetZoom when fit_to_content is not set', fakeAsync(() => {
            component['requestToAPI'](mockState);
            tick();

            expect(component.resetZoom).toHaveBeenCalled();
        }));

        it('should handle API errors', () => {
            spyOn(console, 'error');
            mockDataService.requestPlot.and.returnValue(throwError('API Error'));

            component['requestToAPI'](mockState);

            expect(console.error).toHaveBeenCalledWith('Error while requesting Plot data  ', 'API Error');
        });
    });

    describe('computed properties and effects', () => {
        it('should call requestToAPI when relevantState changes', () => {
            spyOn(component as any, 'requestToAPI');

            fixture.detectChanges();

            expect((component as any).requestToAPI).toHaveBeenCalled();
        });

        it('should call refreshPlot when only active_topic changes', () => {
            component.data = mockPlotData;
            spyOn(component, 'refreshPlot');

            // Simulate active topic change
            mockStateService.appState.and.returnValue({
                ...mockState,
                active_topic: 'buildings' as StatsType
            });

            fixture.detectChanges();

            expect(component.refreshPlot).toHaveBeenCalled();
        });
    });
});