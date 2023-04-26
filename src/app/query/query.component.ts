import { Component, Input, OnInit } from '@angular/core';

// import { Datepicker } from 'vanillajs-datepicker';
import { DateRangePicker } from 'vanillajs-datepicker';
import { DataService } from '../data.service';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnInit{

  // if permalink values are present otherwise default values
  @Input() options = {startDate: null, endDate: null, hashtags: [], projectIds: []};
  
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // const elem: HTMLElement | null = document.querySelector('input[name="startDate"]');
    const dateRangeEle = document.getElementById('dateRange')
    if(dateRangeEle){
      const rangepicker = new DateRangePicker(dateRangeEle, {
        // ...options
      }); 
    }
  }

  // start date
  private _start = '';
  get start(): string {
    return this._start;
  }

  /**
   *
   * @param val An ISO8601 UTC Date/Time String eg. 2010-03 or 2010-03-15 or 2010-03-15T14:20:00Z
   */
  set start(val: string) {
    this._start = val;
    // const timeParts = this.value.split('/');
    // timeParts[0] = val;
    // this.value = timeParts.join('/');
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
