import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlotComponent } from './plot.component';
import {Overlay} from "../../overlay.component";

describe('PlotComponent', () => {
  let component: PlotComponent;
  let fixture: ComponentFixture<PlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlotComponent, Overlay ]
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
