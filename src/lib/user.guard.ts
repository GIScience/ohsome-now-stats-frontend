import {CanActivateFn} from '@angular/router';
import {AuthService} from "./auth.service";
import {inject} from "@angular/core";

export const userGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    if(authService.isAnon()) {
        authService.login();
    }
    return true;
};
