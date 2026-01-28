import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {DataService} from '../lib/data.service';
import {provideRouter, Router} from "@angular/router";
import {BehaviorSubject, of} from "rxjs";
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {StateService} from "../lib/state.service";
import {vi} from "vitest";

describe('AppComponent', () => {
    let component: AppComponent;

    beforeEach(async () => {
        const dataServiceSpy = {
            // Properties that need to be mocked
            liveMode: new BehaviorSubject<boolean>(false).asObservable()
        };

        await TestBed.configureTestingModule({
            declarations: [AppComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                provideRouter([]),
                {
                    provide: Router,
                    useValue: {
                        navigate: vi.fn().mockReturnValue(Promise.resolve(true))
                    }
                },
                {
                    provide: DataService,
                    useValue: dataServiceSpy
                },
                {
                    provide: StateService,
                    useValue: {activePage: of(null)}
                }
            ]
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
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
