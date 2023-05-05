import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryComponent } from './query.component';

describe('QueryComponent', () => {
  let component: QueryComponent;
  let fixture: ComponentFixture<QueryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QueryComponent ]
    })
    .compileComponents();

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
      const input = ' #hashtag with spaces, #hashtag-with-hyphen, #hashtag_with_underscore ';
      const expectedOutput = 'hashtag with spaces,hashtag-with-hyphen,hashtag_with_underscore';
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

