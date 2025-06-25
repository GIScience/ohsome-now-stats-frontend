import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryMapComponent } from './country-map.component';

describe('CountryMapComponent', () => {
  let component: CountryMapComponent;
  let fixture: ComponentFixture<CountryMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountryMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
