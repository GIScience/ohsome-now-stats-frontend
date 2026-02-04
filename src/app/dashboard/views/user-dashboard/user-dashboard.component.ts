import {Component, inject} from '@angular/core';
import {StateService} from "../../../../lib/state.service";
import {ExportDataComponent} from '../../export-data/export-data.component';
import {SummaryComponent} from '../../summary/summary.component';
import {UTCToLocalConverterPipe} from "../../query/pipes/utc-to-local-converter.pipe";
import {UserQueryComponent} from "@app/dashboard/query/user-query/user-query.component";

@Component({
    selector: 'app-user-dashboard',
    templateUrl: './user-dashboard.component.html',
    styleUrls: ['./user-dashboard.component.scss'],
    imports: [ExportDataComponent, SummaryComponent, UserQueryComponent],
    providers: [UTCToLocalConverterPipe]
})
export class UserDashboardComponent {
    private stateService = inject(StateService);
    mode: string = '';

    constructor() {
        this.stateService.activePage.subscribe(page => this.mode = page!)
    }
}
