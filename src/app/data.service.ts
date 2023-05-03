import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable()
export class DataService {
  
  url = environment.ohsomeStatsServiceUrl;

  private summaryData: ISummaryData | any = {
    contributors: 3625,
    edits: 570230,
    buildingEdits: 1536511,
    kmOfRoads: 11277
  }
  private queryParams: any = {}

  constructor(private http: HttpClient) { }
  
  requestSummary(params: any): Observable<any> {

    if(params['hashtags'])
      return this.requestSummaryWithHashtag(params)
    
    else
      return this.requestSummaryWithoutHashtag(params)
    
    // const formData = new FormData();
    // Object.keys(param).forEach(key => formData.append(key, param[key]));
  }

  requestSummaryWithHashtag(params: any) {
    return this.http.get(`${this.url}/stats/${params['hashtags']}`);
  }
  
  requestSummaryWithoutHashtag(params: any) {
    return this.http.get(`${this.url}/stats_static`, params);
  }

  getSummary(): ISummaryData {
    return this.summaryData
  }

  setSummary(res: any) {
    this.summaryData = res
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
