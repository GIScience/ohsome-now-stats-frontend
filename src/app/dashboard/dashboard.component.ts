import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';

import { DataService, IPlotData, ISummaryData, IWrappedPlotData } from '../data.service';

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
  plotData! : Array<IPlotData>
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

      // fire timeseries API to get plot data 
      if(queryParams && queryParams['interval']) 
      this.dataService.requestPlot(queryParams).subscribe( (res: IWrappedPlotData) => {
        if(res) {
          this.plotData = res.result
        }
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
