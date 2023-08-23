import { TestBed } from '@angular/core/testing';

import { RouteResolver } from './route.resolver';
import { DataService } from '../data.service';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';

describe('RouteResolver', () => {
  let resolver: RouteResolver;
  let dataService: jasmine.SpyObj<DataService>;

  beforeEach(() => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', ['requestSummary']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        RouteResolver,
        { provide: DataService, useValue: dataServiceSpy }
      ]
    });
    resolver = TestBed.inject(RouteResolver);
    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

});
