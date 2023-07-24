import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataService, IQueryData } from '../../data.service';
import { ToastService } from 'src/app/toast.service';

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
  private _start = ''
  private _end = ''
  
  constructor(
    private dataService: DataService,
    private router: Router,
    private toastService: ToastService ) {
      this.intervals = dataService.timeIntervals
      this.interval = dataService.defaultIntervalValue
    }

  ngOnInit() {

    // listener to metaData request, 
    // theoritically should be called only once as metaData request 
    // is fired only at the start of application
    // but it is called twice since first time it is due to its assignment to null
    this.dataService.getMetaData().subscribe( metaData => {
      if(metaData && metaData.start && metaData.end) {
        this.start = metaData?.start
        this.end = metaData?.end
      }
    })
  }

  ngOnChanges(): void {
    // console.log('>>> QueryComponent >>> ngOnChanges >>> this.data = ', this.data)

    if(this.data) {
      this.initFormValues(this.data)      
    }
  }

  // start date
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

  /**
   * Initializes form values which are passes from parent component
   * 
   * @param data 
   */
  initFormValues(data: IQueryData) {
    if(data && Object.keys(data).length !== 0) {
      if(!(data.start && data.end)) {
        console.log('date range is null')
      }
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
    if(!this.validateForm())
      return
      
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
    })
  }

  /**
   * Validates the form values before its being fired to API
   */
  validateForm(): boolean {
    // console.log('>>> validateForm >>> this.hashtags ', this.hashtags)
    if(this.hashtags === ''){
      console.error('Hashtag is empty')
      // show the message on toast
      this.toastService.show({
        title: 'Hashtag is empty',
        body: 'Please provide a Hashtag',
        type: 'error'
      })

      const hashtagsEle = document.getElementById('hastags')
      if(hashtagsEle){
        hashtagsEle.focus()
      }
      return false
    }

    if(!(this.selectedDateRange.to && this.selectedDateRange.to)) {
      console.error('Date range is empty')
      // show the message on toast
      this.toastService.show({
        title: 'Date range is empty',
        body: 'Please provide a valid Date range',
        type: 'error'
      })

      // let dateRangeEle1 = document.getElementsByName('dateRange')[0]
      let dateRangeEle = document.getElementById('dateRange')
      // dateRangeEle?.classList.remove('ng-valid')
      // dateRangeEle?.classList.add('ng-invalid')
      dateRangeEle?.classList.add(...['was-validated','form-control:invalid','form-control.is-invalid'])
      if(dateRangeEle) {
        // let dateRangeEle = dateRangeEle1.previousElementSibling
        // if(dateRangeEle) {
        // dateRangeEle.focus()
        // dateRangeEle.style.cssText += "border: 5px solid red"
        // console.log('dateRangeEle = ', dateRangeEle)
        // }
      }
      return false
    }

    return true
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
