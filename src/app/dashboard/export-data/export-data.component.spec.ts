import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ExportDataComponent} from './export-data.component';
import {DataService} from "../../data.service";
import {StateService} from "../../state.service";
import {signal} from "@angular/core";
import {of} from "rxjs";
import {IHashtags, IStateParams} from "../types";
import {vi} from "vitest";

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

    const mockAppState: IStateParams = {
        countries: 'USA,CAN',
        hashtag: 'missingmaps',
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
        interval: 'P1M',
        topics: 'roads,buildings',
        active_topic: 'road'
    };

    beforeEach(async () => {
        mockDataService = {
            metaData: signal(mockMetaData),
            requestCountryStats: vi.fn().mockReturnValue(of(mockHashtags)),
        };
        mockStateService = {
            appState: signal(mockAppState),
            updatePartialState: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [ExportDataComponent],
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
