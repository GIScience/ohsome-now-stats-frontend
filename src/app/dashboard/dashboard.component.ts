import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';

import { DataService, ISummaryData } from '../data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  title = 'ohsome-contribution-stats'
  isOpen = false
  activeLink = ''
  summaryData: ISummaryData | undefined
  plotData : any = [{
    "changesets": 18339.0,
    "users": 728.0,
    "roads": 3583436.881372036,
    "buildings": 116093.0,
    "edits": 167979.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2014-01-01T00:00:00.000Z",
    "enddate": "2015-01-01T00:00:00.000Z"
  }, {
    "changesets": 132676.0,
    "users": 4867.0,
    "roads": 69958845.22928844,
    "buildings": 1126030.0,
    "edits": 1594605.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2015-01-01T00:00:00.000Z",
    "enddate": "2016-01-01T00:00:00.000Z"
  }, {
    "changesets": 439255.0,
    "users": 16510.0,
    "roads": 248230227.0966366,
    "buildings": 5337828.0,
    "edits": 7273160.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2016-01-01T00:00:00.000Z",
    "enddate": "2017-01-01T00:00:00.000Z"
  }, {
    "changesets": 1113237.0,
    "users": 28386.0,
    "roads": 342925140.3880086,
    "buildings": 18673461.0,
    "edits": 22277239.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2017-01-01T00:00:00.000Z",
    "enddate": "2018-01-01T00:00:00.000Z"
  }, {
    "changesets": 574783.0,
    "users": 29049.0,
    "roads": 223979939.61303145,
    "buildings": 14554788.0,
    "edits": 17329823.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2018-01-01T00:00:00.000Z",
    "enddate": "2019-01-01T00:00:00.000Z"
  }, {
    "changesets": 459575.0,
    "users": 27420.0,
    "roads": 186701467.78327608,
    "buildings": 9170816.0,
    "edits": 10879559.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2019-01-01T00:00:00.000Z",
    "enddate": "2020-01-01T00:00:00.000Z"
  }, {
    "changesets": 451801.0,
    "users": 29193.0,
    "roads": 81130653.12457849,
    "buildings": 9586938.0,
    "edits": 11140997.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2020-01-01T00:00:00.000Z",
    "enddate": "2021-01-01T00:00:00.000Z"
  }, {
    "changesets": 629192.0,
    "users": 35542.0,
    "roads": 85310718.5236433,
    "buildings": 14242294.0,
    "edits": 16510855.0,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "#MissingMaps",
    "startdate": "2021-01-01T00:00:00.000Z",
    "enddate": "2022-01-01T00:00:00.000Z"
  }]
  queryParams: any;
  summaryMessage: string = '';

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute ) {}

  ngOnInit() {
    // const startDate = this.route.snapshot.paramMap.get('id')
    this.route.fragment.subscribe((fragment: string | null) => {
      const queryParams = this.getQueryParamsFromFragments()
      this.queryParams = queryParams

      // console.log('>>> DashboardComponent >>> queryParams ', queryParams)
      
      // form a appropriate message for summary data
      this.summaryMessage = this.formSummaryMessage(queryParams)

      // fire the request to API
      this.dataService.requestSummary(queryParams).subscribe( res => {
        // console.log('>>> res = ', res)
        // send response data to Summary Component
        this.summaryData = {
          buildingEdits: res!.buildings,
          contributors: res!.users,
          edits: res!.changesets,
          kmOfRoads: res!.roads
        }

        this.dataService.setSummary(this.summaryData)
      })

    })
    
  }

  getQueryParamsFromFragments(): any {
    if(this.route.snapshot.fragment == null || this.route.snapshot.fragment.length < 2)
      return null
    
    const tempQueryParams: Array<Array<string>> | any = this.route.snapshot.fragment?.split('&').map( q => [q.split('=')[0], q.split('=')[1]])
    return Object.fromEntries(tempQueryParams)
  }

  /**
   * Forms an appropriate message to be display above Summary data
   * 
   * @param queryParams 
   * @returns message 
   */
  formSummaryMessage(queryParams: any): string {
    if(!queryParams)
      return `Summarized statistics for all contributions`

    let message: string = ''
    if(queryParams.hashtags)
      message += `Summarized statistics of contributions with 
        ${queryParams.hashtags.split(',').map( (h: string) => ' #'+ h)}`

    if(queryParams.start)
      message += ` from ${queryParams.start}`

    if(queryParams.end)
      message += ` till ${queryParams.end}`

    return message
  }
}
