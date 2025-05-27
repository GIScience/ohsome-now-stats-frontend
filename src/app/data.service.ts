import {Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, map, Observable, retry, Subject, takeUntil, tap, throwError} from 'rxjs';

import {environment} from '../environments/environment';
import {ActivatedRoute} from '@angular/router';
import {
    IMetaData,
    IMetadataResponse,
    IQueryParam,
    ISummaryData,
    IWrappedCountryStatsData,
    IWrappedPlotData,
    IWrappedSummaryData,
    IWrappedTopicCountryData,
    IWrappedTopicData,
    IWrappedTopicPlotData
} from "./dashboard/types";
import dayjs from "dayjs";

@Injectable()
export class DataService {

    url = environment.ohsomeStatsServiceUrl
    private bsSummaryData = new BehaviorSubject<ISummaryData | null>(null)
    summaryData = this.bsSummaryData.asObservable()
    abortHashtagReqSub!: Subject<void>
    abortTopicReqSub!: Subject<void>
    abortSummaryReqSub!: Subject<void>
    abortIntervalReqSub!: Subject<void>

    defaultHashtag = ''
    trendingHashtagLimit = 10
    timeIntervals = [
        {label: 'five minutes', value: 'PT5M'},
        {label: 'hourly', value: 'PT1H'},
        {label: 'daily', value: 'P1D'},
        {label: 'weekly', value: 'P1W'},
        {label: 'monthly', value: 'P1M'},
        {label: 'quarterly', value: 'P3M'},
        {label: 'yearly', value: 'P1Y'},
    ]
    defaultIntervalValue = 'P1M'
    minDate!: string // min date in our DB
    maxDate!: string // max date in our DB
    bsLive = new BehaviorSubject<boolean>(false)
    liveMode = this.bsLive.asObservable()
    private _metaData:  WritableSignal<IMetaData> = signal<IMetaData>({
        min_timestamp: new Date().toISOString(),
        max_timestamp: new Date().toISOString()
    })
    public metaData: Signal<IMetaData> = this._metaData.asReadonly();

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute
        ) {
        this.getAbortHashtagReqSubject()
        this.getAbortSummaryReqSubject()
        this.getAbortTopicReqSubject()
        this.getAbortIntervalReqSubject()
    }

    // will be called by APP_INITIALIZER provider in app.module.ts on the start of the application
    requestMetadata(): Observable<IMetaData> {
        return this.http.get<IMetadataResponse>(`${this.url}/metadata`)
            .pipe(
                retry({count: 2, delay: 2000, resetOnSuccess: true}),
                map((response: IMetadataResponse) => {
                    return response!.result as IMetaData
                }),
                tap((meta: IMetaData) => {
                    this._metaData.set(meta)
                    console.log('>>> requestMetadata >>> ',this.metaData());
                }),
                catchError( error => {
                    if (error.status === 0) {
                        // A client-side or network error occurred. Handle it accordingly.
                        console.error('An error occurred:', error.error);
                    } else {
                        // The backend returned an unsuccessful response code.
                        // The response body may contain clues as to what went wrong.
                        console.error(
                            `Backend returned code ${error.status}, body was: `, error.error);
                    }
                    // Return an observable with a user-facing error message.
                    return throwError(() => new Error('ohsomeNow Stats Service did not respond with a metadata response.'));
                })
            )
    }

    requestAllHashtags() {
        return this.http.get<any>(`${this.url}/hashtags`)
            .pipe(
                map(res => res.result)
            )
    }

    /**
     * Creates query param from enitre fragment of the URL
     *
     * @returns Object with all query params sepearted
     */
    getQueryParamsFromFragments(): any {
        if (this.route.snapshot.fragment == null || this.route.snapshot.fragment.length < 2)
            return null

        const tempQueryParams: Array<Array<string>> | any = this.route.snapshot.fragment?.split('&')
            .map(q => [q.split('=')[0], q.split('=')[1]])
        return Object.fromEntries(tempQueryParams)
    }

    requestSummary(params: any): Observable<IWrappedSummaryData> {
        return this.http.get<IWrappedSummaryData>(`${this.url}/stats?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortSummaryReqSub)
            )
    }

    requestTopic(params: any): Observable<IWrappedTopicData> {
        return this.http.get<IWrappedTopicData>(`${this.url}/topic/${params['topics']}?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortTopicReqSub)
            )
    }

    requestTopicInterval(params: any): Observable<IWrappedTopicPlotData> {
        return this.http.get<IWrappedTopicPlotData>(`${this.url}/topic/${params['topics']}/interval?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&countries=${params['countries']}&interval=${params['interval']}`)
            .pipe(
                takeUntil(this.abortTopicReqSub)
            )
    }

    requestTopicCountryStats(params: any): Observable<IWrappedTopicCountryData> {
        return this.http.get<IWrappedTopicCountryData>(`${this.url}/topic/${params['topics']}/country?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}`)
            .pipe(
                takeUntil(this.abortIntervalReqSub)
            )
    }

    requestPlot(params: any): Observable<IWrappedPlotData> {
        return this.http.get<IWrappedPlotData>(`${this.url}/stats/interval?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&interval=${params['interval']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortIntervalReqSub)
            )
    }

    requestCountryStats(params: any): Observable<IWrappedCountryStatsData> {
        return this.http.get<IWrappedCountryStatsData>(`${this.url}/stats/country?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}`)
            .pipe(
                takeUntil(this.abortIntervalReqSub)
            )
    }

    getSummary() {
        return this.bsSummaryData.getValue()
        // return this.summaryData
    }

    setSummary(data: ISummaryData) {
        this.bsSummaryData.next(data)
    }

    getAbortHashtagReqSubject() {
        this.abortHashtagReqSub = new Subject<void>();
    }

    getAbortSummaryReqSubject() {
        this.abortSummaryReqSub = new Subject<void>();
    }

    getAbortIntervalReqSubject() {
        this.abortIntervalReqSub = new Subject<void>();
    }

    getAbortTopicReqSubject() {
        this.abortTopicReqSub = new Subject<void>();
    }

    getTrendingHashtags(params: any) {
        // console.log('>>> getTrendingHashtags >>> ', params)
        return this.http.get(`${this.url}/most-used-hashtags?startdate=${params['start']}&enddate=${params['end']}&limit=${params['limit']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortHashtagReqSub)
            )
    }

    /**
     * Gives the default values for application
     *
     * @returns IQueryParam
     */
    getDefaultValues(): IQueryParam | null {
        if (!(this.minDate && this.maxDate))
            return null

        const queryParams = this.getQueryParamsFromFragments()
        const tempStart = queryParams ? dayjs(this.minDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z' : dayjs(this.maxDate)
            .subtract(1, "year")
            .startOf("day")
            .subtract(dayjs().utcOffset(), "minute")
            .format('YYYY-MM-DDTHH:mm:ss') + 'Z'
        return {
            start: tempStart,
            end: this.maxDate,
            hashtag: this.defaultHashtag,
            interval: this.defaultIntervalValue,
            countries: '',
            topics: ''
        }
    }

    toggleLiveMode(mode: boolean) {
        this.bsLive.next(mode)
    }

}
