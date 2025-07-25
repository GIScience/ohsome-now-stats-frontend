import {Component, OnDestroy} from '@angular/core';
import dayjs, {Dayjs} from "dayjs";
import {QueryComponent} from "../query.component";


@Component({
    selector: 'live-query',
    templateUrl: './live-query.component.html',
    styleUrls: ['./live-query.component.scss'],
    standalone: false
})
export class LiveQueryComponent extends QueryComponent implements OnDestroy {
    liveMode: boolean = false
    refreshIntervalId: number | null = null

    constructor() {
        super()
        this.updateSelectionFromState(this.state());

        // set default values for this mode
        this.selectedDateRange = {
            start: this.ranges()["Last 3 Hours"][0] as Dayjs,
            end: this.ranges()["Last 3 Hours"][1] as Dayjs
        }
        this.interval = "PT5M"

        // make the first query with the used default values
        this.updateStateFromSelection()
    }

    ngOnDestroy(): void {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId)
            this.refreshIntervalId = null
        }
    }

    triggerMetaDataRetrieval() {
        const previousEndDate = this.maxDate()
        this.dataService.requestMetadata().subscribe(
            (metadata) => {
                if (!dayjs(metadata.max_timestamp).isSame(previousEndDate)) {
                    this.selectedDateRange = {
                        start: (this.ranges()["Last 3 Hours"][0] as Dayjs),
                        end: (this.ranges()["Last 3 Hours"][1] as Dayjs)
                    }
                    this.updateStateFromSelection()
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
