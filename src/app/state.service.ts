import {effect, Injectable, signal} from '@angular/core';
import {IStateParams, StatsType} from "./dashboard/types";
import {BehaviorSubject} from "rxjs";
import {environment} from "../environments/environment";
import dayjs from "dayjs";
import {DataService} from "./data.service";
import {ActivatedRoute, Router} from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class StateService {

    url = environment.ohsomeStatsServiceUrl
    // Initial default state
    private initialState = this.initInitialState()
    // Private BehaviorSubject to hold the current state
    public queryParamSubject: BehaviorSubject<IStateParams> = new BehaviorSubject<IStateParams>(this.initialState);

    // Private signal to hold the current state
    private _appState = signal<IStateParams>(
        this.initialState,
        {
            equal: (a, b) => {
                return (
                    a.hashtag === b.hashtag
                    && a.start == b.start
                    && a.end == b.end
                    && a.interval == b.interval
                    && a.topics == b.topics
                    && a.countries == b.countries
                    && a.fit_to_content == b.fit_to_content
                    && a.active_topic == b.active_topic
                )
            },
        }
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

    /**
     * Update the entire state
     */
    updateState(newState: IStateParams): void {
        this._appState.set({...newState});
    }

    /**
     * Update partial state (merge with current state)
     */
    updatePartialState(partialState: Partial<IStateParams>): void {
        this._appState.update(currentState => ({
            ...currentState,
            ...partialState
        }));
    }

    /**
     * Get the current state value synchronously
     */
    getCurrentState(): IStateParams {
        return this.queryParamSubject.value;
    }

    setInterval(interval: string): void {
        this.updatePartialState({interval});
    }

    /**
     * Reset state to initial values
     */
    resetState(): void {
        this.queryParamSubject.next(this.initialState);
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
        let tempInitialState: IStateParams
        const queryParams = this.getQueryParamsFromFragments()
        if (queryParams == null) {
            tempInitialState = {
                hashtag: '',
                start: new Date().toISOString().split('.')[0] + 'Z', // Current date with 0 milliseconds
                end: new Date().toISOString().split('.')[0] + 'Z', // Current date with 0 milliseconds
                interval: 'P1M', // Default monthly interval
                countries: '',
                topics: '',
                fit_to_content: undefined,
                active_topic: 'contributor'
            };
            const {max_timestamp} = this.dataService.metaData()
            tempInitialState.start = dayjs.utc(max_timestamp)
                .subtract(1, "year")
                .startOf("day")
                .format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            tempInitialState.end = max_timestamp
        } else {
            tempInitialState = {
                hashtag: queryParams.get('hashtag')!,
                start: queryParams.get('start')!,
                end: queryParams.get('end')!,
                interval: queryParams.get('interval')!,
                countries: queryParams.get('countries')!,
                topics: queryParams.get('topics')!,
                fit_to_content: queryParams.get('fit_to_content') ? queryParams.get('fit_to_content')! : undefined,
                active_topic: queryParams.get('active_topic')! as StatsType
            };
        }

        return tempInitialState;
    }

    /**
     * Creates URLSearchParams from entire fragment of the URL
     *
     * @returns URLSearchParams object with all query params, or null if no fragment exists
     */
    getQueryParamsFromFragments(): URLSearchParams | null {
        // Check if fragment exists and has content
        if (this.route.snapshot.fragment == null || this.route.snapshot.fragment.length < 1) {
            return null;
        }

        // Create URLSearchParams from the fragment
        const searchParams = new URLSearchParams(this.route.snapshot.fragment);
        // Optional: Log all parameters for debugging
        // searchParams.forEach((value, key) => {
        //     console.log(`${key}: ${value}`);
        // });

        return searchParams;
    }
}
