import {Component, inject} from '@angular/core';
import {StateService} from "../../../../lib/state.service";
import {ExportDataComponent} from '../../export-data/export-data.component';
import {SummaryComponent} from '../../summary/summary.component';
import {UTCToLocalConverterPipe} from "../../query/pipes/utc-to-local-converter.pipe";
import {UserQueryComponent} from "@app/dashboard/query/user-query/user-query.component";
import {PlotComponent} from "@app/dashboard/plot/plot.component";
import {CountryMapComponent} from "@app/dashboard/country-map/country-map.component";
import {HexMapComponent} from "@app/dashboard/hex-map/hex-map.component";

@Component({
    selector: 'app-user-dashboard',
    templateUrl: './user-dashboard.component.html',
    styleUrls: ['./user-dashboard.component.scss'],
    imports: [ExportDataComponent, SummaryComponent, UserQueryComponent, PlotComponent, CountryMapComponent, HexMapComponent],
    providers: [UTCToLocalConverterPipe]
})
export class UserDashboardComponent {
    private stateService = inject(StateService);
    mode: string = '';

    constructor() {
        this.stateService.activePage.subscribe(page => this.mode = page!)

        // in user-dashboard we don't need to show 'contributor' topic
        const state = this.stateService.appState()
        let topics = state.topics;
        topics = topics.replace(/(^|,)contributor(,|$)/, '$1').replace(/^,|,$/g, '');
        this.stateService.updatePartialState({
            active_topic: 'edit',
            topics: topics
        });
    }
}
