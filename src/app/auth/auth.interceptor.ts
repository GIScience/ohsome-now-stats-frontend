import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { environment } from '@environments/environment'
import { Observable, from, lastValueFrom } from 'rxjs'
import { default as packageInfo } from '../../../package.json'
// import { DatabaseService } from '../database.service'
import { AppwriteService } from './appwrite.service'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    // private databaseService = inject(DatabaseService)
    private appwriteService = inject(AppwriteService)

    private apiKey: string | null = null
    private currentUserId: string | null = null
    private keyLoadPromise: Promise<void> | null = null
    // private apiBaseUrl = environment.climateActionApiUrl
    private authInitPromise: Promise<void> | null = null
    private readonly clientInfo = `${packageInfo.name}/${packageInfo.version}`

    constructor() {
        this.authInitPromise = this.initAuth()

        this.appwriteService._user.subscribe(user => {
            if (user) {
                // Only reload key if user changed
                if (user.$id !== this.currentUserId) {
                    this.currentUserId = user.$id
                    this.loadApiKey()
                }
            } else {
                // Clear on logout
                this.apiKey = null
                this.currentUserId = null
                this.keyLoadPromise = null
                sessionStorage.removeItem('api_key_cache')
            }
        })
    }

    private async initAuth(): Promise<void> {
        try {
            await this.appwriteService.tryToLogin()
            if (this.appwriteService._user.value) {
                await this.loadApiKey()
            }
        } catch (err) {
            console.error('Error initializing auth:', err)
        }
    }

    private async loadApiKey(): Promise<void> {
        if (this.keyLoadPromise) return this.keyLoadPromise

        // Try cache first
        try {
            const cached = JSON.parse(sessionStorage.getItem('api_key_cache') || '{}')
            if (cached.userId === this.currentUserId && cached.key) {
                this.apiKey = cached.key
                return
            }
        } catch {
            // Invalid cache data, continue to fetch
        }

        // Fetch and cache
        // this.keyLoadPromise = (async () => {
        //     try {
        //         const keyInfo = await this.databaseService.getBasicKey()
        //         this.apiKey = keyInfo?.key || null
        //         if (this.apiKey && this.currentUserId) {
        //             sessionStorage.setItem(
        //                 'api_key_cache',
        //                 JSON.stringify({
        //                     userId: this.currentUserId,
        //                     key: this.apiKey
        //                 })
        //             )
        //         }
        //     } catch (_err) {
        //         this.apiKey = null
        //     }
        // })()

        await this.keyLoadPromise
        this.keyLoadPromise = null
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // if (request.url.includes(this.apiBaseUrl)) {
        //     return from(this.processWithAuth(request, next))
        // }

        return next.handle(request)
    }

    private async processWithAuth(request: HttpRequest<unknown>, next: HttpHandler): Promise<HttpEvent<unknown>> {
        if (this.authInitPromise) {
            await this.authInitPromise
            this.authInitPromise = null
        }

        const headers: { [key: string]: string } = {}

        // if (environment.environmentType === 'development') {
        //     headers['X-Client-Info'] = this.clientInfo
        // }

        if (this.appwriteService._user.value && this.apiKey) {
            headers['Authorization'] = this.apiKey
        }

        request = request.clone({
            setHeaders: headers
        })

        return lastValueFrom(next.handle(request))
    }
}
