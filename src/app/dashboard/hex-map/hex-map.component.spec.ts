import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HexMapComponent } from './hex-map.component';
import {DataService} from "../../data.service";
import {StateService} from "../../state.service";
import {of} from "rxjs";
import {IStateParams} from "../types";
import {Overlay} from "../../overlay.component";

describe('HexMapComponent', () => {
  let component: HexMapComponent;
  let fixture: ComponentFixture<HexMapComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockStateService: jasmine.SpyObj<StateService>;

  const mockQueryParams: IStateParams = {
    hashtag: 'test',
    start: '2023-01-01',
    end: '2023-01-31',
    countries: 'US',
    topics: 'amenity,body_of_water',
    interval: '',
    active_topic: 'building'
  };

  const mockH3Data = `result,hex_cell
0.477,"837ad3fffffffff"
4.575,"83b2d9fffffffff"
-10.693,"8366e3fffffffff"
10.302,"83bcc3fffffffff"
1.007,"832c4cfffffffff"
0,"83399efffffffff"
0.505,"8364b4fffffffff"
2.499,"837a19fffffffff"
0,"83960afffffffff"
9.645,"836609fffffffff"
1.392,"83bc69fffffffff"
0.875,"831869fffffffff"
0,"832081fffffffff"
2.785,"8326d2fffffffff"
2.294,"8320adfffffffff"
18.728,"83b9a6fffffffff"
0,"832742fffffffff"
0,"832535fffffffff"
0,"833800fffffffff"`

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', ['getH3Map']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['appState']);

    await TestBed.configureTestingModule({
      declarations: [HexMapComponent, Overlay],
      providers: [
        {provide: DataService, useValue: dataServiceSpy},
        {provide: StateService, useValue: stateServiceSpy}
      ]
    })
    .compileComponents();

    stateServiceSpy.appState.and.returnValue(mockQueryParams);
    dataServiceSpy.getH3Map.and.returnValue(of([]));

    fixture = TestBed.createComponent(HexMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
