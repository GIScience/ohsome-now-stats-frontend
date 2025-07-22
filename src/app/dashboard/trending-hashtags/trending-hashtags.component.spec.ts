import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import {By} from '@angular/platform-browser';
import {Overlay} from '../../overlay.component';

import {TrendingHashtagsComponent} from './trending-hashtags.component';
import {DataService} from '../../data.service';
import {StateService} from '../../state.service';
import {IHashtag, StatsType} from '../types';

describe('TrendingHashtagsComponent', () => {
    let component: TrendingHashtagsComponent;
    let fixture: ComponentFixture<TrendingHashtagsComponent>;
    let mockDataService: jasmine.SpyObj<DataService>;
    let mockStateService: jasmine.SpyObj<StateService>;

    const mockHashtags: IHashtag[] = [
        {hashtag: 'hashtag1', number_of_users: 100},
        {hashtag: 'hashtag2', number_of_users: 80},
        {hashtag: 'verylonghashtagnamethatexceedstwentycharacters', number_of_users: 60},
        {hashtag: 'hashtag4', number_of_users: 40}
    ];

    const mockState = {
        start: '2023-01-01',
        end: '2023-01-31',
        countries: 'US',
        hashtag: 'test',
        interval: 'P1M',
        topics: '',
        active_topic: 'users' as StatsType,
        fit_to_content: ''
    };

    beforeEach(async () => {
        const dataServiceSpy = jasmine.createSpyObj('DataService', [
            'getTrendingHashtags',
            'getAbortHashtagReqSubject'
        ], {
            trendingHashtagLimit: 10,
            abortHashtagReqSub: jasmine.createSpyObj('Subject', ['next', 'unsubscribe'])
        });

        const stateServiceSpy = jasmine.createSpyObj('StateService', [
            'appState',
            'updatePartialState'
        ]);

        await TestBed.configureTestingModule({
            declarations: [TrendingHashtagsComponent],
            imports: [Overlay],
            providers: [
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TrendingHashtagsComponent);
        component = fixture.componentInstance;
        mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        mockStateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;

        // Setup default mock returns
        mockStateService.appState.and.returnValue(mockState);
        mockDataService.getTrendingHashtags.and.returnValue(of(mockHashtags));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.hashtags).toBeUndefined();
        expect(component.trendingHashtagLimit).toBe(10);
        expect(component.numOfHashtags).toBe(0);
        expect(component.isHashtagsLoading).toBe(false);
        expect(component.dashboardTooltips).toBeDefined();
    });

    describe('component initialization', () => {
        it('should set trendingHashtagLimit from dataService', () => {
            fixture.detectChanges();
            expect(component.trendingHashtagLimit).toBe(mockDataService.trendingHashtagLimit);
        });

        it('should call requestFromAPI on initialization', () => {
            spyOn(component as any, 'requestFromAPI');
            fixture.detectChanges();
            expect((component as any).requestFromAPI).toHaveBeenCalled();
        });
    });

    describe('requestFromAPI', () => {
        it('should call getTrendingHashtags with correct parameters', () => {
            component['requestFromAPI'](mockState);

            expect(mockDataService.getTrendingHashtags).toHaveBeenCalledWith({
                start: mockState.start,
                end: mockState.end,
                limit: mockDataService.trendingHashtagLimit,
                countries: mockState.countries
            });
        });

        it('should process hashtags data correctly', fakeAsync(() => {
            component['requestFromAPI'](mockState);
            tick();

            expect(component.isHashtagsLoading).toBe(false);
            expect(component.hashtags).toEqual(jasmine.any(Array));
            expect(component.numOfHashtags).toBe(mockHashtags.length);
        }));

        it('should sort hashtags in descending order by number_of_users', fakeAsync(() => {
            component['requestFromAPI'](mockState);
            tick();

            expect(component.hashtags[0].number_of_users).toBeGreaterThanOrEqual(
                component.hashtags[1].number_of_users
            );
        }));


        it('should truncate long hashtag titles', fakeAsync(() => {
            component['requestFromAPI'](mockState);
            tick();

            const longHashtag = component.hashtags.find(h => h.hashtag.length > 20);
            if (longHashtag) {
                expect(longHashtag.hashtagTitle).toBe(longHashtag.hashtag.substring(0, 19) + "...");
            }
        }));

        it('should keep short hashtag titles unchanged', fakeAsync(() => {
            component['requestFromAPI'](mockState);
            tick();

            const shortHashtag = component.hashtags.find(h => h.hashtag.length <= 20);
            if (shortHashtag) {
                expect(shortHashtag.hashtagTitle).toBe(shortHashtag.hashtag);
            }
        }));

        it('should calculate percentages correctly', fakeAsync(() => {
            component['requestFromAPI'](mockState);
            tick();

            const topHashtag = component.hashtags[0];
            expect(topHashtag.percent).toBe(100);

            if (component.hashtags.length > 1) {
                const secondHashtag = component.hashtags[1];
                const expectedPercent = secondHashtag.number_of_users / topHashtag.number_of_users * 100;
                expect(secondHashtag.percent).toBe(expectedPercent);
            }
        }));

        it('should handle API errors', () => {
            spyOn(console, 'error');
            mockDataService.getTrendingHashtags.and.returnValue(throwError('API Error'));

            component['requestFromAPI'](mockState);

            expect(console.error).toHaveBeenCalledWith('Error while requesting TRending hashtags data  ', 'API Error');
        });

        it('should handle empty hashtags response', fakeAsync(() => {
            mockDataService.getTrendingHashtags.and.returnValue(of([]));

            component['requestFromAPI'](mockState);
            tick();

            expect(component.hashtags).toEqual([]);
            expect(component.numOfHashtags).toBe(0);
        }));
    });

    describe('clickHashtag', () => {
        it('should update state with selected hashtag', () => {
            const testHashtag = 'testhashtag';

            component.clickHashtag(testHashtag);

            expect(mockStateService.updatePartialState).toHaveBeenCalledWith({
                hashtag: testHashtag
            });
        });
    });


    describe('relevantState computed', () => {
        it('should return correct state properties', () => {
            fixture.detectChanges();
            const relevantState = component['relevantState']();

            expect(relevantState).toEqual({
                start: mockState.start,
                end: mockState.end,
                countries: mockState.countries
            });
        });
    });

    describe('template rendering', () => {
        beforeEach(() => {
            component.hashtags = mockHashtags.map((hashtag, index) => ({
                ...hashtag,
                hashtagTitle: hashtag.hashtag.length > 20 ? hashtag.hashtag.substring(0, 19) + "..." : hashtag.hashtag,
                tooltip: `${hashtag.hashtag} with ${hashtag.number_of_users} distinct users`,
                percent: index === 0 ? 100 : (hashtag.number_of_users / mockHashtags[0].number_of_users * 100)
            }));
            component.numOfHashtags = mockHashtags.length;
            fixture.detectChanges();
        });

        it('should render hashtags when numOfHashtags > 0', () => {
            const hashtagElements = fixture.debugElement.queryAll(By.css('span.clickable'));
            expect(hashtagElements.length).toBe(mockHashtags.length);
        });

        it('should not render hashtags when numOfHashtags = 0', () => {
            component.numOfHashtags = 0;
            fixture.detectChanges();

            const containerElement = fixture.debugElement.query(By.css('.bd.bgc-white'));
            expect(containerElement).toBeFalsy();
        });

        it('should display correct hashtag titles', () => {
            const hashtagElements = fixture.debugElement.queryAll(By.css('span.clickable'));

            hashtagElements.forEach((element, index) => {
                const expectedTitle = component.hashtags[index].hashtagTitle;
                expect(element.nativeElement.textContent.trim()).toContain(expectedTitle);
            });
        });

        it('should set correct width percentages', () => {
            const hashtagElements = fixture.debugElement.queryAll(By.css('span.clickable'));

            hashtagElements.forEach((element, index) => {
                const expectedWidth = component.hashtags[index].percent + '%';
                expect(element.nativeElement.style.width).toBe(expectedWidth);
            });
        });

        it('should set correct tooltips', () => {
            const hashtagElements = fixture.debugElement.queryAll(By.css('span.clickable'));

            hashtagElements.forEach((element, index) => {
                const expectedTooltip = component.hashtags[index].tooltip;
                expect(element.nativeElement.getAttribute('data-bs-title')).toBe(expectedTooltip);
            });
        });

        it('should call clickHashtag when hashtag is clicked', () => {
            spyOn(component, 'clickHashtag');
            const firstHashtagElement = fixture.debugElement.query(By.css('span.clickable'));

            firstHashtagElement.nativeElement.click();

            expect(component.clickHashtag).toHaveBeenCalledWith(component.hashtags[0].hashtag);
        });

        it('should display correct title with number of hashtags', () => {
            const titleElement = fixture.debugElement.query(By.css('#title_trendingHashTags'));
            expect(titleElement.nativeElement.textContent).toContain(`Top ${component.numOfHashtags} most used hashtags`);
        });

        it('should show loading overlay when isHashtagsLoading is true', () => {
            component.isHashtagsLoading = true;
            fixture.detectChanges();

            const overlayElement = fixture.debugElement.query(By.css('overlay'));
            expect(overlayElement).toBeTruthy();
        });
    });

    describe('effect integration', () => {
        it('should react to state changes', () => {
            spyOn(component as any, 'requestFromAPI');

            // Simulate state change
            const newState = {...mockState, start: '2023-02-01'};
            mockStateService.appState.and.returnValue(newState);

            fixture.detectChanges();

            expect((component as any).requestFromAPI).toHaveBeenCalled();
        });
    });
});
