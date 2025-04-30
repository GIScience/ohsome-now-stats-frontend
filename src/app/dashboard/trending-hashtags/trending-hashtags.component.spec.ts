import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TrendingHashtagsComponent } from './trending-hashtags.component';
import { DataService } from '../../data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IHashtag } from '../types';

describe('TrendingHashtagsComponent', () => {
  let component: TrendingHashtagsComponent;
  let fixture: ComponentFixture<TrendingHashtagsComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockHashtags: IHashtag[] = [
    {
      hashtag: 'missingmaps',
      number_of_users: 1000,
      hashtagTitle: 'missingmaps',
      tooltip: 'missingmaps',
      percent: 0
    },
    {
      hashtag: 'adt',
      number_of_users: 800,
      hashtagTitle: 'adt',
      tooltip: 'adt',
      percent: 0
    },
    {
      hashtag: 'hot-osm-12345',
      number_of_users: 500,
      hashtagTitle: 'hot-osm-12345',
      tooltip: 'hot-osm-12345',
      percent: 0
    },
    {
      hashtag: 'verylonghashtagthatneedstobetruncated',
      number_of_users: 500,
      hashtagTitle: 'verylonghashtagthatneedstobetruncated',
      tooltip: 'verylonghashtagthatneedstobetruncated',
      percent: 0
    }
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['updateURL']);
    mockDataService.trendingHashtagLimit = 5;
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        fragment: 'interval=P1D&start=2023-01-01T00:00:00Z&end=2023-01-07T00:00:00Z&countries=&topics='
      }
    };

    await TestBed.configureTestingModule({
      declarations: [TrendingHashtagsComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrendingHashtagsComponent);
    component = fixture.componentInstance;
    component.hashtags = [...mockHashtags];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.trendingHashtagLimit).toBe(5);
    expect(component.dashboardTooltips).toBeDefined();
  });

  describe('ngOnChanges', () => {
    it('should process hashtags when input changes', () => {
      component.ngOnChanges();

      expect(component.numOfHashtags).toBe(4);
      expect(component.hashtags[0].hashtag).toBe('missingmaps'); // Should be sorted
      expect(component.hashtags[0].percent).toBe(100); // First item should have 100%
      expect(component.hashtags[1].percent).toBe(80); // 800/1000 = 80%

      // Check tooltip generation
      expect(component.hashtags[0].tooltip).toBe('missingmaps with 1000 distinct users');

      // Check long hashtag truncation
      expect(component.hashtags[3].hashtagTitle).toBe('verylonghashtagthat...');
    });

    it('should handle empty hashtags array', () => {
      component.hashtags = [];
      component.ngOnChanges();

      expect(component.numOfHashtags).toBe(0);
    });
  });

  describe('clickHashtag', () => {
    it('should call updateURL with correct parameters', () => {
      const hashtag = 'missingmaps';
      component.clickHashtag(hashtag);

      expect(mockDataService.updateURL).toHaveBeenCalledWith({
        hashtag: 'missingmaps',
        interval: 'P1D',
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-07T00:00:00Z',
        countries: '' as never,
        topics: '' as never
      });
    });

  });

  describe('getQueryParamsFromFragments', () => {
    it('should parse URL fragment into query params object', () => {
      const params = component.getQueryParamsFromFragments();

      expect(params).toEqual({
        interval: 'P1D',
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-07T00:00:00Z',
        countries: '' as never,
        topics: '' as never
      });
    });

    it('should return null for empty fragment', () => {
      mockActivatedRoute.snapshot.fragment = '';
      expect(component.getQueryParamsFromFragments()).toBeNull();
    });
  });

  describe('enableTooltips', () => {
    it('should be called after ngOnChanges', fakeAsync(() => {
      spyOn(component, 'enableTooltips');
      component.ngOnChanges();
      tick(300);
      expect(component.enableTooltips).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should clear hashtags array', () => {
      component.ngOnDestroy();
      expect(component.hashtags).toEqual([]);
    });
  });
});