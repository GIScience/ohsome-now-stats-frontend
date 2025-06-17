import {Component, computed, effect} from '@angular/core';
import * as bootstrap from 'bootstrap';

import {IQueryParams, IStatsData, ITopicDefinitionValue, StatsType} from '../types';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {DataService} from "../../data.service";
import {StateService} from "../../state.service";

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
    standalone: false
})
export class SummaryComponent {
    bignumberData: Array<ITopicDefinitionValue> = [];
    private data!: Record<StatsType, IStatsData>;
    isSummaryLoading: boolean = false;

    state = computed(() => this.stateService.appState());
    private relevantState = computed(() => {
        return this.state()
    }, {
        equal: (a, b) => {
            return a.hashtag === b.hashtag
                && a.start === b.start
                && a.end === b.end
                && a.countries === b.countries
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

    requestFromAPI(queryParams: IQueryParams) {
        this.isSummaryLoading = true
        this.dataService.requestSummary(queryParams).subscribe({
            next: (data) => {
                this.data = data.result.topics

                this.updateBigNumber();
            },
            error: (err) => {
                console.error('Error while requesting data: ', err)
            }
        })
    }

    updateBigNumber(): void {
        if (!this.data)
            return

        this.bignumberData = []

        for (let [key, value] of Object.entries(this.data)) {
            this.bignumberData.push({...value, ...topicDefinitions[key as StatsType]})
        }

        this.isSummaryLoading = false;
    }


    changeSelectedBigNumber(e: MouseEvent, newCurrentStats: string) {
        this.stateService.updatePartialState({
            active_topic: newCurrentStats as StatsType,
        });
    }

    /**
     * Boostrap need to enable tooltip on every element with its attribute
     */
    enableTooltips(): void {
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {trigger: 'hover'}))
    }
}
