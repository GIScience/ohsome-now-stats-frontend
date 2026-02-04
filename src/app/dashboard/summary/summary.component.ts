import {booleanAttribute, Component, computed, effect, inject, input, signal} from '@angular/core';
import {IQueryParams, ITopicDefinitionValue, IWrappedStatsResult, StatsType} from "../../../lib/types";
import {StateService} from "../../../lib/state.service";
import {DataService} from "../../../lib/data.service";
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {BigNumberComponent} from "./big-number/big-number.component";
import {Overlay} from "@app/overlay.component";

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
    imports: [Overlay, BigNumberComponent]
})
export class SummaryComponent {
    private stateService: StateService = inject(StateService);
    private dataService: DataService = inject(DataService);

    bignumberData = signal<ITopicDefinitionValue[]>([]);
    isSummaryLoading = signal(false);

    state = computed(() => this.stateService.appState());

    private relevantState = computed(
        () => this.state(),
        {
            equal: (a, b) =>
                a.hashtag === b.hashtag &&
                a.start === b.start &&
                a.end === b.end &&
                a.countries === b.countries &&
                a.topics === b.topics
        }
    );
    userMode = input(false, {transform: booleanAttribute});

    constructor() {
        effect(() => {
            this.requestFromAPI(this.relevantState());
        });
    }

    requestFromAPI(queryParams: IQueryParams) {
        this.isSummaryLoading.set(true);
        this.userMode()
            ? this.dataService.requestUserSummary(queryParams).subscribe(this.processResult())
            : this.dataService.requestSummary(queryParams).subscribe(this.processResult());
    }

    private processResult() {
        return {
            next: (data: IWrappedStatsResult) => {
                const topics = data.result.topics;

                const result: ITopicDefinitionValue[] = [];

                for (const [key, value] of Object.entries(topics)) {
                    result.push({...value, ...topicDefinitions[key as StatsType]});
                }

                this.bignumberData.set(result);
                this.isSummaryLoading.set(false);
            },
            error: (err: Error) => {
                console.error(err);
                this.isSummaryLoading.set(false);
            }
        };
    }

    changeSelectedBigNumber(e: MouseEvent, newCurrentStats: string) {
        this.stateService.updatePartialState(
            {active_topic: newCurrentStats as StatsType,}
        );
    }
}
