import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject, takeUntil} from 'rxjs';

import {environment} from '../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';
import moment from 'moment';
import {StatsType} from "./dashboard/types";

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

    defaultHashtag = 'missingmaps'
    trendingHashtagLimit = 10
    timeIntervals = [
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
        return this.http.get(`${this.url}/metadata`).subscribe((meta: any) => {
            // console.log('>>> DataService >>> meta = ', meta)
            this.setDefaultTime(meta.result.min_timestamp, meta.result.max_timestamp)
            const tempStart = new Date(meta.result.max_timestamp)
            tempStart.setDate(tempStart.getDate() - 365)
            // if URL params are empty then fill it with default values
            const queryParams = this.getQueryParamsFromFragments(this.route.snapshot.fragment);

            this.updateURL({
                hashtags: queryParams && queryParams.hashtags ? queryParams.hashtags : this.defaultHashtag,
                interval: queryParams && queryParams.interval ? queryParams.interval : this.defaultIntervalValue,
                start: queryParams && queryParams.start ? queryParams.start : tempStart.toISOString(),
                end: queryParams && queryParams.end ? queryParams.end : this.maxDate,
                countries: queryParams && queryParams.countries ? queryParams.countries : '',
                topics: queryParams && queryParams.topics ? queryParams.topics : ''
            })
        })
    }

    /**
     * Creates query param from enitre fragment of the URL
     *
     * @param fragment URL fragment part
     * @returns Object with all query params sepearted
     */
    getQueryParamsFromFragments(fragment: string | null): any {
        if (fragment == null || fragment.length < 2)
            return null

        const tempQueryParams: Array<Array<string>> = fragment?.split('&')
            .map(q => [q.split('=')[0], q.split('=')[1]])
        return Object.fromEntries(tempQueryParams)
    }

    getMetaData(): Observable<IMetaData | null> {
        return this.metadata
    }

    requestSummary(params: any): Observable<IWrappedSummaryData> {
        return this.http.get<IWrappedSummaryData>(`${this.url}/stats/${params['hashtags']}?startdate=${params['start']}&enddate=${params['end']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortSummaryReqSub)
            )
    }

    requestTopic(params: any): Observable<IWrappedTopicData> {
        return this.http.get<IWrappedTopicData>(`${this.url}/topic/${params['topics']}?hashtag=${params['hashtags']}&startdate=${params['start']}&enddate=${params['end']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortTopicReqSub)
            )
    }

    requestTopicInterval(params: any): Observable<IWrappedTopicPlotData> {
        return this.http.get<IWrappedTopicPlotData>(`${this.url}/topic/${params['topics']}/interval?hashtag=${params['hashtags']}&startdate=${params['start']}&enddate=${params['end']}&countries=${params['countries']}&interval=${params['interval']}`)
            .pipe(
                takeUntil(this.abortTopicReqSub)
            )
    }

    requestTopicCountryStats(params: any): Observable<IWrappedTopicCountryData> {
        return this.http.get<IWrappedTopicCountryData>(`${this.url}/topic/${params['topics']}/country?hashtag=${params['hashtags']}&startdate=${params['start']}&enddate=${params['end']}`)
            .pipe(
                takeUntil(this.abortIntervalReqSub)
            )
    }

    requestPlot(params: any): Observable<IWrappedPlotData> {
        return this.http.get<IWrappedPlotData>(`${this.url}/stats/${params['hashtags']}/interval?startdate=${params['start']}&enddate=${params['end']}&interval=${params['interval']}&countries=${params['countries']}`)
            .pipe(
                takeUntil(this.abortIntervalReqSub)
            )
    }

    requestCountryStats(params: any): Observable<IWrappedCountryStatsData> {
        return this.http.get<IWrappedCountryStatsData>(`${this.url}/stats/${params['hashtags']}/country?startdate=${params['start']}&enddate=${params['end']}`)
            .pipe(
                takeUntil(this.abortIntervalReqSub)
            )
    }

    getSummary() {
        // return this.bsSummaryData.getValue()
        return this.summaryData
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
        return this.http.get(`${this.url}/most-used-hashtags?startdate=${params['start']}&enddate=${params['end']}&limit=${params['limit']}`)
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

        const tempStart = moment(this.maxDate).subtract(1, 'year').startOf('day')

        return {
            start: tempStart.toISOString(),
            end: this.maxDate,
            hashtags: this.defaultHashtag,
            interval: this.defaultIntervalValue,
            countries: '',
            topics: ''
        }
    }

    setDefaultTime(minTimestamp: string, maxTimestamp: string) {
        this.maxDate = new Date(maxTimestamp).toISOString()
        this.minDate = new Date(minTimestamp).toISOString()

        this.bsMetaData.next({
            start: this.minDate,
            end: this.maxDate
        })
    }

    updateURL(data: IQueryParam): void {
        this.router.navigate([], {
            fragment: `hashtags=${data.hashtags}&start=${data.start}&end=${data.end}&interval=${data.interval}&countries=${data.countries}&topics=${data.topics}`
        })
    }
}


