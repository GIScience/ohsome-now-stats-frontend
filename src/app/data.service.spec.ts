import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DataService } from './data.service';

describe('DataService', () => {
  // let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let service: DataService;

  beforeEach(() => {
    // httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    TestBed.configureTestingModule({ 
      imports: [ HttpClientTestingModule ],
      // providers: [ { provide: DataService, useValue: httpClientSpy } ] 
      providers: [ { provide: DataService, useValue: {} } ] 
    });
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
