import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { DataService } from '../data.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dataService: DataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [DashboardComponent],
      providers: [DataService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    fixture.detectChanges();
  });

  it('should not navigate or make API requests if route.data is empty', () => {
    spyOn(component.router, 'navigate');
    spyOn(dataService, 'requestSummary');
    spyOn(dataService, 'requestPlot');
    spyOn(dataService, 'getTrendingHashtags');

    component.route.data.next(null);
    component.route.fragment.next(null);

    expect(component.router.navigate).not.toHaveBeenCalled();
    expect(dataService.requestSummary).not.toHaveBeenCalled();
    expect(dataService.requestPlot).not.toHaveBeenCalled();
    expect(dataService.getTrendingHashtags).not.toHaveBeenCalled();
  });

  it('should navigate and make API requests with queryParams from route.data and empty fragment', () => {
    spyOn(component.router, 'navigate');
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot').and.returnValue(of({ result: [] }));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const data = { hashtags: 'tag1,tag2', start: '2023-01-01', end: '2023-01-31', interval: 'monthly' };
    component.route.data.next(data);
    component.route.fragment.next(null);

    expect(component.router.navigate).toHaveBeenCalledWith([], {
      fragment: `hashtags=${data.hashtags}&start=${data.start}&end=${data.end}&interval=${data.interval}`
    });
    expect(dataService.requestSummary).toHaveBeenCalledWith(data);
    expect(dataService.requestPlot).toHaveBeenCalledWith(data);
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should make API requests with queryParams from fragment and populate summaryData and hashtagsData', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot').and.returnValue(of({ result: [] }));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const fragment = 'hashtags=tag1,tag2&start=2023-01-01&end=2023-01-31&interval=monthly';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly'
    });
    expect(dataService.requestPlot).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly'
    });
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should handle invalid queryParams from fragment', () => {
    spyOn(dataService, 'requestSummary');
    spyOn(dataService, 'requestPlot');
    spyOn(dataService, 'getTrendingHashtags');

    const fragment = 'hashtags=tag1,tag2&start=invalid-date&end=2023-01-31&interval=monthly';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).not.toHaveBeenCalled();
    expect(dataService.requestPlot).not.toHaveBeenCalled();
    expect(dataService.getTrendingHashtags).not.toHaveBeenCalled();
    expect(component.summaryData).toBeUndefined();
    expect(component.hashtagsData).toBeUndefined();
  });

  it('should handle missing keys in queryParams from fragment', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot');
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const fragment = 'start=2023-01-01&end=2023-01-31';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31'
    });
    expect(dataService.requestPlot).not.toHaveBeenCalled();
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should handle additional keys in queryParams from fragment', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(of({ buildings: [], users: [], changesets: [], roads: [] }));
    spyOn(dataService, 'requestPlot').and.returnValue(of({ result: [] }));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(of({ result: [] }));

    const fragment = 'hashtags=tag1,tag2&start=2023-01-01&end=2023-01-31&interval=monthly&extraKey=value';
    component.route.fragment.next(fragment);

    expect(dataService.requestSummary).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly',
      extraKey: 'value'
    });
    expect(dataService.requestPlot).toHaveBeenCalledWith({
      hashtags: 'tag1,tag2',
      start: '2023-01-01',
      end: '2023-01-31',
      interval: 'monthly',
      extraKey: 'value'
    });
    expect(dataService.getTrendingHashtags).toHaveBeenCalledWith({
      start: '2023-01-01',
      end: '2023-01-31',
      limit: dataService.trendingHashtagLimit
    });
    expect(component.summaryData).toEqual({
      buildingEdits: 0,
      contributors: 0,
      edits: 0,
      kmOfRoads: 0
    });
    expect(component.hashtagsData).toEqual([]);
  });

  it('should handle API request errors', () => {
    spyOn(dataService, 'requestSummary').and.returnValue(throwError('Error requesting summary'));
    spyOn(dataService, 'requestPlot').and.returnValue(throwError('Error requesting plot'));
    spyOn(dataService, 'getTrendingHashtags').and.returnValue(throwError('Error requesting trending hashtags'));

    const fragment = 'hashtags=tag1,tag2&start=2023-01-01&end=2023-01-31&interval=monthly';
    component.route.fragment.next(fragment);

    expect(component.summaryData).toBeUndefined();
    expect(component.hashtagsData).toBeUndefined();
    // You can also test error handling behavior, such as displaying an error message on the component.
  });
});
