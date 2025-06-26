import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HexMapComponent } from './hex-map.component';
import { DataService } from '../../data.service';
import { StateService } from '../../state.service';
import { of } from 'rxjs';
import { Overlay } from '../../overlay.component';

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
  { result: 1, hex_cell: 'abc' },
  { result: -2, hex_cell: 'def' }
];

describe('HexMapComponent', () => {
  let component: HexMapComponent;
  let fixture: ComponentFixture<HexMapComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockStateService: jasmine.SpyObj<StateService>;

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', ['getH3Map']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['appState']);

    stateServiceSpy.appState.and.returnValue(mockQueryParams);
    dataServiceSpy.getH3Map.and.returnValue(of(mockH3Data));

    await TestBed.configureTestingModule({
      declarations: [HexMapComponent, Overlay],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HexMapComponent);
    component = fixture.componentInstance;
    // Mock deckContainer
    component.deckContainer = { nativeElement: document.createElement('div') } as any;
    fixture.detectChanges();

    mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call initializeDeck on ngOnInit', () => {
    spyOn(component as any, 'initializeDeck');
    component.ngOnInit();
    expect((component as any).initializeDeck).toHaveBeenCalled();
  });

  it('should call deck.finalize on ngOnDestroy if deck exists', () => {
    component.deck = { finalize: jasmine.createSpy('finalize') } as any;
    component.ngOnDestroy();
    expect(component.deck.finalize).toHaveBeenCalled();
  });

  it('should set selectedTopic from state on construction', () => {
    expect(component.selectedTopic).toBe(mockQueryParams.active_topic);
  });

  it('should call createCountryLayer with correct params in updateLayer', async () => {
    spyOn(component, 'createCountryLayer').and.returnValue(Promise.resolve({} as any));
    await component.updateLayer();
    expect(component.createCountryLayer).toHaveBeenCalledWith(jasmine.objectContaining({
      hashtag: mockQueryParams.hashtag,
      topic: mockQueryParams.active_topic
    }));
  });

  it('should set isH3Loading true while loading and false after in createCountryLayer', async () => {
    mockDataService.getH3Map.and.returnValue(of(mockH3Data));
    const promise = component['createCountryLayer']({
      hashtag: 'test', start: '', end: '', topic: '', resolution: 3, countries: ''
    });
    expect(component.isH3Loading).toBeTrue();
    await promise;
    expect(component.isH3Loading).toBeFalse();
  });

  it('should calculate min/max stats from result in createCountryLayer', async () => {
    await component['createCountryLayer']({
      hashtag: 'test', start: '', end: '', topic: '', resolution: 3, countries: ''
    });
    expect(component.minMaxStats.result.max).toBe(1);
    expect(component.minMaxStats.result.min).toBe(-2);
  });

  it('getColorFn should return color array for positive and negative values', () => {
    component.minMaxStats = { result: { min: -2, max: 1 } };
    component.selectedTopic = 'building';
    const colorFn = component.getColorFn();
    const pos = colorFn({ result: 1 } as any);
    const neg = colorFn({ result: -2 } as any);
    expect(pos.length).toBe(4);
    expect(neg.length).toBe(4);
  });

  it('getTopicUnit should return correct y-title', () => {
    component.selectedTopic = 'building';
    expect(component.getTopicUnit()).toEqual(jasmine.any(String));
  });

  it('should handle empty data from getH3Map', async () => {
    mockDataService.getH3Map.and.returnValue(of([]));
    const layer = await component['createCountryLayer']({
      hashtag: 'test', start: '', end: '', topic: '', resolution: 3, countries: ''
    });
    expect(layer).toBeDefined();
  });
});