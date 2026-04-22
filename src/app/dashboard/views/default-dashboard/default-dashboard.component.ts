import {Component} from '@angular/core';
import {StateService} from "../../../../lib/state.service";
import {HotQueryComponent} from '../../query/hot-query/hot-query.component';
import {LiveQueryComponent} from '../../query/live-query/live-query.component';
import {DefaultQueryComponent} from '../../query/default-query/default-query.component';
import {TrendingHashtagsComponent} from '../../trending-hashtags/trending-hashtags.component';
import {ExportDataComponent} from '../../export-data/export-data.component';
import {SummaryComponent} from '../../summary/summary.component';
import {PlotComponent} from '../../plot/plot.component';
import {CountryMapComponent} from '../../country-map/country-map.component';
import {HexMapComponent} from '../../hex-map/hex-map.component';
import {UTCToLocalConverterPipe} from "../../query/pipes/utc-to-local-converter.pipe";

@Component({
    selector: 'app-default-dashboard',
    templateUrl: './default-dashboard.component.html',
    styleUrls: ['./default-dashboard.component.scss'],
    imports: [HotQueryComponent, LiveQueryComponent, DefaultQueryComponent, TrendingHashtagsComponent, ExportDataComponent, SummaryComponent, PlotComponent, CountryMapComponent, HexMapComponent],
    providers: [UTCToLocalConverterPipe]
})
export class DefaultDashboardComponent {
    mode: string = '';

    constructor(stateService: StateService) {
        stateService.activePage.subscribe(page => this.mode = page!)
    }
}
