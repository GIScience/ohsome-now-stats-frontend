import { TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { environment } from '@environments/environment'
import { Account, Models } from 'appwrite'
import { AppwriteService } from './appwrite.service'

jest.mock('@environments/environment', () => ({
    environment: {
        production: false,
        appwriteEndpoint: 'mock-endpoint',
        appwriteProjectId: 'mock-project-id'
    }
}))

const originalConsoleError = console.error
const originalConsoleWarn = console.warn
beforeAll(() => {
    console.error = jest.fn()
    console.warn = jest.fn()
})

afterAll(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
})

type MockAccount = Partial<Account> & {
    get: jest.Mock
    deleteSession: jest.Mock
}

jest.mock('appwrite', () => ({
    Account: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        deleteSession: jest.fn()
    })),
    Client: jest.fn().mockImplementation(() => ({
        setEndpoint: jest.fn().mockReturnThis(),
        setProject: jest.fn().mockReturnThis()
    })),
    Databases: jest.fn().mockImplementation(() => ({
        listDocuments: jest.fn().mockResolvedValue({ documents: [] }),
        createDocument: jest.fn().mockResolvedValue({ $id: 'mock-document-id' }),
        updateDocument: jest.fn().mockResolvedValue({})
    })),
    ID: {
        unique: jest.fn().mockReturnValue('unique-mock-id')
    },
    Permission: {
        read: jest.fn().mockReturnValue('read-permission'),
        update: jest.fn().mockReturnValue('update-permission')
    },
    Role: {
        user: jest.fn().mockReturnValue('user-role')
    },
    Query: {
        equal: jest.fn().mockReturnValue('mock-equal-query')
    }
}))

describe('AppwriteService', () => {
    let service: AppwriteService

    const mockUser = {
        $id: '123',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        name: 'Test User',
        email: 'test@example.com',
        emailVerification: true,
        labels: ['signupCompleted'],
        prefs: {},
        targets: [],
        registration: new Date().toISOString(),
        status: true,
        passwordUpdate: new Date().toISOString(),
        phone: '',
        phoneVerification: false,
        mfa: false,
        accessedAt: new Date().toISOString()
    } as unknown as Models.User<Models.Preferences>

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NoopAnimationsModule]
        })
        service = TestBed.inject(AppwriteService)
    })

    describe('tryToLogin', () => {
        it('should set user when login is successful', async () => {
            const mockAccount = service['account'] as MockAccount
            mockAccount.get.mockResolvedValue(mockUser)

            const result = await service.tryToLogin()

            expect(result).toBe(true)
            service._user.subscribe(user => {
                expect(user).toEqual(mockUser)
            })
        })

        it('should handle failed login', async () => {
            const mockAccount = service['account'] as MockAccount
            mockAccount.get.mockRejectedValue(new Error('Failed to login'))

            const originalEnvironmentType = environment.environmentType
            environment.environmentType = 'production'

            const result = await service.tryToLogin()

            environment.environmentType = originalEnvironmentType

            expect(result).toBe(false)
            service._user.subscribe(user => {
                expect(user).toBeNull()
            })
        })
    })

    describe('tryToLogout', () => {
        it('should clear user on successful logout', async () => {
            const mockAccount = service['account'] as MockAccount
            mockAccount.deleteSession.mockResolvedValue({})

            await service.tryToLogout()

            service._user.subscribe(user => {
                expect(user).toBeNull()
            })
        })

        it('should clear user even if logout fails', async () => {
            const mockAccount = service['account'] as MockAccount
            mockAccount.deleteSession.mockRejectedValue(new Error('Failed to logout'))

            await service.tryToLogout()

            service._user.subscribe(user => {
                expect(user).toBeNull()
            })
            expect(console.error).toHaveBeenCalledWith('Error deleting session:', expect.any(Error))
        })
    })

    describe('getDatabases', () => {
        it('should return the databases instance', () => {
            const databases = service.getDatabases()
            expect(databases).toBeDefined()
        })
    })
})
