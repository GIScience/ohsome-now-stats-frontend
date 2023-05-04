import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable()
export class DataService {
  
  url = environment.ohsomeStatsServiceUrl
  private queryParams: any = {}
  private bsSummaryData = new BehaviorSubject<ISummaryData | null>(null)
  summaryData = this.bsSummaryData.asObservable()

  constructor(private http: HttpClient) { }
  
  requestSummary(params: any): Observable<any> {
    // console.log('>>> DataService >>> requestSummary ', params)

    if(params && params['hashtags'])
      return this.requestSummaryWithHashtag(params)
    
    else
      return this.requestSummaryWithoutHashtag(params)
    
    // const formData = new FormData();
    // Object.keys(param).forEach(key => formData.append(key, param[key]));
  }

  requestSummaryWithHashtag(params: any) {
    return this.http.get(`${this.url}/stats/${params['hashtags']}?startdate=${params['start']}&enddate=${params['end']}`);
  }
  
  requestSummaryWithoutHashtag(params: any) {
    return this.http.get(`${this.url}/stats_static`);
  }

  getSummary() {
    // return this.bsSummaryData.getValue()
    return this.summaryData
  }

  setSummary(data: ISummaryData) {
    this.bsSummaryData.next(data)
  }

  getQueryParams() {
    return this.queryParams  
  }

  setQueryParams(qP: any) {
    this.queryParams = qP
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