export type TopicName = 'place' | 'healthcare' | 'amenity' | 'waterway'

interface TopicValues {
    hashtag: string
    topic: string
    value: number
}

export type TopicResponse = Record<TopicName, TopicValues>

export interface IWrappedTopicData {
    // result: Map<string, ITopicData>
    result: TopicResponse
}

export interface TopicDefinitionValue {
    name: string
    "color-hex": string
    "y-title": string,
    dropdown_name?: string,
    color?: string,
    tooltip?: string,
    icon?: string
}

export type TopicDefinition = Record<StatsType, TopicDefinitionValue>

export interface ITopicData {
    topic: string,
    value: number
}

export interface IWrappedSummaryData {
    result: ISummaryData
}

export interface ISummaryData {
    changesets?: number,
    users: number
    edits: number
    buildings: number
    roads: number,
    latest?: string
}


export interface IQueryData {
    start: string
    end: string
    hashtags: Array<string>
    interval: string
    countries: string
    topics: string
}

export interface IWrappedPlotData {
    result: Array<IPlotData>
}

export interface IPlotData {
    changesets?: number,
    users: number,
    roads: number,
    buildings: number,
    edits: number,
    latest?: string,
    hashtag?: string,
    startDate: string,
    endDate: string
}


export interface IWrappedTopicPlotData {
    result: Record<string, Array<ITopicPlotData>>
}

export interface ITopicPlotData {
    value: number,
    topic: string,
    startDate: string,
    endDate: string
}

export interface IWrappedTopicCountryData {
    query: { timespan: { startDate: string, endDate: string }, hashtag: string }
    result: Record<StatsType, ITopicCountryData[]>
}

export interface ITopicCountryData {
    topic: string,
    country: string,
    value: number
}

/**
 * Response JSON returned by /stats/{hashtag}/country endoint
 */
export interface IWrappedCountryStatsData {
    query: { timespan: { startDate: string, endDate: string }, hashtag: string }
    result: ICountryStatsData[]
}

export interface ICountryStatsData {
    users: number,
    roads: number,
    buildings: number,
    edits: number,
    place?: number,
    healthcare?: number,
    amenity?: number,
    waterway?: number,
    latest: string,
    country: string,
}

export const customPropertyOrder: string[] = [
    "changesets",
    "users",
    "roads",
    "buildings",
    "edits",
    "healthcare",
    "amenity",
    "waterway",
    "latest",
    "country",
    "hashtag",
];

export interface ITrendingHashtags {
    result: any
}

export interface IQueryParam {
    countries: string,
    hashtags: string,
    start: string, // date in ISO format, ensure to keep milliseconds as 0
    end: string, // date in ISO format, ensure to keep milliseconds as 0
    interval: string, // eg:'P1D' default value: 'P1M'
    topics: string
}

export interface IHashtag {
    hashtagTitle: string,
    hashtag: string,
    number_of_users: number,
    tooltip: string,
    percent: number
}

export interface IMetaData {
    start: string, // date in ISO format, ensure to keep milliseconds as 0
    end: string, // date in ISO format, ensure to keep milliseconds as 0
}
