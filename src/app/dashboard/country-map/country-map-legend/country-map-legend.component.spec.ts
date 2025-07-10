import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryMapLegendComponent } from './country-map-legend.component';

describe('LegendComponent', () => {
  let component: CountryMapLegendComponent;
  let fixture: ComponentFixture<CountryMapLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryMapLegendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountryMapLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
