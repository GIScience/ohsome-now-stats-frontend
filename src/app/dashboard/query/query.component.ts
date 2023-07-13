import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataService, IQueryData } from '../../data.service';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnInit, OnChanges {

  @Input() data: IQueryData | undefined

  hashtags: string = ''
  intervals: Array<{
    label: string;
    value: string;
  }> | undefined
  interval: string | undefined // default value as 'P1M'
  selectedDateRange: any

  
  constructor(
    private dataService: DataService,
    private router: Router ) {
      this.intervals = dataService.timeIntervals
      this.interval = dataService.deafultIntervalValue
    }

  ngOnInit() {
    this.start = this.dataService.start
    this.end = this.dataService.end
  }

  ngOnChanges(): void {
    // console.log('>>> QueryComponent >>> ngOnChanges >>> this.data = ', this.data)

    if(this.data) {
      this.initFormValues(this.data)      
    }
  }

  // start date
  private _start = ''
  get start(): string {
    return this._start
  }

  /**
   *
   * @param val An ISO8601 UTC Date/Time String eg. 2010-03 or 2010-03-15 or 2010-03-15T14:20:00Z
   */
  set start(val: string) {
    this._start = val
  }

  // end date
  private _end = ''
  get end(): string {
    return this._end
  }

  /**
   *
   * @param val An ISO8601 UTC Date/Time String eg. 2010-03 or 2010-03-15 or 2010-03-15T14:20:00Z
   */
  set end(val: string) {
    this._end = val
  }

  initFormValues(data: IQueryData) {
    if(data && Object.keys(data).length !== 0) {
      // set Start and end dates
      if(data.start && data.end)
        this.selectedDateRange = {
          from: data.start,
          to: data.end
        }

      // set hashtags textarea
      this.hashtags = data.hashtags.toString()

      // set interval
      this.interval = data.interval
    }
  }

  /**
   * Called on Submit button click on the form
   */
  getStatistics() {
    // console.log('>>> QueryComponent >>> getStatistics')
    // get all values from form
    const tempEnd = new Date(this.selectedDateRange.to).toISOString()
    const tempStart = new Date(this.selectedDateRange.from).toISOString()
    // currently we support only one hashtags
    // TODO: in future, if multiple hastags a present then fire 
    // request to /group-summaries endpoint and not /stats
    const tempHashTags = this.cleanHashTags(this.hashtags)
    // console.log('formvalues = ', tempStart, tempEnd, this.interval, tempHashTags)

    // update the texfeild value
    // this.hashtags = tempHashTags

    // update the url fragment
    this.router.navigate([], { 
        fragment: `hashtags=${tempHashTags}&start=${tempStart}&end=${tempEnd}&interval=${this.interval}` 
      });
  }

  /**
   * Cleans the hastags field values
   * 
   * @param hashtags 
   * @returns string comma seperated hashtags without the symbol hashtag
   */
  cleanHashTags(hashtags: string): string {
    const cleanedHashtags = hashtags
      .trim() // Remove leading/trailing whitespace
      .split(',') // Split by commas
      .map(h => h.trim()) // Trim each hashtag
      .filter(h => h !== '') // Filter out empty hashtags
      .map(h => h.replace(/^#/, '')); // Remove '#' symbol from each hashtag if it's at the beginning

    return cleanedHashtags.join(',');
  }
}
