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

  describe('resolve', () => {
    it('should call requestSummary on DataService with route params', () => {
      const params = { id: '123' };
      const route = new ActivatedRouteSnapshot();
      route.params = params;
      const state = {} as RouterStateSnapshot;

      dataService.requestSummary.and.returnValue(of({ /* mocked response */ }));

      resolver.resolve(route, state).subscribe(() => {
        expect(dataService.requestSummary).toHaveBeenCalledWith(params);
      });
    });

    it('should return data from DataService', () => {
      const params = { id: '123' };
      const route = new ActivatedRouteSnapshot();
      route.params = params;
      const state = {} as RouterStateSnapshot;

      const expectedData = { /* mocked response */ };
      dataService.requestSummary.and.returnValue(of(expectedData));

      resolver.resolve(route, state).subscribe(data => {
        expect(data).toBe(expectedData);
      });
    });
  });
});
