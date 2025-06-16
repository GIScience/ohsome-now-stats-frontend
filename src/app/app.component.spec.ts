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

});
