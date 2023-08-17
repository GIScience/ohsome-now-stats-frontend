import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TrendingHashtagsComponent } from './trending-hashtags.component';
import { DataService } from '../../data.service';
import { dashboard } from '../tooltip-data';

describe('TrendingHashtagsComponent', () => {
  let component: TrendingHashtagsComponent;
  let fixture: ComponentFixture<TrendingHashtagsComponent>;
  let routeStub: Partial<ActivatedRoute>;
  let routerStub: Partial<Router>;

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', ['getTrendingHashtags']);

    await TestBed.configureTestingModule({
      declarations: [TrendingHashtagsComponent],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: routerStub }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrendingHashtagsComponent);
    component = fixture.componentInstance;
    component.dashboardTooltips = dashboard; // Set your tooltip data here
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should update URL on clickHashtag', () => {
  //   const hashtag = 'example';
  //   component.clickHashtag(hashtag);
  //   const queryParams = {
  //     start: '2022-08-15T09:01:26.000Z',
  //     end: '2023-08-15T09:01:26.000Z',
  //     interval: '7'
  //   };
  //   expect(routerStub.navigate).toHaveBeenCalledWith([], {
  //     fragment: `hashtags=${hashtag}&start=${queryParams.start}&end=${queryParams.end}&interval=${queryParams.interval}`
  //   });
  // });

  // it('should parse query params from fragments', () => {
  //   const queryParams = component.getQueryParamsFromFragments();
  //   expect(queryParams).toEqual({
  //     hashtags: 'test',
  //     start: '2022-08-15T09:01:26.000Z',
  //     end: '2023-08-15T09:01:26.000Z',
  //     interval: '7'
  //   });
  // });

  it('should clear hashtags on ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(component.hashtags).toEqual([]);
  });
});
