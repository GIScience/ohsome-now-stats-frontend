import { Injectable } from '@angular/core';
import {IMetaData, IQueryParam} from "./dashboard/types";
import {BehaviorSubject, Observable, retry, tap} from "rxjs";
import {environment} from "../environments/environment";
import dayjs from "dayjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class StateService {

  url = environment.ohsomeStatsServiceUrl
  // Initial default state
  private initialState: IQueryParam = {
    countries: '',
    hashtag: '',
    start: new Date().toISOString().split('.')[0] + '.000Z', // Current date with 0 milliseconds
    end: new Date().toISOString().split('.')[0] + '.000Z', // Current date with 0 milliseconds
    interval: 'P1M', // Default monthly interval
    topics: '',
    fit_to_content: undefined
  };
  // Private BehaviorSubject to hold the current state
  private readonly queryParamSubject = new BehaviorSubject<IQueryParam>(this.initialState);
  // Public Observable for components to subscribe to
  public readonly queryParam$: Observable<IQueryParam> = this.queryParamSubject.asObservable();

  // BehaviorSubject to hold Meta request state
  public bsMetaData = new BehaviorSubject<IMetaData | null>(null)
  public metadata = this.bsMetaData.asObservable()

  constructor(
      private http: HttpClient
  ) {}

  // will be called by APP_INITIALIZER provider in app.module.ts on the start of the application
  requestMetadata() {
    return this.http.get(`${this.url}/metadata`)
        .pipe(
            retry({count: 2, delay: 2000, resetOnSuccess: true}),
            tap((meta: any) => {
              const maxDate = dayjs(meta.result.max_timestamp).toISOString()
              const minDate = dayjs(meta.result.min_timestamp).toISOString()

              this.initialState.start = dayjs(maxDate)
                  .subtract(1, "year")
                  .startOf("day")
                  .subtract(dayjs().utcOffset(), "minute")
                  .format('YYYY-MM-DDTHH:mm:ss') + '.000Z';
              this.initialState.end = dayjs(maxDate).format('YYYY-MM-DDTHH:mm:ss') + '.000Z';

              // set MetaState, which currently just holds start and end dates of data we have in DB
              this.setMetaState({
                start: minDate,
                end: maxDate
              })
            })
        )
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
   * Update the entire state
   */
  updateState(newState: IQueryParam): void {
    this.queryParamSubject.next(newState);
  }

  /**
   * Update partial state (merge with current state)
   */
  updatePartialState(partialState: Partial<IQueryParam>): void {
    const currentState = this.getCurrentState();
    const newState = { ...currentState, ...partialState };
    this.queryParamSubject.next(newState);
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
      this.queryParam$.subscribe(state => observer.next(state.countries));
    });
  }

  getHashtag$(): Observable<string> {
    return new Observable(observer => {
      this.queryParam$.subscribe(state => observer.next(state.hashtag));
    });
  }

  getStart$(): Observable<string> {
    return new Observable(observer => {
      this.queryParam$.subscribe(state => observer.next(state.start));
    });
  }

  getEnd$(): Observable<string> {
    return new Observable(observer => {
      this.queryParam$.subscribe(state => observer.next(state.end));
    });
  }

  getInterval$(): Observable<string> {
    return new Observable(observer => {
      this.queryParam$.subscribe(state => observer.next(state.interval));
    });
  }

  getTopics$(): Observable<string> {
    return new Observable(observer => {
      this.queryParam$.subscribe(state => observer.next(state.topics));
    });
  }

  getFitToContent$(): Observable<string | undefined> {
    return new Observable(observer => {
      this.queryParam$.subscribe(state => observer.next(state.fit_to_content));
    });
  }
}
