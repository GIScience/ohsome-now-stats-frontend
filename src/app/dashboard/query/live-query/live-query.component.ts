import {Component, OnDestroy} from '@angular/core';
import dayjs from "dayjs";
import {QueryComponent} from "../query.component";
import {FormsModule} from '@angular/forms';
import {AutoComplete} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {NgClass} from '@angular/common';


@Component({
    selector: 'live-query',
    templateUrl: './live-query.component.html',
    styleUrls: ['./live-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, NgClass]
})
export class LiveQueryComponent extends QueryComponent implements OnDestroy {
    liveMode: boolean = false
    refreshIntervalId: number | null = null

    constructor() {
        super()
        this.updateSelectionFromState(this.state());

        // set default values for this mode
        this.selectedDateRange.set(
            [this.ranges()["Last 3 Hours"][0],
                this.ranges()["Last 3 Hours"][1]]
        )
        this.interval.set("PT5M")

        // make the first query with the used default values
        this.updateStateFromSelection()
    }

    ngOnDestroy(): void {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId)
            this.refreshIntervalId = null
            this.dataService.toggleLiveMode(false)
        }
    }

    triggerMetaDataRetrieval() {
        const previousEndDate = this.maxDate()
        this.dataService.requestMetadata().then(
            (metadata) => {
                if (!dayjs(metadata.max_timestamp).isSame(previousEndDate)) {
                    this.selectedDateRange.set([
                        this.ranges()["Last 3 Hours"]![0],
                        this.ranges()["Last 3 Hours"]![1]
                    ]);
                    this.updateStateFromSelection();
                }
            }
        )
    }

    toggleLiveMode() {
        this.liveMode = !this.liveMode
        if (this.liveMode) {
            this.updateStateFromSelection()
            this.triggerMetaDataRetrieval()
            this.refreshIntervalId = setInterval(() => {
                this.triggerMetaDataRetrieval()
            }, 10000) as unknown as number
        } else {
            this.turnOffLiveMode()
        }
        this.dataService.toggleLiveMode(this.liveMode)
    }

    turnOffLiveMode() {
        this.liveMode = false
        this.dataService.toggleLiveMode(false)
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId)
            this.refreshIntervalId = null
        }
    }
}
