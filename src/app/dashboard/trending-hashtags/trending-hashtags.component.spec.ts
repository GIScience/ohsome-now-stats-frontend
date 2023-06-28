import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendingHashtagsComponent } from './trending-hashtags.component';

describe('TrendingHashtagsComponent', () => {
  let component: TrendingHashtagsComponent;
  let fixture: ComponentFixture<TrendingHashtagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrendingHashtagsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendingHashtagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
