import {
    ApplicationRef,
    Component,
    EnvironmentInjector,
    EventEmitter,
    Input,
    OnChanges,
    Output
} from '@angular/core';
import * as bootstrap from 'bootstrap';
import {mkConfig, generateCsv, download} from "export-to-csv";

import {StatsType, ISummaryData, TopicDefinitionValue} from '../types';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
    standalone: false
})
export class SummaryComponent implements OnChanges {
    @Input() data!: ISummaryData;
    @Input() topicData!: { [p: string]: number } | null;
    @Input() isSummaryLoading!: boolean;

    @Output() changeCurrentStatsEvent = new EventEmitter<StatsType>();

    currentlySelected = 'users';
    bignumberData: Array<TopicDefinitionValue> = []

    constructor(private injector: EnvironmentInjector, private appRef: ApplicationRef) {
        this.enableTooltips()
    }

    ngOnChanges(): void {
        if (!this.data)
            return

        if (!Object.keys(this.data).includes(this.currentlySelected)) {
            document.getElementById("users")?.click()
        }

        // append this.topicData to this.data
        if(this.topicData)
            this.data = {...this.data, ...this.topicData}
        else
            this.data = {...this.data}
        this.bignumberData = []
        for (const summaryEntry of Object.entries(this.data)) {
            if (['latest', 'hashtag', 'changesets', 'countries', 'startDate', 'endDate'].includes(summaryEntry[0]))
                continue;

            // merge the 'value' with other static data from topicDefinitions
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const id = topicDefinitions[summaryEntry[0]].id
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const tooltip = topicDefinitions[summaryEntry[0]].tooltip
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const icon = topicDefinitions[summaryEntry[0]].icon
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const hex = topicDefinitions[summaryEntry[0]]['color-hex']
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const light = topicDefinitions[summaryEntry[0]]['color-light']
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const yTitle = topicDefinitions[summaryEntry[0]]['y-title']
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const name = topicDefinitions[summaryEntry[0]].name
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.bignumberData.push({
                id: id,
                name: name,
                value: this.formatNumbertoNumberformatString(summaryEntry[1]),
                tooltip: tooltip,
                icon: icon,
                "color-hex": hex,
                "color-light": light,
                "y-title": yTitle,
            })
        }

        // always have "Contributors" as the first object in the array
        this.bignumberData = this.bignumberData.sort((a, b) => {
            if (a.name === "Contributors" || a.name === "Total Edits") {
                return -1;
            } else if (b.name === "Contributors"  || b.name === "Total Edits") {
                return 1;
            } else {
                return 0;
            }
        });

    }

    formatNumbertoNumberformatString(value: number): string {
        return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0
            }
        ).format(value)
    }

    changeSelectedSummaryComponent(e: any) {
        // if nodeName is APP-BIG-NUMBER our actual target is a child - thus not findable with .closest
        const newSelected = e.target.nodeName != "APP-BIG-NUMBER" ? e.target.closest(".big_number") : e.target.children[0].closest(".big_number")
        const siblings = [...newSelected.parentNode.parentNode.children];
        siblings.forEach((e) => e.children[0].children[0].classList.remove("selected"))
        if(newSelected.children)
            newSelected.children[0].classList.add("selected")
    }

    changeCurrentStats(e: any, newCurrentStats: string) {
        this.currentlySelected = newCurrentStats
        this.changeSelectedSummaryComponent(e)
        this.changeCurrentStatsEvent.emit(newCurrentStats as StatsType);
    }

    /**
     * Boostrap need to enable tooltip on every element with its attribute
     */
    enableTooltips(): void {
        // enble tooltip
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        // console.log('tooltipTriggerList =', tooltipTriggerList)
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {trigger: 'hover'}))
    }

    downloadCsv() {
        // Converts your Array<Object> to a CsvOutput string based on the configs
        if (this.data && [this.data].length > 0) {
            // console.log('this.data ', this.data)

            // Extract keys from the input object
            const keys = Object.keys(this.data)
            // Filter out 'startDate' and 'endDate' keys
            const dateKeys = keys.filter((key) => key === 'startDate' || key === 'endDate')
            // Filter out non-date keys
            const otherKeys = keys.filter((key) => key !== 'startDate' && key !== 'endDate')
            // Place the date keys at the start and then the other keys
            const arrangedHeaders = [
                ...dateKeys,
                ...otherKeys
            ]

            const csvConfig = mkConfig({
                filename: `ohsome-now-stats_${this.data['hashtag']}_${this.data['startDate']!.substring(0, 10)}_${this.data['endDate']!.substring(0, 10)}_summary`,
                columnHeaders: arrangedHeaders
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const csv = generateCsv(csvConfig)([this.data]);
            download(csvConfig)(csv)
        }
    }

}
