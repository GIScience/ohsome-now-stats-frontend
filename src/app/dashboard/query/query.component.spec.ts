import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import {AutocompleteLibModule} from 'angular-ng-autocomplete';

import { of } from 'rxjs'; 
import { QueryComponent } from './query.component';
import { DataService } from 'src/app/data.service';
import { ToastService } from 'src/app/toast.service';
import { SelectDropDownModule } from 'ngx-select-dropdown'

describe('QueryComponent', () => {
  let component: QueryComponent;
  let fixture: ComponentFixture<QueryComponent>;

  // Create a mock DataService with the necessary methods
  const dataServiceMock = {
    getMetaData: jasmine.createSpy('getMetaData').and.returnValue(of({ start: '2009-04-21T20:02:04Z', end: '2023-08-02T10:21:31Z' })),
    requestAllHashtags: jasmine.createSpy('requestAllHashtags').and.returnValue(of(['missingmaps', 'hotosm-project-1'])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QueryComponent],
      imports: [
        RouterTestingModule, 
        FormsModule, 
        NgxDaterangepickerMd.forRoot(),
        SelectDropDownModule,
        AutocompleteLibModule
      ],
      providers: [
        { provide: DataService, useValue: dataServiceMock },
        { provide: ToastService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('cleanHashTags', () => {
    it('should return empty string for empty input', () => {
      const input = '';
      const expectedOutput = '';
      expect(component.cleanHashTags(input)).toEqual(expectedOutput);
    });
  
    it('should remove whitespace and commas and hashtags', () => {
      const input = ' #hashtag1, #hashtag2, missingmap, hashtag3, #hashtag4 ';
      const expectedOutput = 'hashtag1,hashtag2,missingmap,hashtag3,hashtag4';
      expect(component.cleanHashTags(input)).toEqual(expectedOutput);
    });
  
    it('should remove leading/trailing whitespace, but keep internal whitespace in hashtags', () => {
      const input = ' #hashtag, #hashtag-with-hyphen, #hashtag_with_underscore ';
      const expectedOutput = 'hashtag,hashtag-with-hyphen,hashtag_with_underscore';
      expect(component.cleanHashTags(input)).toEqual(expectedOutput);
    });
  
    it('should handle input string with single hashtag and no commas', () => {
      const input = ' #hashtag ';
      const expectedOutput = 'hashtag';
      expect(component.cleanHashTags(input)).toEqual(expectedOutput);
    });
  
    it('should handle input string with single hashtag and comma', () => {
      const input = ' #hashtag, ';
      const expectedOutput = 'hashtag';
      expect(component.cleanHashTags(input)).toEqual(expectedOutput);
    });
  
    it('should handle input string with multiple commas in a row', () => {
      const input = ' #hashtag1,,, #hashtag2, , #hashtag3 ';
      const expectedOutput = 'hashtag1,hashtag2,hashtag3';
      expect(component.cleanHashTags(input)).toEqual(expectedOutput);
    });
  });
  
});

