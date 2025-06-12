import {Component, computed, effect, EventEmitter, OnDestroy, Output} from '@angular/core';
import * as bootstrap from 'bootstrap';
import {download, generateCsv, mkConfig} from "export-to-csv";

import {
    IQueryParam,
    ISummaryData,
    IWrappedSummaryData,
    IWrappedTopicData,
    StatsType,
    TopicDefinitionValue,
    TopicValues
} from '../types';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {DataService} from "../../data.service";
import {forkJoin, Observable, Subscription} from "rxjs";
import {StateService} from "../../state.service";

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
    standalone: false
})
export class SummaryComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    currentlySelected = 'users';
    bignumberData: Array<TopicDefinitionValue> = [];
    private data!: ISummaryData;
    isSummaryLoading: boolean = false;
    private topicData: { [p: string]: number } | null = null;
    state = computed(() => this.stateService.appState());
    private relevantState = computed(() => {
            return this.state()
        }, {
            equal: (a, b) => {
                return a.hashtag === b.hashtag
                    && a.start === b.start
                    && a.end === b.end
                    && a.countries === b.countries
                    // && a.interval === b.interval // summary doesnt need to reflect on intervals
                    && a.topics === b.topics
            }
        });

    constructor(
            private stateService: StateService,
            private dataService: DataService
    ) {
        this.enableTooltips()
        effect(() => {
            this.requestFromAPI(this.relevantState())
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe()
    }

    requestFromAPI(queryParams: IQueryParam) {
        this.isSummaryLoading = true
        if (queryParams['topics']) {
            // if topics are requested then wait for both the observable
            forkJoin({
                summary: this.dataService.requestSummary(queryParams) as Observable<IWrappedSummaryData>,
                topic: this.dataService.requestTopic(queryParams) as Observable<IWrappedTopicData>
            }).subscribe({
                next: (responses) => {
                    // Handle summary response
                    const tempSummaryData = responses.summary.result;

                    this.data = {
                        changesets: tempSummaryData.changesets,
                        buildings: tempSummaryData.buildings,
                        users: tempSummaryData.users,
                        edits: tempSummaryData.edits,
                        roads: tempSummaryData.roads,
                        latest: tempSummaryData.latest,
                        hashtag: queryParams.hashtag,
                        startDate: queryParams.start,
                        endDate: queryParams.end
                    };

                    if (queryParams.countries !== '') {
                        this.data['countries'] = queryParams.countries;
                    }

                    // Handle topic response
                    const input: { [key: string]: TopicValues } = responses.topic.result;
                    const topicValue: { [key: string]: number } = {};

                    for (const key in input) {
                        if (Object.prototype.hasOwnProperty.call(input, key)) {
                            topicValue[key] = input[key].value;
                        }
                    }

                    this.topicData = { ...topicValue }

                    this.updateBigNumber();
                },
                error: (err) => {
                    console.error('Error while requesting data: ', err)
                }
            });
        } else {
            // Only summary request needed
            this.dataService.requestSummary(queryParams).subscribe({
                next: (res: IWrappedSummaryData) => {
                    const tempSummaryData = res.result;

                    this.data = {
                        changesets: tempSummaryData.changesets,
                        buildings: tempSummaryData.buildings,
                        users: tempSummaryData.users,
                        edits: tempSummaryData.edits,
                        roads: tempSummaryData.roads,
                        latest: tempSummaryData.latest,
                        hashtag: queryParams.hashtag,
                        startDate: queryParams.start,
                        endDate: queryParams.end
                    };

                    if (queryParams.countries !== '') {
                        this.data['countries'] = queryParams.countries;
                    }

                    this.topicData = null;

                    this.updateBigNumber()
                },
                error: (err) => {
                    console.error('Error while requesting Summary data ', err)
                }
            });
        }
    }

    updateBigNumber(): void {
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

        // remove the loading mask
        this.isSummaryLoading = false;
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

    changeSelectedSummaryComponent(e: MouseEvent) {
        // if nodeName is APP-BIG-NUMBER our actual target is a child - thus not findable with .closest
        const target = e.target as HTMLElement;
        if (!target) return;

        const newSelected = target.nodeName !== "APP-BIG-NUMBER"
            ? target.closest(".big_number") as HTMLElement
            : (target.children[0] as HTMLElement)?.closest(".big_number") as HTMLElement;

        if (!newSelected) return;

        const parentNode = newSelected.parentNode?.parentNode;
        if (!parentNode) return;

        const siblings = Array.from(newSelected.parentNode!.parentNode!.children) as HTMLElement[];
        siblings.forEach((element) => {
            const firstChild = element.children[0] as HTMLElement;
            const secondChild = firstChild?.children[0] as HTMLElement;
            secondChild?.classList.remove("selected");
        });

        const firstChild = newSelected.children[0] as HTMLElement;
        firstChild?.classList.add("selected");
    }

    changeSelectedBigNumber(e: MouseEvent, newCurrentStats: string) {
        this.currentlySelected = newCurrentStats
        this.changeSelectedSummaryComponent(e)
        // this.changeCurrentStatsEvent.emit(newCurrentStats as StatsType);
        // add selected stat to app state
        this.stateService.updatePartialState({
            active_topic: newCurrentStats as StatsType,
        });
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



}
