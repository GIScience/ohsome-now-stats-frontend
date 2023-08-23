import { Injectable } from '@angular/core';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

import { DataService } from '../data.service';

@Injectable({
  providedIn: 'root'
})
export class RouteResolver  {
  
  constructor(private dataService: DataService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    console.log('>>> RouteResolver >>> ', route.params)
    return this.dataService.requestSummary(route.params)
  }
}
