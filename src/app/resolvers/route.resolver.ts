import { Injectable } from '@angular/core';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { DataService, IWrappedSummaryData } from '../data.service';

@Injectable({
  providedIn: 'root'
})
export class RouteResolver  {
  
  constructor(private dataService: DataService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IWrappedSummaryData> {
    console.log('>>> RouteResolver >>> ', route.params, state)
    return this.dataService.requestSummary(route.params)
  }
}
