import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

import {providePrimeNG} from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import {AppComponent} from './app/app.component';
import {routes} from './app/app-routing.module';

import {DataService} from './lib/data.service';
import {ToastService} from './lib/toast.service';
import {AuthService} from './lib/auth.service';

import {registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import {en_US, provideNzI18n} from 'ng-zorro-antd/i18n';
import {inject, provideAppInitializer} from "@angular/core";

registerLocaleData(en);

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
        provideAnimationsAsync(),
        provideNzI18n(en_US),

        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: 'none'
                }
            }
        }),
        ToastService,

        provideAppInitializer(() => {
            const dataService = inject(DataService);
            const authService = inject(AuthService);
            console.log("tryToResolve")
            return Promise.all(
                [dataService.requestMetadata(),
                    authService.initializeUser()]
            );
        })
    ]
}).catch(err => console.error(err));

