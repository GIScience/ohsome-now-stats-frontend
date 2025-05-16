import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, map, Observable, retry, Subject, takeUntil, tap} from 'rxjs';

import {environment} from '../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';
import moment from 'moment';
import {
    IMetaData,
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
    private bsMetaData = new BehaviorSubject<IMetaData | null>(null)
    private metadata = this.bsMetaData.asObservable()
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
    minDate!: string
    maxDate!: string
    bsLive = new BehaviorSubject<boolean>(false)
    liveMode = this.bsLive.asObservable()

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router) {
        this.getAbortHashtagReqSubject()
        this.getAbortSummaryReqSubject()
        this.getAbortTopicReqSubject()
        this.getAbortIntervalReqSubject()
    }

    // will be called by APP_INITIALIZER provider in app.module.ts on the start of the application
    requestMetadata() {
        return this.http.get(`${this.url}/metadata`)
            .pipe(
                retry({count: 2, delay: 2000, resetOnSuccess: true}),
                tap((meta: any) => {
                    // consoles.log('>>> DataService >>> meta = ', meta)
                    this.setDefaultTime(meta.result.min_timestamp, meta.result.max_timestamp)
                    const tempStart = dayjs(meta.result.max_timestamp)
                        .subtract(1, "year")
                        .startOf("day")
                        .subtract(dayjs().utcOffset(), "minute")
                        .format('YYYY-MM-DDTHH:mm:ss') + 'Z'
                    // if URL params are empty then fill it with default values
                    const queryParams = this.getQueryParamsFromFragments();
                    const defaults: IQueryParam = {
                        hashtag: queryParams && queryParams.hashtag ? queryParams.hashtag : this.defaultHashtag,
                        interval: queryParams && queryParams.interval ? queryParams.interval : this.defaultIntervalValue,
                        start: queryParams && queryParams.start ? queryParams.start : queryParams && queryParams.hashtag ? meta.result.min_timestamp : tempStart,
                        end: queryParams && queryParams.end ? queryParams.end : this.maxDate,
                        countries: queryParams && queryParams.countries ? queryParams.countries : '',
                        topics: queryParams && queryParams.topics ? queryParams.topics : ''
                    }
                    if (queryParams?.fit_to_content !== undefined) {
                        defaults.fit_to_content = queryParams.fit_to_content
                    }
                    this.updateURL(defaults)
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

    getMetaData(): Observable<IMetaData | null> {
        return this.metadata
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
        const tempStart = queryParams ? moment(this.minDate) : moment(this.maxDate).subtract(1, 'year').startOf('day')

        return {
            start: tempStart.format('YYYY-MM-DDTHH:mm:ss') + 'Z',
            end: this.maxDate,
            hashtag: this.defaultHashtag,
            interval: this.defaultIntervalValue,
            countries: '',
            topics: ''
        }
    }

    setDefaultTime(minTimestamp: string, maxTimestamp: string) {
        this.maxDate = dayjs(maxTimestamp).toISOString()
        this.minDate = dayjs(minTimestamp).toISOString()

        this.bsMetaData.next({
            start: this.minDate,
            end: this.maxDate
        })
    }

    updateURL(data: IQueryParam): void {
        let fragment = `hashtag=${data.hashtag}&start=${data.start}&end=${data.end}&interval=${data.interval}&countries=${data.countries}&topics=${data.topics}`
        if (data.fit_to_content !== undefined) {
            fragment += "&fit_to_content="
        }
        this.router.navigate([], {
            fragment: fragment
        })
    }

    toggleLiveMode(mode: boolean) {
        this.bsLive.next(mode)
    }

}
