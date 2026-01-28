import {type MockedObject, vi} from "vitest";
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HexMapComponent} from './hex-map.component';
import {DataService} from '../../../lib/data.service';
import {StateService} from '../../../lib/state.service';
import {of} from 'rxjs';
import {Overlay} from '../../overlay.component';

const mockQueryParams = {
    hashtag: 'test',
    start: '2023-01-01',
    end: '2023-01-31',
    countries: 'US',
    topics: 'amenity,body_of_water',
    interval: '',
    active_topic: 'building'
};

const mockH3Data = [
    {result: 1, hex_cell: 'abc'},
    {result: -2, hex_cell: 'def'}
];

describe('HexMapComponent', () => {
    let component: HexMapComponent;
    let fixture: ComponentFixture<HexMapComponent>;
    let mockDataService: MockedObject<DataService>;
    let mockStateService: MockedObject<StateService>;

    beforeEach(async () => {
        const dataServiceSpy = {
            getH3Map: vi.fn().mockName("DataService.getH3Map")
        };
        const stateServiceSpy = {
            appState: vi.fn().mockName("StateService.appState")
        };

        stateServiceSpy.appState.mockReturnValue(mockQueryParams);
        dataServiceSpy.getH3Map.mockReturnValue(of(mockH3Data));

        await TestBed.configureTestingModule({
            imports: [Overlay, HexMapComponent],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HexMapComponent);
        component = fixture.componentInstance;
        // Mock deckContainer
        component.deckContainer = {nativeElement: document.createElement('div')} as any;
        fixture.detectChanges();

        mockDataService = TestBed.inject(DataService) as MockedObject<DataService>;
        mockStateService = TestBed.inject(StateService) as MockedObject<StateService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call initializeDeck on ngOnInit', () => {
        vi.spyOn(component as any, 'initializeDeck');
        component.ngOnInit();
        expect((component as any).initializeDeck).toHaveBeenCalled();
    });

    it('should call deck.finalize on ngOnDestroy if deck exists', () => {
        component.deck = {finalize: vi.fn()} as any;
        component.ngOnDestroy();
        expect(component.deck.finalize).toHaveBeenCalled();
    });

    it('should set selectedTopic from state on construction', () => {
        expect(component.selectedTopic).toBe(mockQueryParams.active_topic);
    });

    it('should call createCountryLayer with correct params in updateLayer', async () => {
        vi.spyOn(component, 'createCountryLayer').mockReturnValue(Promise.resolve({} as any));
        const reqParams = {
            hashtag: 'test',
            start: '2023-01-01',
            end: '2023-01-31',
            countries: '',
            topic: 'building',
            resolution: 3
        };
        await component.updateLayer(reqParams);
        expect(component.createCountryLayer).toHaveBeenCalledWith(expect.objectContaining({
            hashtag: mockQueryParams.hashtag,
            topic: mockQueryParams.active_topic
        }));
    });

    it('should set isH3Loading true while loading and false after in createCountryLayer', async () => {
        mockDataService.getH3Map.mockReturnValue(of(mockH3Data));
        const promise = component['createCountryLayer']({
            hashtag: 'test', start: '', end: '', topic: '', resolution: 3, countries: ''
        });
        expect(component.isH3Loading).toBe(true);
        await promise;
        expect(component.isH3Loading).toBe(false);
    });

    it('should calculate min/max stats from result in createCountryLayer', async () => {
        await component['createCountryLayer']({
            hashtag: 'test', start: '', end: '', topic: '', resolution: 3, countries: ''
        });
        expect(component.minMaxStats.result.max).toBe(1);
        expect(component.minMaxStats.result.min).toBe(-2);
    });

    it('getColorFn should return color array for positive and negative values', () => {
        component.minMaxStats = {result: {min: -2, max: 1}};
        component.selectedTopic = 'building';
        const colorFn = component.getColorFn();
        const pos = colorFn({result: 1} as any);
        const neg = colorFn({result: -2} as any);
        expect(pos.length).toBe(4);
        expect(neg.length).toBe(4);
    });

    it('getTopicUnit should return correct y-title', () => {
        component.selectedTopic = 'building';
        expect(component.getTopicUnit()).toEqual(expect.any(String));
    });

    it('should handle empty data from getH3Map', async () => {
        mockDataService.getH3Map.mockReturnValue(of([]));
        const layer = await component['createCountryLayer']({
            hashtag: 'test', start: '', end: '', topic: '', resolution: 3, countries: ''
        });
        expect(layer).toBeDefined();
    });
});
