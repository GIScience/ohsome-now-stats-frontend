import { Component, Input, OnInit } from '@angular/core';

// import { Datepicker } from 'vanillajs-datepicker';
import { DateRangePicker } from 'vanillajs-datepicker';
import { DataService, IQueryData } from '../data.service';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnInit{

  // if permalink values are present otherwise default values
  // @Input() data = {startDate: null, endDate: null, hashtags: [], projectIds: []};
  private data: IQueryData | undefined
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

  
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.data = this.dataService.getQueryParams()
    // console.log('>>> QueryComponent >>> this.data = ', this.data)

    // const elem: HTMLElement | null = document.querySelector('input[name="startDate"]');
    const dateRangeEle = document.getElementById('dateRange')
    if(dateRangeEle){
      const rangepicker = new DateRangePicker(dateRangeEle, {
        // ...options
        format: 'yyyy-mm-dd'
      }) 
      
      this.initFormValues(rangepicker)
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
    // const timeParts = this.value.split('/')
    // timeParts[0] = val
    // this.value = timeParts.join('/')
  }

  initFormValues(rangepicker: DateRangePicker) {
    if(this.data && Object.keys(this.data).length !== 0) {
      // set Start and end dates
      if(this.data.start && this.data.end)
        rangepicker.setDates(new Date(this.data.start), new Date(this.data.end))
      
      if(this.data.start && this.data.end === '')
        rangepicker.setDates(new Date(this.data.start), new Date())

      if(this.data.start === '' && this.data.end === '')
        rangepicker.setDates(new Date('2007-01-01'), new Date())

      // set hashtags textarea
      this.hashtags = this.data.hashtags.toString()

      // set interval
      this.interval = this.data.interval
    }
  }

  getStatistics() {
    console.log('>>> QueryComponent >>> submit')
    let params = {}

    this.dataService.requestSummary(params).subscribe( res => {
      console.log('res ', res)
      this.dataService.setSummary(res)
    })
  }
}
