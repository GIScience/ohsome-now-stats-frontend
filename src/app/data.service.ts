import {Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, map, Observable, retry, tap, throwError} from 'rxjs';

import {environment} from '../environments/environment';
import {ActivatedRoute} from '@angular/router';
import {
    IHashtag,
    IMetaData,
    IMetadataResponse,
    IQueryParams,
    ITrendingHashtagResponse,
    IWrappedCountryResult,
    IWrappedPlotResult,
    IWrappedStatsResult
} from "./dashboard/types";

@Injectable()
export class DataService {

    url = environment.ohsomeStatsServiceUrl

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
    bsLive = new BehaviorSubject<boolean>(false)
    liveMode = this.bsLive.asObservable()

    private _metaData: WritableSignal<IMetaData> = signal<IMetaData>({
        min_timestamp: new Date().toISOString(),
        max_timestamp: new Date().toISOString()
    })
    public metaData: Signal<IMetaData> = this._metaData.asReadonly();

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute
    ) {
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
                }),
                catchError(error => {
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

    requestSummary(params: IQueryParams): Observable<IWrappedStatsResult> {
        return this.http.get<IWrappedStatsResult>(`${this.url}/stats?hashtag=${params.hashtag}&startdate=${params.start}&enddate=${params.end}&countries=${params.countries}&topics=${params.topics}`)
    }

    requestPlot(params: IQueryParams): Observable<IWrappedPlotResult> {
        return this.http.get<IWrappedPlotResult>(`${this.url}/stats/interval?hashtag=${params.hashtag}&startdate=${params.start}&enddate=${params.end}&interval=${params.interval}&countries=${params.countries}&topics=${params.topics}`)
    }

    requestCountryStats(params: any): Observable<IWrappedCountryResult> {
        return this.http.get<IWrappedCountryResult>(`${this.url}/stats/country?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&topics=${params.topics}`)
    }

    getTrendingHashtags(params: { start?: string; end?: string; limit?: number; countries?: string; }) {
        return this.http.get<ITrendingHashtagResponse>(`${this.url}/most-used-hashtags?startdate=${params['start']}&enddate=${params['end']}&limit=${params['limit']}&countries=${params['countries']}`)
            .pipe(
                map((response: ITrendingHashtagResponse) => {
                    return response!.result as Array<IHashtag>
                }),
            )
    }

    toggleLiveMode(mode: boolean) {
        this.bsLive.next(mode)
    }

}
