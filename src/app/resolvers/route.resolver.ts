import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';

import { DataService } from '../data.service';

@Injectable({
  providedIn: 'root'
})
export class RouteResolver implements Resolve<Observable<any>> {
  
  constructor(private dataService: DataService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    console.log('>>> RouteResolver >>> ', route.params)
    return this.dataService.requestSummary(route.params)
  }
}
