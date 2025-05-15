import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {DataService} from './data.service';
import {provideRouter, Router} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {Component, NO_ERRORS_SCHEMA} from "@angular/core";


@Component({
    selector: 'app-dashboard',
    template: '<div></div>'
})
class MockDashboardComponent {
}

@Component({
    selector: 'app-dashboard',
    template: '<div></div>'
})
class MockHotosmComponent {
}

describe('AppComponent', () => {
    let component: AppComponent;
    let router: Router;
    let dataService: DataService;

    beforeEach(async () => {
        const dataServiceSpy = jasmine.createSpyObj<DataService>('DataService', [
            'getQueryParamsFromFragments'
        ], {
            // Properties that need to be mocked
            liveMode: new BehaviorSubject<boolean>(false).asObservable()
        });

        await TestBed.configureTestingModule({
            declarations: [AppComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                provideRouter([
                    { path: 'dashboard', component: MockDashboardComponent },
                    { path: 'dashboard/hotosm', component: MockHotosmComponent }
                ]),
                {
                    provide: Router,
                    useValue: {
                        navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true))
                    }
                },
                {
                    provide: DataService,
                    useValue: dataServiceSpy
                }
            ]
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
        fixture.detectChanges();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it(`should have as title 'ohsomeNow Stats'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app.title).toEqual('ohsomeNow Stats');
    });

    describe('redirectTo', () => {
        it('should navigate to dashboard with correct fragment when pageName is "dashboard"', fakeAsync(() => {
            const mockFragmentData = {
                hashtag: 'test-hashtag',
                start: '2023-01-01',
                end: '2023-01-31',
                interval: 'P1D',
                countries: 'US,UK',
                topics: 'health,education'
            };

            (dataService.getQueryParamsFromFragments as jasmine.Spy).and.returnValue(mockFragmentData);
            // dataService.getQueryParamsFromFragments.and.returnValue(mockFragmentData);

            component.redirectTo('dashboard');
            tick(); // Wait for async operations to complete

            const expectedFragment = 'hashtag=test-hashtag&start=2023-01-01&end=2023-01-31&interval=P1D&countries=US,UK&topics=health,education';

            expect(router.navigate).toHaveBeenCalledWith(
                ['/dashboard'],
                {fragment: expectedFragment}
            );
        }));

        it('should navigate to dashboard with fit_to_content when present and pageName is "dashboard"', fakeAsync(() => {
            const mockFragmentData = {
                hashtag: 'test-hashtag',
                start: '2023-01-01',
                end: '2023-01-31',
                interval: 'P1W',
                countries: 'US,UK',
                topics: 'health,education',
                fit_to_content: ''
            };

            (dataService.getQueryParamsFromFragments as jasmine.Spy).and.returnValue(mockFragmentData);

            component.redirectTo('dashboard');
            tick();

            const expectedFragment = 'hashtag=test-hashtag&start=2023-01-01&end=2023-01-31&interval=P1W&countries=US,UK&topics=health,education&fit_to_content=';

            expect(router.navigate).toHaveBeenCalledWith(
                ['/dashboard'],
                {fragment: expectedFragment}
            );
        }));

        it('should navigate to hotosm with correct fragment when pageName is "hotosm"', fakeAsync(() => {
            const mockFragmentData = {
                start: '2023-01-01',
                end: '2023-01-31',
                interval: 'weekly'
            };

            (dataService.getQueryParamsFromFragments as jasmine.Spy).and.returnValue(mockFragmentData);

            component.redirectTo('hotosm');
            tick();

            const expectedFragment = 'start=2023-01-01&end=2023-01-31&interval=weekly';

            expect(router.navigate).toHaveBeenCalledWith(
                ['/dashboard/hotosm'],
                {fragment: expectedFragment}
            );
        }));

        it('should navigate to hotosm with fit_to_content when present and pageName is "hotosm"', fakeAsync(() => {
            const mockFragmentData = {
                start: '2023-01-01',
                end: '2023-01-31',
                interval: 'weekly',
                fit_to_content: ''
            };

            (dataService.getQueryParamsFromFragments as jasmine.Spy).and.returnValue(mockFragmentData);

            component.redirectTo('hotosm');
            tick();

            const expectedFragment = 'start=2023-01-01&end=2023-01-31&interval=weekly&fit_to_content=';

            expect(router.navigate).toHaveBeenCalledWith(
                ['/dashboard/hotosm'],
                {fragment: expectedFragment}
            );
        }));

        // it('should handle empty fragment data gracefully', fakeAsync(() => {
        //     (dataService.getQueryParamsFromFragments as jasmine.Spy).and.returnValue(null);
        //
        //     component.redirectTo('dashboard');
        //     tick();
        //
        //     const expectedFragment = 'hashtag=undefined&start=undefined&end=undefined&interval=undefined&countries=undefined&topics=undefined';
        //
        //     expect(router.navigate).toHaveBeenCalledWith(
        //         ['/dashboard'],
        //         {fragment: expectedFragment}
        //     );
        // }));
    });
});
