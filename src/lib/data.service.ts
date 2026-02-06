import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, firstValueFrom, map, Observable, retry, tap, throwError} from 'rxjs';

import {environment} from '@environments/environment';
import {
    HexDataType,
    IHashtag,
    IMetaData,
    IMetadataResponse,
    IQueryParams,
    ITrendingHashtagResponse,
    IWrappedCountryResult,
    IWrappedPlotResult,
    IWrappedStatsResult
} from "./types";
import * as Papa from 'papaparse';
import {AuthService} from "./auth.service";

@Injectable({providedIn: 'root'})
export class DataService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);
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

    private _metaData = signal<IMetaData>({max_timestamp: "", min_timestamp: ""})
    public metaData = this._metaData.asReadonly();

    private key;

    constructor() {
        this.key = this.authService.key;
    }

    requestMetadata() {
        return firstValueFrom(this.http.get<IMetadataResponse>(`${this.url}/metadata`)
            .pipe(
                retry({count: 2, delay: 2000}),
                map(res => res.result),
                tap(meta => this._metaData.set(meta)),
                catchError(err =>
                    throwError(() => new Error('Metadata request failed'))
                )
            ))
            .then((res) => {
                return res
            });
    }

    requestAllHashtags() {
        return this.http.get<any>(`${this.url}/hashtags`, {headers: {"Authorization": this.key().key}})
            .pipe(
                map(res => res.result)
            )
    }

    requestSummary(params: IQueryParams): Observable<IWrappedStatsResult> {
        return this.http.get<IWrappedStatsResult>(`${this.url}/stats?hashtag=${params.hashtag}&startdate=${params.start}&enddate=${params.end}&countries=${params.countries}&topics=${params.topics}`, {headers: {"Authorization": this.key().key}})
    }

    requestUserSummary(params: IQueryParams) {
        return this.http.get<IWrappedStatsResult>(
            `${this.url}/user?userId=${params.osm_user_id}&hashtag=${params.hashtag}&startdate=${params.start}&enddate=${params.end}&countries=${params.countries}&topics=${params.topics}`,
            {headers: {"Authorization": this.key().key}})
    }

    requestPlot(params: IQueryParams): Observable<IWrappedPlotResult> {
        return this.http.get<IWrappedPlotResult>(`${this.url}/stats/interval?hashtag=${params.hashtag}&startdate=${params.start}&enddate=${params.end}&interval=${params.interval}&countries=${params.countries}&topics=${params.topics}`, {headers: {"Authorization": this.key().key}})
    }

    requestUserPlot(params: IQueryParams): Observable<IWrappedPlotResult> {
        return this.http.get<IWrappedPlotResult>(`${this.url}/user/interval?userId=${params.osm_user_id}&hashtag=${params.hashtag}&startdate=${params.start}&enddate=${params.end}&interval=${params.interval}&countries=${params.countries}&topics=${params.topics}`, {headers: {"Authorization": this.key().key}})
    }

    requestCountryStats(params: any): Observable<IWrappedCountryResult> {
        return this.http.get<IWrappedCountryResult>(`${this.url}/stats/country?hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&topics=${params.topics}`, {headers: {"Authorization": this.key().key}})
    }

    requestUserCountryStats(params: any): Observable<IWrappedCountryResult> {
        return this.http.get<IWrappedCountryResult>(`${this.url}/user/country?userId=${params.osm_user_id}&hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&topics=${params.topics}`, {headers: {"Authorization": this.key().key}})
    }

    getTrendingHashtags(params: { start?: string; end?: string; limit?: number; countries?: string; }) {
        return this.http.get<ITrendingHashtagResponse>(`${this.url}/most-used-hashtags?startdate=${params['start']}&enddate=${params['end']}&limit=${params['limit']}&countries=${params['countries']}`, {headers: {"Authorization": this.key().key}})
            .pipe(
                map((response: ITrendingHashtagResponse) => {
                    return response!.result as Array<IHashtag>
                }),
            )
    }

    private readonly h3Parser = (csv: string): HexDataType[] => {
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        return (parsed.data as any[]).map(row => ({
            result: Number(row.result),
            hex_cell: row.hex_cell
        }));
    };

    getH3Map(params: {
        hashtag: string;
        start: string;
        end: string;
        topic: string;
        resolution: number;
        countries: string;
        osm_user_id?: string;
    }): Observable<HexDataType[]> {

        const isUserQuery = !!params.osm_user_id;
        const endpoint = isUserQuery ? '/user/h3' : '/stats/h3';

        let reqParamUrl = `hashtag=${params['hashtag']}&startdate=${params['start']}&enddate=${params['end']}&topic=${params['topic']}&resolution=${params['resolution']}&countries=${params['countries']}`
        if (isUserQuery) {
            reqParamUrl = `userId=${params.osm_user_id}&${reqParamUrl}`
        }
        return this.http.get(
            `${this.url}${endpoint}?${reqParamUrl}`,
            {responseType: 'text', headers: {"Authorization": this.key().key}}
        ).pipe(
            map(csv => this.h3Parser(csv))
        );
    }

    toggleLiveMode(mode: boolean) {
        this.bsLive.next(mode)
    }

}
