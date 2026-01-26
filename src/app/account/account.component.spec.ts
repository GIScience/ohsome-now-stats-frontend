import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { Models } from 'appwrite'
import { BehaviorSubject } from 'rxjs'
import { AppwriteService } from '../auth/appwrite.service'
import { DashboardService } from '../dashboard/dashboard.service'
import { TourEngine } from '../dashboard/walkthrough/tour-engine.service'
import { AccountComponent } from './account.component'

describe('AccountComponent', () => {
    let component: AccountComponent
    let fixture: ComponentFixture<AccountComponent>
    let appwriteService: Partial<AppwriteService>
    let dashboardService: Partial<DashboardService>
    let tourEngine: Partial<TourEngine>
    let userSubject: BehaviorSubject<Models.User<Models.Preferences> | null>

    const mockUser: Models.User<Models.Preferences> = {
        $id: '123',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        name: 'Test User',
        email: 'test@example.com',
        emailVerification: true,
        labels: ['signupCompleted'],
        prefs: {}
    } as Models.User<Models.Preferences>

    beforeEach(async () => {
        userSubject = new BehaviorSubject<Models.User<Models.Preferences> | null>(null)
        appwriteService = {
            _user: userSubject,
            tryToLogin: jest.fn().mockResolvedValue(true),
            tryToLogout: jest.fn().mockResolvedValue(undefined),
            getAppwriteUrl: jest.fn().mockReturnValue('https://example.com'),
            getRedirectUrl: jest.fn().mockReturnValue('https://example.com'),
            loginAsFakeUser: jest.fn().mockResolvedValue(undefined)
        }

        dashboardService = {
            clearDashboardState: jest.fn()
        }

        tourEngine = {
            initializeTour: jest.fn()
        }

        await TestBed.configureTestingModule({
            imports: [
                AccountComponent,
                TranslocoTestingModule.forRoot({ langs: { en: {}, de: {} }, translocoConfig: { defaultLang: 'en' } })
            ],
            providers: [
                { provide: AppwriteService, useValue: appwriteService },
                { provide: DashboardService, useValue: dashboardService },
                { provide: TourEngine, useValue: tourEngine }
            ]
        }).compileComponents()

        fixture = TestBed.createComponent(AccountComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should update user when service emits new user', () => {
        userSubject.next(mockUser)
        expect(component.user).toEqual(mockUser)
    })

    it('should call tryToLogin on init', async () => {
        await component.ngOnInit()
        expect(appwriteService.tryToLogin).toHaveBeenCalled()
    })

    it('should call tryToLogout when logout is called', async () => {
        await component.logout()
        expect(appwriteService.tryToLogout).toHaveBeenCalled()
    })

    it('should unsubscribe from user subscription on destroy', () => {
        const spy = jest.spyOn(component['userSubscription'], 'unsubscribe')
        component.ngOnDestroy()
        expect(spy).toHaveBeenCalled()
    })
})
