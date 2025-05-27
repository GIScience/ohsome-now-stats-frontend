import {effect, Injectable, signal} from '@angular/core';
import {IMetaData, IQueryParam} from "./dashboard/types";
import {BehaviorSubject, Observable, ReplaySubject, retry, tap} from "rxjs";
import {environment} from "../environments/environment";
import dayjs from "dayjs";
import {HttpClient} from "@angular/common/http";
import {DataService} from "./data.service";
import {Router} from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class StateService {

    url = environment.ohsomeStatsServiceUrl
    // Initial default state
    private initialState: IQueryParam = {
        countries: '',
        hashtag: '',
        start: new Date().toISOString().split('.')[0] + 'Z', // Current date with 0 milliseconds
        end: new Date().toISOString().split('.')[0] + 'Z', // Current date with 0 milliseconds
        interval: 'P1M', // Default monthly interval
        topics: '',
        fit_to_content: undefined
    };
    // Private BehaviorSubject to hold the current state
    public queryParamSubject: BehaviorSubject<IQueryParam> = new BehaviorSubject<IQueryParam>(this.initialState);

    // Private signal to hold the current state
    private _appState = signal<IQueryParam>(this.initialState);

    // Public readonly signal for components to read
    public readonly appState = this._appState.asReadonly();

    // BehaviorSubject to hold Meta request state
    public bsMetaData = new BehaviorSubject<IMetaData | null>(null)
    public metadata = this.bsMetaData.asObservable()

    constructor(
        private dataService: DataService,
        private router: Router
    ) {
        effect(() => {
            console.log('Query state changed in component:', this.appState());
            // This is THE ONLY PLACE WE WANT URL TO BE UPDATED
            this.updateURL(this.appState())
        });
        const {min_timestamp, max_timestamp} = this.dataService.metaData
        this.initialState.start = dayjs.utc(max_timestamp)
            .subtract(1, "year")
            .startOf("day")
            .format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        this.initialState.end = max_timestamp

        // set MetaState, which currently just holds start and end dates of data we have in DB
        this.setMetaState({
            min_timestamp: min_timestamp,
            max_timestamp: max_timestamp
        })
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

    getMetaState(): IMetaData | null {
        return this.bsMetaData.value;
    }

    setMetaState(newState: IMetaData): void {
        this.bsMetaData.next(newState);
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
        let fragment = `hashtag=${data.hashtag}&start=${data.start}&end=${data.end}&interval=${data.interval}&countries=${data.countries}&topics=${data.topics}`
        if (data.fit_to_content !== undefined) {
            fragment += "&fit_to_content="
        }
        this.router.navigate([], {
            fragment: fragment
        })
    }
}
