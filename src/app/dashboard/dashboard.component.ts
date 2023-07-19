import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';

import { DataService, IHashtag, IPlotData, IQueryParam, ISummaryData, IWrappedPlotData } from '../data.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  title = 'ohsome-contribution-stats'
  isOpen = false
  activeLink = ''
  summaryData!: ISummaryData
  plotData! : Array<IPlotData>
  queryParams: any
  summaryMessage: string = ''
  hashtagsData!: Array<IHashtag> | []
  route: any;
  router: any;

  constructor(
    private dataService: DataService,
    route: ActivatedRoute,
    router: Router ) {
      this.route = route
      this.router = router
    }

  ngOnInit() {

    // listener for any changes in the fragment part of the URL
    // assumption is that fragments sould never be empty as is its empty the routes 
    // should be redirected to have default vlaues
    this.route.fragment.subscribe((fragment: string | null) => {

      const queryParams = this.getQueryParamsFromFragments(fragment)
      if(queryParams !== null ) {
        console.log('>>> DashboardComponent >>> queryParams ', queryParams, this.dataService.defaultHashtag)
        if(queryParams['hashtags'] == null)
          queryParams['hashtags'] = this.dataService.defaultHashtag

        if(queryParams['start'] == null && queryParams['end'] == null) {
          const defaultParams = this.dataService.getDefaultValues()
          if(defaultParams !== null) {
            queryParams.start = defaultParams['start']
            queryParams.end = defaultParams['end']
          }
        }

        if(queryParams['interval'] == null) 
          queryParams.interval = this.dataService.deafultIntervalValue

        this.dataService.updateURL(queryParams)

        // if all values are present then only below code is executed
        let timeRange: any
        timeRange = this.initTimeIntervals(queryParams)

        this.queryParams = queryParams

        // console.log('>>> DashboardComponent >>> queryParams ', queryParams)
        
        // form a appropriate message for summary data
        this.summaryMessage = this.formSummaryMessage(queryParams)

        // fire the request to API
        this.dataService.requestSummary(queryParams).subscribe( {
          next: res => {
            // console.log('>>> res = ', res)
            // send response data to Summary Component
            this.summaryData = {
              buildingEdits: res!.buildings,
              contributors: res!.users,
              edits: res!.edits,
              kmOfRoads: res!.roads
            }

            this.dataService.setSummary(this.summaryData)
          },
          error: (err) => {
            console.error('Error while requesting Summary data ', err)
          }
        })

        // fire timeseries API to get plot data 
        if(queryParams && queryParams['interval']) 
          this.dataService.requestPlot(queryParams).subscribe({
            next: (res: IWrappedPlotData) => {
              if(res) {
                this.plotData = res.result
              }
            },
            error: (err) => {
              console.error('Error while requesting Plot data  ', err)
            }
          })

        // stop trending hashtag request if already fired any
        this.stopHashtagReq()
        // fire trending hashtag API
        this.dataService.getTrendingHashtags({
          start: timeRange.start,
          end: timeRange.end,
          limit: this.dataService.trendingHashtagLimit
        }).subscribe({ 
          next: (res: any) => {
            // console.log('>>> getTrendingHashtags >>> res = ', res)
            this.hashtagsData = res.result
          },
          error: (err) => {
            console.error('Error while requesting TRending hashtags data  ', err)
          }
        })
      } else {
        // resolve #26
        const urlParams = this.dataService.getDefaultValues()
        // if URL params are empty then fill it with default values
        if(urlParams !== null)
        this.dataService.updateURL({
          hashtags: urlParams.hashtags,
          interval: urlParams.interval,
          start: urlParams.start,
          end: urlParams.end
        })
      }
    })
    
  }

  stopIntervalReq() {
    // stop all previous request, if waiting for its response
    this.dataService.abortIntervalReqSub.next()
    // this.dataService.abortIntervalReqSub.unsubscribe()
    // this.dataService.getAbortIntervalReqSubject()
    this.dataService.abortIntervalReqSub.complete()
  }

  stopSummaryReq() {
    // stop all previous request, if waiting for its response
    this.dataService.abortSummaryReqSub.next()
    // this.dataService.abortSummaryReqSub.unsubscribe()
    // this.dataService.getAbortSummaryReqSubject()
    this.dataService.abortSummaryReqSub.complete()
  }

  stopHashtagReq() {
    // stop all previous request, if waiting for its response
    this.dataService.abortHashtagReqSub.next()
    this.dataService.abortHashtagReqSub.unsubscribe()
    this.dataService.getAbortHashtagReqSubject()
    // this.dataService.abortHashtagReqSub.complete()
  }

  /**
   * Creates query param from enitre fragment of the URL
   * 
   * @param String URL fragment part
   * @returns Object with all query params sepearted
   */
  getQueryParamsFromFragments(fragment: string | null): any {
    if(fragment == null || fragment.length < 2)
      return null
    
    const tempQueryParams: Array<Array<string>> | any = fragment?.split('&')
        .map( q => [q.split('=')[0], q.split('=')[1]])
    return Object.fromEntries(tempQueryParams)
  }

  /**
   * Forms an appropriate message to be display above Summary data
   * 
   * @param queryParams 
   * @returns message 
   */
  formSummaryMessage(queryParams: IQueryParam): string {
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

  initTimeIntervals(queryParams: IQueryParam) {

    let startDate = new Date()
    let endDate = new Date()
    let interval: string

    // startDate.setDate(startDate.getDate() - 365)
    startDate.setMilliseconds(0)
    
    endDate.setDate(endDate.getDate() - 1)
    endDate.setMilliseconds(0)

    
    if(queryParams && queryParams['start'] && queryParams['end']) {
      startDate = new Date(queryParams['start'])
      endDate = new Date(queryParams['end'])
    }
    // if start and end date are not present in the URL fragment then use default values
    else if(queryParams && queryParams['start'] == null && queryParams['end'] == null) {
      const defaultParams = this.dataService.getDefaultValues()
      if(defaultParams !== null) {
        startDate = new Date(defaultParams['start'])
        endDate = new Date(defaultParams['end'])
      }
    }

    if(queryParams && queryParams['interval'] == null) 
      interval = this.dataService.deafultIntervalValue
    else
      interval = queryParams['interval']

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      interval: interval
    } 
  }
}
