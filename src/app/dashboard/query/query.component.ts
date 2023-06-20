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
  }> = [
    {label: 'hourly', value: 'PT1H'},
    {label: 'daily', value: 'P1D'},
    {label: 'weekly', value: 'P1W'},
    {label: 'monthly', value: 'P1M'},
    {label: 'quarterly', value: 'P3M'},
    {label: 'yearly', value: 'P1Y'},
  ];
  interval: string = 'P1M'
  selectedDateRange: any

  
  constructor(
    private router: Router ) {}

  ngOnInit(): void {}

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
    console.log('>>> QueryComponent >>> getStatistics')
    // get all values from form
    const tempEnd = new Date(this.selectedDateRange.to).toISOString()
    const tempStart = new Date(this.selectedDateRange.from).toISOString()
    // currently we support only one hashtags
    // TODO: in future, if multiple hastags a present then fire 
    // request to /group-summaries endpoint and not /stats
    const tempHashTags = this.cleanHashTags(this.hashtags)
    console.log('formvalues = ', tempStart, tempEnd, this.interval, tempHashTags)

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
