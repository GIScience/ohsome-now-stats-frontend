import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

import {providePrimeNG} from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import {AppComponent} from './app/app.component';
import {routes} from './app/app-routing.module';

import {DataService} from './app/data.service';
import {ToastService} from './app/toast.service';

import {registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import {en_US, provideNzI18n} from 'ng-zorro-antd/i18n';
import {inject, provideAppInitializer} from "@angular/core";
import {firstValueFrom} from "rxjs";

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

        DataService,
        ToastService,

        provideAppInitializer(() => {
            const dataService = inject(DataService);
            return firstValueFrom(dataService.requestMetadata());
        })
    ]
}).catch(err => console.error(err));

