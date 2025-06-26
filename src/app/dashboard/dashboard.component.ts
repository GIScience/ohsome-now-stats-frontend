import {Component, inject} from '@angular/core';
import {filter} from "rxjs";
import {NavigationEnd, Router} from "@angular/router";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent {
    mode: string;
    router = inject(Router);

    constructor() {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((_) => {
            this.mode = this.getLastUrlRoute()!
        });
        this.mode = this.getLastUrlRoute()!
    }

    getLastUrlRoute() {
        return this.router.url.split('#')[0].split('/').pop()
    }
}
