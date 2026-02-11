import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from "./auth.service";
import {inject} from "@angular/core";

export const userGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router: Router = inject(Router);
    if(authService.isAnon()) {
        router.navigate(['/dashboard']);
        return false;
    }
    return true;
};
