import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MapComponent} from './map.component';
import {Overlay} from "../../overlay.component";
import {DataService} from "../../data.service";
import {StateService} from "../../state.service";
import {IHashtags, IStateParams} from "../types";
import {signal} from "@angular/core";
import {of} from "rxjs";

describe('MapComponent', () => {
    let component: MapComponent;
    let fixture: ComponentFixture<MapComponent>;
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
            requestCountryStats: jasmine.createSpy('requestCountryStats').and.returnValue(of(mockHashtags)),
        };
        mockStateService = {
            appState: signal(mockAppState),
            updatePartialState: jasmine.createSpy('updatePartialState')
        };

        await TestBed.configureTestingModule({
            declarations: [MapComponent, Overlay],
            providers: [
                {provide: DataService, useValue: mockDataService},
                {provide: StateService, useValue: mockStateService}
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(MapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
