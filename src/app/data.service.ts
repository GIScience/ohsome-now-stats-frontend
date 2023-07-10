import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';

import { environment } from '../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable()
export class DataService {
  
  url = environment.ohsomeStatsServiceUrl
  private metadata!: Observable<any>
  private bsSummaryData = new BehaviorSubject<ISummaryData | null>(null)
  summaryData = this.bsSummaryData.asObservable()
  abortHashtagReqSub!: Subject<void> 
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
  deafultIntervalValue = 'P1M'
  start!: string
  end!: string

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router) { 
      this.getAbortHashtagReqSubject()
      this.getAbortSummaryReqSubject()
      this.getAbortIntervalReqSubject()
  }

  // will be called by APP_INITIALIZER provider in app.module.ts on the start of the application
  requestMetadata() {
    return this.http.get(`${this.url}/metadata`).subscribe( (meta: any) => {
      // console.log('>>> DataService >>> meta = ', meta)
      this.end = new Date(meta.result.max_timestamp).toISOString()

      let tempStart = new Date(meta.result.max_timestamp)
      tempStart.setDate(tempStart.getDate() - 365)

      this.start = tempStart.toISOString()

      // if URL params are empty then fill it with default values
      if(this.route.snapshot.fragment == null)
        this.router.navigate([], { 
          fragment: `hashtags=${this.defaultHashtag}&start=${this.start}&end=${this.end}&interval=${this.deafultIntervalValue}` 
        })
    })
    
  }

  getMetaData(): IMetaData {
    return {
      start: this.start,
      end: this.end
    }
  }
  
  requestSummary(params: any): Observable<any> {
    // console.log('>>> DataService >>> requestSummary ', params)
    if(params && params['hashtags'])
      return this.requestSummaryWithHashtag(params)
    
    else
      return this.requestSummaryWithoutHashtag(params)
    
  }

  requestSummaryWithHashtag(params: any) {
    return this.http.get(`${this.url}/stats/${params['hashtags']}?startdate=${params['start']}&enddate=${params['end']}`)
      .pipe(
        takeUntil(this.abortSummaryReqSub)
      )
  }
  
  requestSummaryWithoutHashtag(params: any) {
    return this.http.get(`${this.url}/stats_static`)
      .pipe(
        takeUntil(this.abortSummaryReqSub)
      )
  }

  requestPlot(params: any): Observable<IWrappedPlotData> {
    return this.http.get<IWrappedPlotData>(`${this.url}/stats/${params['hashtags']}/interval?startdate=${params['start']}&enddate=${params['end']}&interval=${params['interval']}`)
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

  getTrendingHashtags(params: any) {
    // console.log('>>> getTrendingHashtags >>> ', params)
    return this.http.get(`${this.url}/mostUsedHashtags?startdate=${params['start']}&enddate=${params['end']}&limit=${params['limit']}`)
    .pipe(
      takeUntil(this.abortHashtagReqSub)
    )
  }

  /**
   * Gives the default values for application
   * 
   * @returns IQueryParam
   */
  getDefaultValues(): IQueryParam {
    const defaultHashtag = 'missingmaps'
    let tempStart = new Date()
    let tempEnd = new Date()

    tempStart.setDate(tempStart.getDate() - 366)
    tempStart.setMilliseconds(0)

    tempEnd.setDate(tempEnd.getDate() - 1)
    tempEnd.setMilliseconds(0)

    return {
      start: tempStart.toISOString(),
      end: tempEnd.toISOString(),
      hashtags: defaultHashtag,
      interval: this.deafultIntervalValue
    }
  }

}

export interface ISummaryData {
  contributors: number
  edits: number
  buildingEdits: number
  kmOfRoads: number
}

export interface IQueryData {
  start: string
  end: string
  hashtags: Array<string>
  interval: string
}

export interface IWrappedPlotData {
  result: Array<IPlotData>
}

export interface IPlotData {
  changesets: number,
  users: number,
  roads: number,
  buildings: number,
  edits: number,
  latest: string,
  hashtag: string,
  startdate: string,
  enddate: string
}

export interface ITrendingHashtags {
  result: any
}

export interface IQueryParam {
  hashtags: string, 
  start: string, // date in ISO format, ensure to keep milliseconds as 0
  end: string, // date in ISO format, ensure to keep milliseconds as 0
  interval: string, // eg:'P1D' default value: 'P1M'
}

export interface IHashtag {
  hashtagTitle: string;
  hashtag: string,
  number_of_users: number,
  tooltip: string,
  percent: number
}

export interface IMetaData {
  start: string, // date in ISO format, ensure to keep milliseconds as 0
  end: string, // date in ISO format, ensure to keep milliseconds as 0
}