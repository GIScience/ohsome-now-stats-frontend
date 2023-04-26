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
  
  requestSummary(params: {}): Observable<any> {
    // const formData = new FormData();
    // Object.keys(param).forEach(key => formData.append(key, param[key]));
    return this.http.post(`${this.url}/summary`, params);
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
