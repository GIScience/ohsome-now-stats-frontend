import {effect, Injectable, signal} from '@angular/core';
import {IQueryParam, StatsType} from "./dashboard/types";
import {BehaviorSubject, Observable} from "rxjs";
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
    public queryParamSubject: BehaviorSubject<IQueryParam> = new BehaviorSubject<IQueryParam>(this.initialState);

    // Private signal to hold the current state
    private _appState = signal<IQueryParam>(
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
    updateState(newState: IQueryParam): void {
        this._appState.set({ ...newState });
    }

    /**
     * Update partial state (merge with current state)
     */
    updatePartialState(partialState: Partial<IQueryParam>): void {
        this._appState.update(currentState => ({
            ...currentState,
            ...partialState
        }));
    }

    /**
     * Get the current state value synchronously
     */
    getCurrentState(): IQueryParam {
        return this.queryParamSubject.value;
    }

    /**
     * Individual property setters for convenience
     */
    setCountries(countries: string): void {
        this.updatePartialState({ countries });
    }

    setHashtag(hashtag: string): void {
        this.updatePartialState({ hashtag });
    }

    setStart(start: string): void {
        // Ensure milliseconds are set to 0
        const dateWithZeroMs = start.includes('.')
            ? start.split('.')[0] + '.000Z'
            : start.replace('Z', '.000Z');
        this.updatePartialState({ start: dateWithZeroMs });
    }

    setEnd(end: string): void {
        // Ensure milliseconds are set to 0
        const dateWithZeroMs = end.includes('.')
            ? end.split('.')[0] + '.000Z'
            : end.replace('Z', '.000Z');
        this.updatePartialState({ end: dateWithZeroMs });
    }

    setInterval(interval: string): void {
        this.updatePartialState({ interval });
    }

    setTopics(topics: string): void {
        this.updatePartialState({ topics });
    }

    setFitToContent(fit_to_content?: string): void {
        this.updatePartialState({ fit_to_content });
    }

    /**
     * Individual property getters for convenience
     */
    getCountries(): string {
        return this.getCurrentState().countries;
    }

    getHashtag(): string {
        return this.getCurrentState().hashtag;
    }

    getStart(): string {
        return this.getCurrentState().start;
    }

    getEnd(): string {
        return this.getCurrentState().end;
    }

    getInterval(): string {
        return this.getCurrentState().interval;
    }

    getTopics(): string {
        return this.getCurrentState().topics;
    }

    getFitToContent(): string | undefined {
        return this.getCurrentState().fit_to_content;
    }

    /**
     * Reset state to initial values
     */
    resetState(): void {
        this.queryParamSubject.next(this.initialState);
    }

    /**
     * Meta request state setters
     */
    /*setMinDate(start: string): void {
      // console.log('>>> setMinDate >>> ', start);
      // this.
    }

    setMaxDate(end: string): void {
      // console.log('>>> setMaxDate >>> ', end);
    }

    getMinDate(): string {
      return this.getMetaState().start;
    }

    getMaxDate(): string {
      return this.getMetaState().end;
    }*/

    /**
     * Get specific property as Observable
     */
    getCountries$(): Observable<string> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.countries));
        });
    }

    getHashtag$(): Observable<string> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.hashtag));
        });
    }

    getStart$(): Observable<string> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.start));
        });
    }

    getEnd$(): Observable<string> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.end));
        });
    }

    getInterval$(): Observable<string> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.interval));
        });
    }

    getTopics$(): Observable<string> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.topics));
        });
    }

    getFitToContent$(): Observable<string | undefined> {
        return new Observable(observer => {
            this.queryParamSubject.subscribe(state => observer.next(state.fit_to_content));
        });
    }

    private updateURL(data: IQueryParam): void {
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
     * @return IQueryParam
     */
    private initInitialState(): IQueryParam {
        let tempInitialState: IQueryParam
        const queryParams = this.getQueryParamsFromFragments()
        if(queryParams == null) {
            tempInitialState = {
                hashtag: '',
                start: new Date().toISOString().split('.')[0] + 'Z', // Current date with 0 milliseconds
                end: new Date().toISOString().split('.')[0] + 'Z', // Current date with 0 milliseconds
                interval: 'P1M', // Default monthly interval
                countries: '',
                topics: '',
                fit_to_content: undefined,
                active_topic: 'users'
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
