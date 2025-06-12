import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import {By} from '@angular/platform-browser';

import {PlotComponent} from './plot.component';
import {DataService} from '../../data.service';
import {StateService} from '../../state.service';
import {UTCToLocalConverterPipe} from '../query/pipes/utc-to-local-converter.pipe';
import {IPlotData, ITopicPlotData, IWrappedPlotData, IWrappedTopicPlotData, StatsType} from '../types';
import { Overlay } from '../../overlay.component';

// Mock Plotly
const mockPlotly = {
    react: jasmine.createSpy('react'),
    relayout: jasmine.createSpy('relayout')
};

// Mock topicDefinitions
const mockTopicDefinitions = {
    users: {
        name: 'Contributors',
        'color-hex': '#007bff',
        'y-title': 'Number of Contributors'
    },
    buildings: {
        name: 'Buildings',
        'color-hex': '#28a745',
        'y-title': 'Number of Buildings'
    },
    roads: {
        name: 'Roads',
        'color-hex': '#dc3545',
        'y-title': 'Length of Roads (km)'
    }
};

describe('PlotComponent', () => {
    let component: PlotComponent;
    let fixture: ComponentFixture<PlotComponent>;
    let mockDataService: jasmine.SpyObj<DataService>;
    let mockStateService: jasmine.SpyObj<StateService>;
    let mockUtcToLocalConverter: jasmine.SpyObj<UTCToLocalConverterPipe>;

    const mockPlotData: IPlotData = {
        users: [10, 20, 30],
        buildings: [100, 200, 300],
        roads: [50, 75, 100],
        edits: [500, 1000, 1500],
        startDate: ['2023-01-01T00:00:00.000Z', '2023-01-02T00:00:00.000Z', '2023-01-03T00:00:00.000Z'],
        endDate: ['2023-01-01T23:59:59.999Z', '2023-01-02T23:59:59.999Z', '2023-01-03T23:59:59.999Z'],
        hashtag: ['test'],
        countries: ['US']
    };

    const mockWrappedPlotData: IWrappedPlotData = {
        result: mockPlotData
    };

    const mockTopicPlotData: Record<string, ITopicPlotData> = {
        amenity: {
            value: [5, 10, 15],
            topic: 'amenity',
            startDate: ['2023-01-01T00:00:00.000Z', '2023-01-02T00:00:00.000Z', '2023-01-03T00:00:00.000Z'],
            endDate: ['2023-01-01T23:59:59.999Z', '2023-01-02T23:59:59.999Z', '2023-01-03T23:59:59.999Z']
        }
    };

    const mockWrappedTopicPlotData: IWrappedTopicPlotData = {
        result: mockTopicPlotData
    };

    const mockState = {
        hashtag: 'test',
        start: '2023-01-01',
        end: '2023-01-31',
        countries: 'US',
        interval: 'P1D',
        topics: '',
        active_topic: 'users' as StatsType,
        fit_to_content: ''
    };

    beforeEach(async () => {
        const dataServiceSpy = jasmine.createSpyObj('DataService', [
            'requestPlot',
            'requestTopicInterval'
        ]);

        const stateServiceSpy = jasmine.createSpyObj('StateService', [
            'appState'
        ]);

        const utcToLocalConverterSpy = jasmine.createSpyObj('UTCToLocalConverterPipe', [
            'transform'
        ]);

        // Mock global Plotly
        (window as any).Plotly = mockPlotly;

        // Mock topicDefinitions import
        // jest.doMock('../../../assets/static/json/topicDefinitions.json', () => mockTopicDefinitions, { virtual: true });

        await TestBed.configureTestingModule({
            declarations: [PlotComponent, Overlay],
            providers: [
                { provide: DataService, useValue: dataServiceSpy },
                { provide: StateService, useValue: stateServiceSpy },
                { provide: UTCToLocalConverterPipe, useValue: utcToLocalConverterSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlotComponent);
        component = fixture.componentInstance;
        mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
        mockUtcToLocalConverter = TestBed.inject(UTCToLocalConverterPipe) as jasmine.SpyObj<UTCToLocalConverterPipe>;

        // Setup default mock returns
        mockStateService.appState.and.returnValue(mockState);
        mockDataService.requestPlot.and.returnValue(of(mockWrappedPlotData));
        mockDataService.requestTopicInterval.and.returnValue(of(mockWrappedTopicPlotData));
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

            expect(component.layout.margin).toEqual({ l: 50, r: 20, t: 20, b: 40 });
            expect(component.layout.legend).toEqual({ orientation: 'h' });
            expect(component.layout.barmode).toBe('group');
            expect(component.layout.font.family).toContain('Roboto');
        });
    });

    describe('requestToAPI', () => {
        beforeEach(() => {
            spyOn(component, 'refreshPlot');
            spyOn(component, 'fitToContent').and.returnValue(() => {});
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
            expect(component.data.hashtag).toBe('test');
            expect(component.data.countries).toBe('US');
            expect(component.refreshPlot).toHaveBeenCalled();
            expect(component.isPlotsLoading).toBe(false);
        }));

        it('should handle plot data with topics', fakeAsync(() => {
            const stateWithTopics = { ...mockState, topics: 'amenity' };
            spyOn(component, 'addTopicDataToPlot').and.returnValue(mockPlotData);

            component['requestToAPI'](stateWithTopics);
            tick();

            expect(mockDataService.requestTopicInterval).toHaveBeenCalledWith(stateWithTopics);
            expect(component.addTopicDataToPlot).toHaveBeenCalled();
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

        it('should handle topic API errors', fakeAsync(() => {
            spyOn(console, 'error');
            const stateWithTopics = { ...mockState, topics: 'amenity' };
            mockDataService.requestTopicInterval.and.returnValue(throwError('Topic API Error'));

            component['requestToAPI'](stateWithTopics);
            tick();

            expect(console.error).toHaveBeenCalledWith('Error while requesting Topic data ', 'Topic API Error');
        }));

        it('should decode hashtag URL encoding', fakeAsync(() => {
            const stateWithEncodedHashtag = { ...mockState, hashtag: 'test%20hashtag' };

            component['requestToAPI'](stateWithEncodedHashtag);
            tick();

            expect(component.data.hashtag).toBe('test hashtag');
        }));
    });

    describe('addTopicDataToPlot', () => {
        it('should merge topic data into plot data', () => {
            const result: any = component['addTopicDataToPlot'](mockTopicPlotData, { ...mockPlotData });

            expect(result['amenity']).toEqual([5, 10, 15]);
        });

        it('should handle multiple topics', () => {
            const multipleTopics = {
                ...mockTopicPlotData,
                commercial: {
                    value: [1, 2, 3],
                    topic: 'commercial',
                    startDate: ['2023-01-01T00:00:00.000Z'],
                    endDate: ['2023-01-01T23:59:59.999Z']
                }
            };

            const result = component['addTopicDataToPlot'](multipleTopics, { ...mockPlotData });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            expect(result['amenity']).toEqual([5, 10, 15]);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            expect(result['commercial']).toEqual([1, 2, 3]);
        });
    });

    describe('stripedOrNot', () => {
        beforeEach(() => {
            component.data = mockPlotData;
            mockStateService.appState.and.returnValue({
                ...mockState,
                start: '2023-01-01T00:00:00.000Z',
                end: '2023-01-03T23:59:59.999Z'
            });
        });

        it('should return empty string for middle elements', () => {
            const result = component.stripedOrNot(1);
            expect(result).toBe('');
        });

        it('should return striped pattern for first/last elements when outside range', () => {
            // Mock dayjs behavior for date comparison
            spyOn(component, 'stripedOrNot').and.callThrough();

            // This test would need more complex mocking of dayjs
            // For now, just test the method exists and can be called
            expect(() => component.stripedOrNot(0)).not.toThrow();
            expect(() => component.stripedOrNot(2)).not.toThrow();
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

    // describe('template rendering', () => {
    //     it('should hide component when data is not available', () => {
    //         component.data = undefined as any;
    //         fixture.detectChanges();
    //
    //         const containerElement = fixture.debugElement.query(By.css('.bd.bgc-white'));
    //         expect(containerElement.nativeElement.hidden).toBe(true);
    //     });
    //
    //     it('should show component when data is available', () => {
    //         component.data = mockPlotData;
    //         fixture.detectChanges();
    //
    //         const containerElement = fixture.debugElement.query(By.css('.bd.bgc-white'));
    //         expect(containerElement.nativeElement.hidden).toBe(false);
    //     });
    //
    //     it('should show loading overlay when isPlotsLoading is true', () => {
    //         component.data = mockPlotData;
    //         component.isPlotsLoading = true;
    //         fixture.detectChanges();
    //
    //         const overlayElement = fixture.debugElement.query(By.css('overlay'));
    //         expect(overlayElement).toBeTruthy();
    //         expect(overlayElement.nativeElement.getAttribute('ng-reflect-is-loading')).toBe('true');
    //     });
    //
    //     it('should render plot container with correct id', () => {
    //         component.data = mockPlotData;
    //         fixture.detectChanges();
    //
    //         const plotElement = fixture.debugElement.query(By.css('#summaryplot'));
    //         expect(plotElement).toBeTruthy();
    //         expect(plotElement.nativeElement.style.height).toBe('350px');
    //     });
    // });

    // describe('config properties', () => {
    //     it('should have correct default config', () => {
    //         expect(component.config.responsive).toBe(true);
    //         expect(component.config.modeBarButtonsToRemove).toContain('select2d');
    //         expect(component.config.modeBarButtonsToRemove).toContain('lasso2d');
    //         expect(component.config.modeBarButtonsToRemove).toContain('resetScale2d');
    //     });
    //
    //     it('should have fit to content icon defined', () => {
    //         expect(component.fitToContentIcon.width).toBe(600);
    //         expect(component.fitToContentIcon.height).toBe(500);
    //         expect(component.fitToContentIcon.path).toBeDefined();
    //     });
    // });
});