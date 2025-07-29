import {effect, Injectable, signal} from '@angular/core';
import {IStateParams} from "./dashboard/types";
import {environment} from "../environments/environment";
import {DataService} from "./data.service";
import {NavigationEnd, Router} from "@angular/router";
import dayjs from "dayjs";
import {over5000IntervalBins} from "./utils";
import {BehaviorSubject, filter} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class StateService {
    // doing this to be able to mock window easily in tests
    window = window;
    url = environment.ohsomeStatsServiceUrl

    private initialState = this.initInitialState()

    // Private signal to hold the current state
    private _appState = signal<IStateParams>(
        this.initialState
    );

    // Public readonly signal for components to read
    public readonly appState = this._appState.asReadonly();

    bsActivePage = new BehaviorSubject<string | undefined>(undefined);
    activePage = this.bsActivePage.asObservable();

    constructor(
        private dataService: DataService,
        private router: Router,
    ) {
        effect(() => {
            console.info('Query state changed:', this.appState());
            // This is THE ONLY PLACE WE WANT URL TO BE UPDATED
            this.updateURL(this.appState())
        });
        if (router.events) {
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe((_) => {
                this.bsActivePage.next(this.getLastUrlRoute())
            });
            this.bsActivePage.next(this.getLastUrlRoute())
        }
    }

    getLastUrlRoute() {
        return this.router.url.split('#')[0].split('/').pop()
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
        this.router.navigate(this.firstRouting() ? this.window.location.pathname.split("/") : [], {
            fragment: fragment
        })
    }

    private firstRouting(): boolean {
        // router not yet properly initialized
        return this.router.url === "/"
    }

    /**
     * Initialize the initialState, either we get values from URL or we set it to default values
     *
     * @private
     * @return IStateParams
     */
    initInitialState(): IStateParams {
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
        if (this.window.location.href.split('#').length < 2) {
            return null;
        }
        return new URLSearchParams(this.window.location.href.split('#')[1]);
    }
}
