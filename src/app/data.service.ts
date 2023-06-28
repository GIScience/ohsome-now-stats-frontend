import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable()
export class DataService {
  
  url = environment.ohsomeStatsServiceUrl
  private bsSummaryData = new BehaviorSubject<ISummaryData | null>(null)
  summaryData = this.bsSummaryData.asObservable()
  trendingHashtagLimit = 10

  constructor(private http: HttpClient) { }
  
  requestSummary(params: any): Observable<any> {
    // console.log('>>> DataService >>> requestSummary ', params)

    if(params && params['hashtags'])
      return this.requestSummaryWithHashtag(params)
    
    else
      return this.requestSummaryWithoutHashtag(params)
    
  }

  requestSummaryWithHashtag(params: any) {
    return this.http.get(`${this.url}/stats/${params['hashtags']}?startdate=${params['start']}&enddate=${params['end']}`);
  }
  
  requestSummaryWithoutHashtag(params: any) {
    return this.http.get(`${this.url}/stats_static`);
  }

  requestPlot(params: any): Observable<IWrappedPlotData> {
    return this.http.get<IWrappedPlotData>(`${this.url}/stats/${params['hashtags']}/interval?startdate=${params['start']}&enddate=${params['end']}&interval=${params['interval']}`);
  }

  getSummary() {
    // return this.bsSummaryData.getValue()
    return this.summaryData
  }

  setSummary(data: ISummaryData) {
    this.bsSummaryData.next(data)
  }

  getTrendingHashtags(params: any) {
    if(params && params['start'] && params['end']) 
      return this.requestTrendingHashtagsInTimeRange(params)
    else 
      return this.requestTrendingHashtags(params)
  }

  requestTrendingHashtagsInTimeRange(params: any) {
    return this.http.get(`${this.url}/trending?startdate=${params['start']}&enddate=${params['end']}&limit=${this.trendingHashtagLimit}`);
  }

  requestTrendingHashtags(params: any) {
    return this.http.get(`${this.url}/trending?limit=${this.trendingHashtagLimit}`);
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