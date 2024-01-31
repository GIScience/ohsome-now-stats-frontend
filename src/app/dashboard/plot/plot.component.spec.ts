import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlotComponent } from './plot.component';
import {Overlay} from "../../overlay.component";
import {UTCToLocalConverterPipe} from "../query/pipes/utc-to-local-converter.pipe";

describe('PlotComponent', () => {
  let component: PlotComponent;
  let fixture: ComponentFixture<PlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlotComponent, Overlay, UTCToLocalConverterPipe ],
      providers:[{ provide: UTCToLocalConverterPipe, useValue: { UTCToLocalConverterPipe: () => { } } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
