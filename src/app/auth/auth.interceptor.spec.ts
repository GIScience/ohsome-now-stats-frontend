import { HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { environment } from '@environments/environment'
import { jest } from '@jest/globals'
import { Models } from 'appwrite'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { BasicKeyInfo, DatabaseService } from '../database.service'
import { AppwriteService } from './appwrite.service'
import { AuthInterceptor } from './auth.interceptor'

describe('AuthInterceptor', () => {
    let interceptor: AuthInterceptor
    let mockAppwriteService: Partial<AppwriteService>
    let mockDatabaseService: Partial<DatabaseService>
    let mockHttpHandler: HttpHandler
    let mockUserSubject: BehaviorSubject<Models.User<Models.Preferences> | null>
    let mockHandleFunction: jest.Mock

    const mockUser = {
        $id: 'test-user-id',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        name: 'Test User',
        email: 'test@example.com',
        emailVerification: true
    } as unknown as Models.User<Models.Preferences>

    const mockKeyInfo: BasicKeyInfo = {
        $id: 'test-key-id',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: [],
        $collectionId: 'basic_keys',
        $databaseId: 'tyk_integration',
        $sequence: 0,
        hash: 'test-hash',
        tyk_user_id: 'test-tyk-user-id',
        ors_policy: 'test-policy',
        policy_upgrade_requests: [],
        key: 'test-api-key'
    }

    beforeEach(() => {
        mockUserSubject = new BehaviorSubject<Models.User<Models.Preferences> | null>(null)
        mockHandleFunction = jest.fn().mockReturnValue(of(new HttpResponse<unknown>()))

        mockAppwriteService = {
            _user: mockUserSubject,
            tryToLogin: () => Promise.resolve(true)
        }

        mockDatabaseService = {
            getBasicKey: () => Promise.resolve(mockKeyInfo)
        }

        mockHttpHandler = {
            handle: (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
                return mockHandleFunction(req) as Observable<HttpEvent<unknown>>
            }
        }

        jest.spyOn(mockAppwriteService, 'tryToLogin')
        jest.spyOn(mockDatabaseService, 'getBasicKey')

        TestBed.configureTestingModule({
            providers: [
                AuthInterceptor,
                { provide: AppwriteService, useValue: mockAppwriteService },
                { provide: DatabaseService, useValue: mockDatabaseService }
            ]
        })

        interceptor = TestBed.inject(AuthInterceptor)
    })

    it('should attempt to login on initialization', () => {
        expect(mockAppwriteService.tryToLogin).toHaveBeenCalled()
    })

    describe('intercept', () => {
        it('should not add auth header for non-API requests', done => {
            const request = new HttpRequest('GET', 'https://example.com')

            interceptor.intercept(request, mockHttpHandler).subscribe(() => {
                expect(mockHandleFunction).toHaveBeenCalledWith(request)
                done()
            })
        })

        it('should add auth header for API requests when user is logged in', done => {
            mockUserSubject.next(mockUser)

            const apiUrl = environment.climateActionApiUrl + '/endpoint'
            const request = new HttpRequest('GET', apiUrl)

            setTimeout(() => {
                interceptor.intercept(request, mockHttpHandler).subscribe(() => {
                    expect(mockHandleFunction).toHaveBeenCalled()

                    const lastCall = mockHandleFunction.mock.calls[mockHandleFunction.mock.calls.length - 1]
                    const requestWithAuth = lastCall[0] as HttpRequest<unknown>
                    const authHeader = requestWithAuth.headers.get('Authorization')
                    expect(authHeader).toBe(mockKeyInfo.key)

                    done()
                })
            }, 100)
        })

        it('should not add auth header when user is not logged in', done => {
            mockUserSubject.next(null)

            const apiUrl = environment.climateActionApiUrl + '/endpoint'
            const request = new HttpRequest('GET', apiUrl)

            interceptor.intercept(request, mockHttpHandler).subscribe(() => {
                const lastCall = mockHandleFunction.mock.calls[mockHandleFunction.mock.calls.length - 1]
                const requestWithoutAuth = lastCall[0] as HttpRequest<unknown>
                expect(requestWithoutAuth.headers.has('Authorization')).toBeFalsy()
                done()
            })
        })

        it('should handle errors when fetching API key', done => {
            mockUserSubject.next(mockUser)

            jest.spyOn(mockDatabaseService, 'getBasicKey').mockImplementation(() => {
                return Promise.reject(new Error('Key fetch error'))
            })

            const apiUrl = environment.climateActionApiUrl + '/endpoint'
            const request = new HttpRequest('GET', apiUrl)

            interceptor.intercept(request, mockHttpHandler).subscribe(() => {
                const lastCall = mockHandleFunction.mock.calls[mockHandleFunction.mock.calls.length - 1]
                const requestWithoutAuth = lastCall[0] as HttpRequest<unknown>
                expect(requestWithoutAuth.headers.has('Authorization')).toBeFalsy()
                done()
            })
        })
    })

    describe('auth state management', () => {
        it('should update API key when user state changes', done => {
            mockUserSubject.next(null)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const loadApiKeySpy = jest.spyOn(interceptor as any, 'loadApiKey')

            mockUserSubject.next(mockUser)

            expect(loadApiKeySpy).toHaveBeenCalled()
            done()
        })

        it('should clear API key when user logs out', done => {
            mockUserSubject.next(mockUser)

            setTimeout(() => {
                mockUserSubject.next(null)

                const apiUrl = environment.climateActionApiUrl + '/endpoint'
                const request = new HttpRequest('GET', apiUrl)

                interceptor.intercept(request, mockHttpHandler).subscribe(() => {
                    const lastCall = mockHandleFunction.mock.calls[mockHandleFunction.mock.calls.length - 1]
                    const requestWithoutAuth = lastCall[0] as HttpRequest<unknown>
                    expect(requestWithoutAuth.headers.has('Authorization')).toBeFalsy()
                    done()
                })
            }, 100)
        })
    })
})
