import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
// import { map, catchError } from 'rxjs/operators;

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
    return this.http.get(`${this.url}/stats_static/`, params);
  }

  getSummary(): ISummaryData {
    return this.summaryData
  }

  setSummary(res: any) {
    this.summaryData = res
  }
}

export interface ISummaryData {
  contributors: number
  edits: number
  buildingEdits: number
  kmOfRoads: number
}
