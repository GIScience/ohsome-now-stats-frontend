import {effect, Injectable, signal} from '@angular/core';
import {IStateParams} from "./dashboard/types";
import {environment} from "../environments/environment";
import {DataService} from "./data.service";
import {ActivatedRoute, Router} from "@angular/router";
import dayjs from "dayjs";
import {over5000IntervalBins} from "./utils";

@Injectable({
    providedIn: 'root'
})
export class StateService {

    url = environment.ohsomeStatsServiceUrl

    private initialState = this.initInitialState()

    // Private signal to hold the current state
    private _appState = signal<IStateParams>(
        this.initialState
    );

    // Public readonly signal for components to read
    public readonly appState = this._appState.asReadonly();

    constructor(
        private dataService: DataService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        effect(() => {
            console.info('Query state changed:', this.appState());
            // This is THE ONLY PLACE WE WANT URL TO BE UPDATED
            this.updateURL(this.appState())
        });

    }

    updatePartialState(partialState: Partial<IStateParams>): void {
        this._appState.update(currentState => ({
            ...currentState,
            ...partialState
        }));
    }

    private updateURL(data: IStateParams): void {
        let fragment = `hashtag=${data.hashtag}&start=${data.start}&end=${data.end}&interval=${data.interval}&active_topic=${data.active_topic}&countries=${data.countries}&topics=${data.topics}`
        if (data.fit_to_content !== undefined) {
            fragment += "&fit_to_content="
        }
        this.router.navigate([], {
            fragment: fragment
        })
    }

    /**
     * Initialize the initialState, either we get values from URL or we set it to default values
     *
     * @private
     * @return IStateParams
     */
    private initInitialState(): IStateParams {
        const queryParams = this.getQueryParamsFromFragments()
        const {max_timestamp, min_timestamp} = this.getDefaultMinAndMaxTimestamp(queryParams);
        const interval = this.getDefaultInterval(max_timestamp, min_timestamp, queryParams);
        const {topics, active_topic} = this.getDefaultTopicConfig(queryParams)

        return {
            hashtag: this.fromUrlOrDefault(queryParams, "hashtag", ""),
            start: min_timestamp,
            end: max_timestamp,
            interval: interval,
            countries: this.fromUrlOrDefault(queryParams, "countries", ''),
            topics: topics,
            fit_to_content: this.fromUrlOrDefault(queryParams, 'fit_to_content', undefined),
            active_topic: active_topic
        }
    }

    private getDefaultInterval(max_timestamp: string, min_timestamp: string, queryParams: URLSearchParams | null) {
        let interval = this.fromUrlOrDefault(queryParams, "interval", 'P1M')
        if (over5000IntervalBins(min_timestamp, max_timestamp, interval)) {
            interval = "P1M"
        }
        return interval
    }


    private getDefaultTopicConfig(queryParams: URLSearchParams | null) {
        const topics = this.fromUrlOrDefault(queryParams, "topics", 'contributor,edit,building,road')

        const urlOrDefaultSelectedTopic = this.fromUrlOrDefault(queryParams, "active_topic", 'contributor')

        const active_topic = topics.includes(urlOrDefaultSelectedTopic) ? urlOrDefaultSelectedTopic : topics.split(",")[0]
        return {topics, active_topic}
    }

    private onlyHashtagButNoDatesProvided(queryParams: URLSearchParams | null) {
        return !queryParams?.has("start") && !queryParams?.has("end") && queryParams?.has("hashtag");
    }

    private getDefaultMinAndMaxTimestamp(queryParams: URLSearchParams | null) {
        let {max_timestamp, min_timestamp} = this.dataService.metaData()

        if (this.onlyHashtagButNoDatesProvided(queryParams)) {
            return {max_timestamp, min_timestamp}
        }

        max_timestamp = this.fromUrlOrDefault(queryParams, "end", max_timestamp)

        min_timestamp = dayjs.utc(max_timestamp)
            .subtract(1, "year")
            .startOf("day")
            .format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        min_timestamp = this.fromUrlOrDefault(queryParams, "start", min_timestamp)

        return {max_timestamp, min_timestamp};
    }

    fromUrlOrDefault(urlParams: URLSearchParams | null, key: string, fallback: any): any {
        return urlParams?.has(key) ? urlParams.get(key) : fallback;
    }

    /**
     * Creates URLSearchParams from entire fragment of the URL
     *
     * @returns URLSearchParams object with all query params, or null if no fragment exists
     */
    getQueryParamsFromFragments(): URLSearchParams | null {
        if (this.route.snapshot.fragment == null || this.route.snapshot.fragment.length < 1) {
            return null;
        }
        return new URLSearchParams(this.route.snapshot.fragment);
    }
}
