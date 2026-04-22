import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from './toast.service';

let quotaNotified = false;

export const httperrorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.log('error : ', error.error.error);

            if ((error.status === 429 || error.status === 403) && !quotaNotified) {

                if (error.error.error === 'Rate Limit Exceeded') {
                    notifyOnce(() => {
                        toastService.show({
                            title: 'Rate limit exceeded',
                            body: `You have reached your per minute usage limit. Please slow down, 
                            or contact us at ohsome@heigit.org if you would like to explore our <a href="https://account.heigit.org/info/plans" target="_blank">Collaborative plans</a>.`,
                            type: 'error'
                        });
                    });

                }

                if (error.error.error === 'Quota exceeded') {
                    notifyOnce(() => {
                        toastService.show({
                            title: 'Quota exceeded',
                            body: `You have reached your daily usage limit. Please return tomorrow to continue, or contact
                                us at ohsome@heigit.org if you would like to explore our <a href="https://account.heigit.org/info/plans" target="_blank">Collaborative plans</a>.`,
                            type: 'error'
                        });
                    });
                }
            }

            return throwError(() => error);
        })
    );
};

function notifyOnce(fn: () => void) {
    if (quotaNotified) return;
    quotaNotified = true;
    fn();
    setTimeout(() => quotaNotified = false, 5); // 5 secs
}