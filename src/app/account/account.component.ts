import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { Models } from 'appwrite'
import { Subscription } from 'rxjs'
import { environment } from '../../environments/environment'
import { AppwriteService } from '../auth/appwrite.service'

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit, OnDestroy {
    private appwriteService = inject(AppwriteService)

    user: Models.User<Models.Preferences> | null = null
    accountMenuOpen = false
    private userSubscription: Subscription
    private closeTimeout: ReturnType<typeof setTimeout> | null = null
    readonly environment = environment

    constructor() {
        this.userSubscription = this.appwriteService._user.subscribe(user => {
            this.user = user
        })
    }

    async ngOnInit() {
        await this.appwriteService.tryToLogin()
    }

    ngOnDestroy() {
        this.userSubscription.unsubscribe()
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout)
        }
    }

    async onLogin() {
        // const currentUrl = window.location.href;
        // window.location.href = `https://account.heigit.org/login?redirect=${encodeURIComponent(currentUrl)}`;
        await this.appwriteService.tryToLogin()
    }

    async onLogout() {
        await this.appwriteService.tryToLogout()
        this.accountMenuOpen = false
    }

    onSignup() {
        const currentUrl = window.location.href;
        // window.location.href = `https://account.heigit.org/signup?redirect=${encodeURIComponent(currentUrl)}`;
        this.getAppwriteUrl(`/signup?redirect=${encodeURIComponent(currentUrl)}`)
    }

    getAppwriteUrl(path: string): string {
        return this.appwriteService.getAppwriteUrl(path)
    }

    // getRedirectUrl(): string {
    //     return this.appwriteService.getRedirectUrl()
    // }

    loginAsFakeUser() {
        this.appwriteService.loginAsFakeUser()
    }
}
