import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {DataService} from '../lib/data.service';
import {provideRouter} from "@angular/router";
import {BehaviorSubject, of} from "rxjs";
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {StateService} from "../lib/state.service";
import {AuthService} from "../lib/auth.service";
import {ToastService} from "../lib/toast.service";
import {vi} from "vitest";

describe('AppComponent', () => {
    beforeEach(async () => {
        const dataServiceSpy = {
            liveMode: new BehaviorSubject<boolean>(false).asObservable()
        };
        const stateServiceSpy = {
            activePage: of('dashboard')
        };
        const authServiceSpy = {
            key: vi.fn().mockReturnValue({key: ''})
        };
        const toastServiceSpy = {
            show: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                provideRouter([]),
                {provide: DataService, useValue: dataServiceSpy},
                {provide: StateService, useValue: stateServiceSpy},
                {provide: AuthService, useValue: authServiceSpy},
                {provide: ToastService, useValue: toastServiceSpy}
            ]
        }).compileComponents();
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
