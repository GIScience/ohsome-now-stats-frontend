import {Component} from '@angular/core';
import {StateService} from "../state.service";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent {
    mode: string = '';

    constructor(stateService: StateService) {
        stateService.activePage.subscribe(page => this.mode = page!)
    }
}
