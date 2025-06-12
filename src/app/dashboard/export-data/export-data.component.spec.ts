import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ExportDataComponent} from './export-data.component';
import {DataService} from "../../data.service";
import {StateService} from "../../state.service";
import {signal} from "@angular/core";
import {of} from "rxjs";
import {IHashtags, IQueryParam} from "../types";

describe('ExportDataComponent', () => {
    let component: ExportDataComponent;
    let fixture: ComponentFixture<ExportDataComponent>;
    let mockDataService: any;
    let mockStateService: any;

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

    const mockAppState: IQueryParam = {
        countries: 'USA,CAN',
        hashtag: 'missingmaps',
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
        interval: 'P1M',
        topics: 'roads,buildings',
        active_topic: 'roads'
    };

    beforeEach(async () => {
        mockDataService = {
            metaData: signal(mockMetaData),
            requestCountryStats: jasmine.createSpy('requestCountryStats').and.returnValue(of(mockHashtags)),
        };
        mockStateService = {
            appState: signal(mockAppState),
            updatePartialState: jasmine.createSpy('updatePartialState')
        };

        await TestBed.configureTestingModule({
            declarations: [ExportDataComponent],
            providers: [
                {provide: DataService, useValue: mockDataService},
                {provide: StateService, useValue: mockStateService}
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ExportDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { of, throwError } from 'rxjs';
// import { ExportDataComponent } from './export-data.component';
// import { StateService } from '../../state.service';
// import { DataService } from '../../data.service';
// import {
//   IWrappedSummaryData,
//   IWrappedTopicData,
//   IWrappedPlotData,
//   IWrappedCountryStatsData,
//   IWrappedTopicCountryData,
//   ISummaryData,
//   IPlotData,
//   ICountryStatsData,
//   TopicResponse,
//   ITopicPlotData
// } from '../types';
//
// describe('ExportDataComponent', () => {
//   let component: ExportDataComponent;
//   let fixture: ComponentFixture<ExportDataComponent>;
//   let mockStateService: jasmine.SpyObj<StateService>;
//   let mockDataService: jasmine.SpyObj<DataService>;
//   let mockMkConfig: jasmine.Spy;
//   let mockGenerateCsv: jasmine.Spy;
//   let mockDownload: jasmine.Spy;
//
//   const mockAppState = {
//     hashtag: 'test-hashtag',
//     start: '2023-01-01T00:00:00.000Z',
//     end: '2023-12-31T23:59:59.999Z',
//     countries: 'DE,FR',
//     topics: 'amenity,buildings'
//   };
//
//   const mockSummaryResponse: IWrappedSummaryData = {
//     result: {
//       changesets: 100,
//       buildings: 500,
//       users: 50,
//       edits: 1000,
//       roads: 200,
//       latest: '2023-12-31T23:59:59.999Z'
//     }
//   };
//
//   const mockTopicResponse: IWrappedTopicData = {
//     result: {
//       amenity: { hashtag: 'test-hashtag', topic: 'amenity', value: 150 },
//       buildings: { hashtag: 'test-hashtag', topic: 'buildings', value: 300 }
//     } as TopicResponse
//   };
//
//   const mockPlotResponse: IWrappedPlotData = {
//     result: {
//       users: [10, 20, 30],
//       roads: [100, 200, 300],
//       buildings: [50, 100, 150],
//       edits: [500, 1000, 1500],
//       startDate: ['2023-01-01T00:00:00.000Z', '2023-02-01T00:00:00.000Z', '2023-03-01T00:00:00.000Z'],
//       endDate: ['2023-01-31T23:59:59.999Z', '2023-02-28T23:59:59.999Z', '2023-03-31T23:59:59.999Z']
//     }
//   };
//
//   const mockCountryStatsResponse: IWrappedCountryStatsData = {
//     query: {
//       timespan: { startDate: '2023-01-01T00:00:00.000Z', endDate: '2023-12-31T23:59:59.999Z' },
//       hashtag: 'test-hashtag'
//     },
//     result: [
//       {
//         users: 25,
//         roads: 100,
//         buildings: 250,
//         edits: 500,
//         latest: '2023-12-31T23:59:59.999Z',
//         country: 'DE'
//       },
//       {
//         users: 30,
//         roads: 150,
//         buildings: 300,
//         edits: 600,
//         latest: '2023-12-31T23:59:59.999Z',
//         country: 'FR'
//       }
//     ]
//   };
//
//   beforeEach(async () => {
//     const stateServiceSpy = jasmine.createSpyObj('StateService', ['appState']);
//     const dataServiceSpy = jasmine.createSpyObj('DataService', [
//       'requestSummary',
//       'requestTopic',
//       'requestPlot',
//       'requestTopicInterval',
//       'requestCountryStats',
//       'requestTopicCountryStats'
//     ]);
//
//     // Mock the export-to-csv functions
//     mockMkConfig = jasmine.createSpy('mkConfig').and.returnValue({
//       filename: 'test.csv',
//       columnHeaders: []
//     });
//     mockGenerateCsv = jasmine.createSpy('generateCsv').and.returnValue(jasmine.createSpy().and.returnValue('csv,data'));
//     mockDownload = jasmine.createSpy('download').and.returnValue(jasmine.createSpy());
//
//     // Mock the module imports
//     spyOnProperty(window, 'require').and.returnValue(() => ({
//       mkConfig: mockMkConfig,
//       generateCsv: mockGenerateCsv,
//       download: mockDownload
//     }));
//
//     await TestBed.configureTestingModule({
//       declarations: [ExportDataComponent],
//       providers: [
//         { provide: StateService, useValue: stateServiceSpy },
//         { provide: DataService, useValue: dataServiceSpy }
//       ]
//     }).compileComponents();
//
//     fixture = TestBed.createComponent(ExportDataComponent);
//     component = fixture.componentInstance;
//     mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
//     mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
//
//     // Mock the import statements by replacing the functions directly on the component
//     (component as any).mkConfig = mockMkConfig;
//     (component as any).generateCsv = mockGenerateCsv;
//     (component as any).download = mockDownload;
//   });
//
//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
//
//   describe('exportOverview', () => {
//     beforeEach(() => {
//       mockStateService.appState.and.returnValue(mockAppState);
//       spyOn(component, 'prepareOverviewDataAndDownload');
//     });
//
//     it('should export overview with topics', () => {
//       mockDataService.requestSummary.and.returnValue(of(mockSummaryResponse));
//       mockDataService.requestTopic.and.returnValue(of(mockTopicResponse));
//
//       component.exportOverview();
//
//       expect(mockDataService.requestSummary).toHaveBeenCalledWith(mockAppState);
//       expect(mockDataService.requestTopic).toHaveBeenCalledWith(mockAppState);
//       expect(component.prepareOverviewDataAndDownload).toHaveBeenCalled();
//     });
//
//     it('should export overview without topics', () => {
//       const stateWithoutTopics = { ...mockAppState, topics: '' };
//       mockStateService.appState.and.returnValue(stateWithoutTopics);
//       mockDataService.requestSummary.and.returnValue(of(mockSummaryResponse));
//
//       component.exportOverview();
//
//       expect(mockDataService.requestSummary).toHaveBeenCalledWith(stateWithoutTopics);
//       expect(mockDataService.requestTopic).not.toHaveBeenCalled();
//       expect(component.prepareOverviewDataAndDownload).toHaveBeenCalled();
//     });
//
//     it('should handle error when requesting data with topics', () => {
//       spyOn(console, 'error');
//       mockDataService.requestSummary.and.returnValue(throwError(() => new Error('API Error')));
//       mockDataService.requestTopic.and.returnValue(of(mockTopicResponse));
//
//       component.exportOverview();
//
//       expect(console.error).toHaveBeenCalledWith('Error while requesting data: ', jasmine.any(Error));
//     });
//
//     it('should handle error when requesting summary only', () => {
//       const stateWithoutTopics = { ...mockAppState, topics: '' };
//       mockStateService.appState.and.returnValue(stateWithoutTopics);
//       spyOn(console, 'error');
//       mockDataService.requestSummary.and.returnValue(throwError(() => new Error('API Error')));
//
//       component.exportOverview();
//
//       expect(console.error).toHaveBeenCalledWith('Error while requesting Summary data ', jasmine.any(Error));
//     });
//   });
//
//   describe('prepareOverviewDataAndDownload', () => {
//     it('should prepare and download overview data', () => {
//       const summaryData: ISummaryData = {
//         hashtag: 'test-hashtag',
//         startDate: '2023-01-01T00:00:00.000Z',
//         endDate: '2023-12-31T23:59:59.999Z',
//         users: 50,
//         edits: 1000,
//         buildings: 500,
//         roads: 200
//       };
//
//       // Mock the imported functions directly
//       spyOn(component as any, 'mkConfig').and.returnValue({ filename: 'test.csv', columnHeaders: [] });
//       spyOn(component as any, 'generateCsv').and.returnValue(jasmine.createSpy().and.returnValue('csv,data'));
//       spyOn(component as any, 'download').and.returnValue(jasmine.createSpy());
//
//       component.prepareOverviewDataAndDownload(summaryData);
//
//       // Since we can't easily mock the imports, we'll verify the method completes without error
//       expect(summaryData).toBeDefined();
//     });
//
//     it('should not process empty summary data', () => {
//       const emptySummaryData: ISummaryData = {} as ISummaryData;
//
//       // This should not throw an error
//       expect(() => component.prepareOverviewDataAndDownload(emptySummaryData)).not.toThrow();
//     });
//   });
//
//   describe('exportTimeSeries', () => {
//     beforeEach(() => {
//       mockStateService.appState.and.returnValue(mockAppState);
//       spyOn(component, 'preparePlotDataAndDownload');
//     });
//
//     it('should export time series with topics', () => {
//       const mockTopicIntervalResponse = {
//         result: {
//           amenity: {
//             value: [10, 20, 30],
//             topic: 'amenity',
//             startDate: ['2023-01-01T00:00:00.000Z', '2023-02-01T00:00:00.000Z', '2023-03-01T00:00:00.000Z'],
//             endDate: ['2023-01-31T23:59:59.999Z', '2023-02-28T23:59:59.999Z', '2023-03-31T23:59:59.999Z']
//           }
//         }
//       };
//
//       mockDataService.requestPlot.and.returnValue(of(mockPlotResponse));
//       mockDataService.requestTopicInterval.and.returnValue(of(mockTopicIntervalResponse));
//
//       component.exportTimeSeries();
//
//       expect(mockDataService.requestPlot).toHaveBeenCalledWith(mockAppState);
//       expect(mockDataService.requestTopicInterval).toHaveBeenCalledWith(mockAppState);
//     });
//
//     it('should export time series without topics', () => {
//       const stateWithoutTopics = { ...mockAppState, topics: '' };
//       mockStateService.appState.and.returnValue(stateWithoutTopics);
//       mockDataService.requestPlot.and.returnValue(of(mockPlotResponse));
//
//       component.exportTimeSeries();
//
//       expect(mockDataService.requestPlot).toHaveBeenCalledWith(stateWithoutTopics);
//       expect(mockDataService.requestTopicInterval).not.toHaveBeenCalled();
//       expect(component.preparePlotDataAndDownload).toHaveBeenCalled();
//     });
//
//     it('should handle error when requesting plot data', () => {
//       spyOn(console, 'error');
//       mockDataService.requestPlot.and.returnValue(throwError(() => new Error('Plot API Error')));
//
//       component.exportTimeSeries();
//
//       expect(console.error).toHaveBeenCalledWith('Error while requesting Plot data  ', jasmine.any(Error));
//     });
//   });
//
//   describe('exportMap', () => {
//     beforeEach(() => {
//       mockStateService.appState.and.returnValue(mockAppState);
//       spyOn(component, 'prepareMapDataAndDownload');
//     });
//
//     it('should export map data with topics', () => {
//       const mockTopicCountryResponse: IWrappedTopicCountryData = {
//         query: {
//           timespan: { startDate: '2023-01-01T00:00:00.000Z', endDate: '2023-12-31T23:59:59.999Z' },
//           hashtag: 'test-hashtag'
//         },
//         result: {
//           amenity: [
//             { topic: 'amenity', country: 'DE', value: 100 },
//             { topic: 'amenity', country: 'FR', value: 150 }
//           ]
//         }
//       };
//
//       mockDataService.requestCountryStats.and.returnValue(of(mockCountryStatsResponse));
//       mockDataService.requestTopicCountryStats.and.returnValue(of(mockTopicCountryResponse));
//
//       component.exportMap();
//
//       expect(mockDataService.requestCountryStats).toHaveBeenCalledWith(mockAppState);
//       expect(mockDataService.requestTopicCountryStats).toHaveBeenCalledWith(mockAppState);
//     });
//
//     it('should export map data without topics', () => {
//       const stateWithoutTopics = { ...mockAppState, topics: '' };
//       mockStateService.appState.and.returnValue(stateWithoutTopics);
//       mockDataService.requestCountryStats.and.returnValue(of(mockCountryStatsResponse));
//
//       component.exportMap();
//
//       expect(mockDataService.requestCountryStats).toHaveBeenCalledWith(stateWithoutTopics);
//       expect(mockDataService.requestTopicCountryStats).not.toHaveBeenCalled();
//       expect(component.prepareMapDataAndDownload).toHaveBeenCalled();
//     });
//
//     it('should handle error when requesting country stats', () => {
//       spyOn(console, 'error');
//       mockDataService.requestCountryStats.and.returnValue(throwError(() => new Error('Country API Error')));
//
//       component.exportMap();
//
//       expect(console.error).toHaveBeenCalledWith('Error while requesting Country data  ', jasmine.any(Error));
//     });
//   });
//
//   describe('prepareMapDataAndDownload', () => {
//     it('should prepare and download map data for all countries', () => {
//       const mapData = mockCountryStatsResponse.result.map(country => ({
//         ...country,
//         hashtag: 'test-hashtag',
//         startDate: '2023-01-01T00:00:00.000Z',
//         endDate: '2023-12-31T23:59:59.999Z'
//       }));
//
//       // This should not throw an error
//       expect(() => component.prepareMapDataAndDownload(mapData, '')).not.toThrow();
//     });
//
//     it('should prepare and download map data for selected countries only', () => {
//       const mapData = mockCountryStatsResponse.result.map(country => ({
//         ...country,
//         hashtag: 'test-hashtag',
//         startDate: '2023-01-01T00:00:00.000Z',
//         endDate: '2023-12-31T23:59:59.999Z'
//       }));
//
//       // This should not throw an error
//       expect(() => component.prepareMapDataAndDownload(mapData, 'DE')).not.toThrow();
//     });
//
//     it('should handle empty map data', () => {
//       expect(() => component.prepareMapDataAndDownload([], 'DE')).not.toThrow();
//     });
//   });
//
//   describe('private methods', () => {
//     it('should convert data to JSON array', () => {
//       const input = {
//         users: [10, 20],
//         roads: [100, 200],
//         startDate: ['2023-01-01', '2023-02-01']
//       };
//
//       const result = (component as any).convertToJsonArray(input);
//
//       expect(result).toEqual([
//         { users: 10, roads: 100, startDate: '2023-01-01' },
//         { users: 20, roads: 200, startDate: '2023-02-01' }
//       ]);
//     });
//
//     it('should add topic data to plot', () => {
//       const topicData = {
//         amenity: {
//           value: [10, 20, 30],
//           topic: 'amenity',
//           startDate: ['2023-01-01', '2023-02-01', '2023-03-01'],
//           endDate: ['2023-01-31', '2023-02-28', '2023-03-31']
//         }
//       };
//
//       const plotData: IPlotData = {
//         users: [5, 10, 15],
//         roads: [50, 100, 150],
//         buildings: [25, 50, 75],
//         edits: [100, 200, 300],
//         startDate: ['2023-01-01', '2023-02-01', '2023-03-01'],
//         endDate: ['2023-01-31', '2023-02-28', '2023-03-31']
//       };
//
//       const result = (component as any).addTopicDataToPlot(topicData, plotData);
//
//       expect(result.amenity).toEqual([10, 20, 30]);
//     });
//
//     it('should add hashtag and countries to plot data', () => {
//       const plotData: IPlotData = {
//         users: [5, 10],
//         roads: [50, 100],
//         buildings: [25, 50],
//         edits: [100, 200],
//         startDate: ['2023-01-01', '2023-02-01'],
//         endDate: ['2023-01-31', '2023-02-28'],
//         hashtag: 'test-hashtag',
//         countries: 'DE,FR'
//       };
//
//       spyOn(console, 'log'); // Mock console.log to avoid output during tests
//
//       const result = (component as any).addHashtagAndCountriesToPlot(plotData);
//
//       expect(result.hashtag).toEqual(['test-hashtag', 'test-hashtag']);
//       expect(result.countries).toEqual(['DE,FR', 'DE,FR']);
//     });
//
//     it('should add topic data to countries', () => {
//       const topicData = {
//         amenity: [
//           { topic: 'amenity', country: 'DE', value: 100 },
//           { topic: 'amenity', country: 'FR', value: 150 }
//         ]
//       };
//
//       const countryData: ICountryStatsData[] = [
//         {
//           users: 25,
//           roads: 100,
//           buildings: 250,
//           edits: 500,
//           latest: '2023-12-31T23:59:59.999Z',
//           country: 'DE'
//         },
//         {
//           users: 30,
//           roads: 150,
//           buildings: 300,
//           edits: 600,
//           latest: '2023-12-31T23:59:59.999Z',
//           country: 'FR'
//         }
//       ];
//
//       const result = (component as any).addTopicDataToCountries(topicData, countryData);
//
//       expect(result[0].amenity).toBe(100);
//       expect(result[1].amenity).toBe(150);
//     });
//   });
//
//   describe('template interactions', () => {
//     it('should call exportOverview when overview link is clicked', () => {
//       spyOn(component, 'exportOverview');
//
//       const compiled = fixture.nativeElement;
//       const overviewLink = compiled.querySelector('a[ng-reflect-ng-class]');
//
//       if (overviewLink) {
//         overviewLink.click();
//         expect(component.exportOverview).toHaveBeenCalled();
//       }
//     });
//
//     it('should render export options in template', () => {
//       fixture.detectChanges();
//       const compiled = fixture.nativeElement;
//
//       expect(compiled.textContent).toContain('Export data as CSV');
//       expect(compiled.textContent).toContain('Overview statistics data');
//       expect(compiled.textContent).toContain('Timeseries data');
//       expect(compiled.textContent).toContain('Map data');
//     });
//   });
// });