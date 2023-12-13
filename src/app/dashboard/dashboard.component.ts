import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {
    DataService,
    ICountryStatsData,
    IHashtag,
    IPlotData,
    IQueryParam,
    ITopicPlotData,
    ISummaryData,
    IWrappedCountryStatsData,
    IWrappedPlotData,
    IWrappedTopicCountryData,
    ITopicCountryData,
    TopicResponse,
    TopicName
} from '../data.service';
import {StatsType} from './types';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    title = 'ohsome-contribution-stats'
    isOpen = false
    activeLink = ''

    topicData!: TopicResponse
    topicPlotData!: Record<StatsType, ITopicPlotData[]>
    topicCountryData!: Record<StatsType, Array<ITopicCountryData>>

    summaryData!: ISummaryData
    plotData!: Array<IPlotData>
    countryStatsData: ICountryStatsData[] = [];

    selectedTopics: TopicName | "" = "";

    currentStats: StatsType = 'users';

    queryParams: any
    summaryMessage = ''
    hashtagsData!: Array<IHashtag> | []

    constructor(
        private dataService: DataService,
        private route: ActivatedRoute,
        private router: Router) {
    }

    ngOnInit() {

        // listener for any changes in the fragment part of the URL
        // assumption is that fragments sould never be empty as is its empty the routes
        // should be redirected to have default values
        this.route.fragment.subscribe((fragment: string | null) => {

            const queryParams = this.getQueryParamsFromFragments(fragment)
            if (queryParams !== null && this.queryParamsComplete(queryParams)) {
                // console.log('>>> DashboardComponent >>> queryParams ', queryParams, this.dataService.defaultHashtag)
                if (queryParams['hashtags'] == null)
                    queryParams['hashtags'] = this.dataService.defaultHashtag

                if (queryParams['start'] == null && queryParams['end'] == null) {
                    const defaultParams = this.dataService.getDefaultValues()
                    if (defaultParams !== null) {
                        queryParams.start = defaultParams['start']
                        queryParams.end = defaultParams['end']
                    }
                }

                if (queryParams['interval'] == null)
                    queryParams.interval = this.dataService.defaultIntervalValue

                if (queryParams['countries'] == null)
                    queryParams.countries = ''

                if (queryParams['topics'] == null)
                    queryParams.topics = ''

                this.dataService.updateURL(queryParams)

                // if all values are present then only below code is executed
                const timeRange = this.initTimeIntervals(queryParams)

                this.queryParams = queryParams

                // console.log('>>> DashboardComponent >>> queryParams ', queryParams)

                // form a appropriate message for summary data
                this.summaryMessage = this.formSummaryMessage(queryParams)


                // fire the request to API
                this.dataService.requestSummary(queryParams).subscribe({
                    next: res => {
                        // console.log('>>> res = ', res)
                        // send response data to Summary Component
                        this.summaryData = {
                            buildings: res.result.buildings,
                            users: res.result.users,
                            edits: res.result.edits,
                            roads: res.result.roads
                        }

                        this.dataService.setSummary(this.summaryData)
                    },
                    error: (err) => {
                        console.error('Error while requesting Summary data ', err)
                    }
                })


                // fire timeseries API to get plot data
                if (queryParams && queryParams['interval']) {
                    this.dataService.requestPlot(queryParams).subscribe({
                        next: (res: IWrappedPlotData) => {
                            if (res) {
                                // this.plotData = res.result
                                // add 'hashtag' and 'country' ISO codes to plotData #82
                                res.result.map((r: any) => {
                                    r['hashtag'] = queryParams['hashtags']
                                    r['countries'] = queryParams['countries']
                                })

                                // add Topics to PlotData to make them a part of CSV
                                if (queryParams['topics']) {
                                    res.result.map((r: any) => {
                                        r['topics'] = queryParams['topics']
                                    })
                                }

                                this.plotData = res.result
                            }
                        },
                        error: (err) => {
                            console.error('Error while requesting Plot data  ', err)
                        }
                    });
                }

                // fire API to get map data
                this.dataService.requestCountryStats(queryParams)
                    .subscribe((res: IWrappedCountryStatsData) => this.countryStatsData = res.result);


                this.selectedTopics = queryParams["topics"]
                // fire the requests to API
                if (queryParams && queryParams['topics']) {

                    this.dataService.requestTopic(queryParams).subscribe({
                        next: res => {
                            // send response data to Summary Component
                            this.topicData = res.result
                        },
                        error: (err) => {
                            console.error('Error while requesting Topic data ', err)
                        }
                    })

                    this.dataService.requestTopicInterval(queryParams).subscribe({
                        next: res => {
                            if (res) {
                                this.topicPlotData = res.result
                            }
                        },
                        error: (err) => {
                            console.error('Error while requesting Topic data ', err)
                        }
                    })

                    this.dataService.requestTopicCountryStats(queryParams)
                        .subscribe((res: IWrappedTopicCountryData) => {
                            this.topicCountryData = res.result
                        });

                }


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
                if (urlParams !== null) {
                    this.dataService.updateURL({
                        hashtags: queryParams && queryParams.hashtags ? queryParams.hashtags : urlParams.hashtags,
                        interval: queryParams && queryParams.interval ? queryParams.interval : urlParams.interval,
                        start: queryParams && queryParams.start ? queryParams.start : queryParams && queryParams.hashtags ? "2009-04-21T22:02:04Z" : urlParams.start,
                        end: queryParams && queryParams.end ? queryParams.end : urlParams.end,
                        countries: queryParams && queryParams.countries ? queryParams.countries : urlParams.countries,
                        topics: queryParams && queryParams.topics ? queryParams.topics : urlParams.topics,
                    })
                }
            }
        })
    }

    queryParamsComplete(params: any): boolean {
        return ["start", "end", "interval", "hashtags", "countries", "topics"].sort().join() === Object.keys(params).sort().join()
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
   * @param fragment URL fragment part
   * @returns Object with all query params sepearted
   */
  getQueryParamsFromFragments(fragment: string | null): any {
    if(fragment == null || fragment.length < 2)
      return null
    const tempQueryParams: Array<Array<string>> = fragment?.split('&')
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
        if (!queryParams)
            return `Summarized statistics for all contributions`

        let message = ''
        if (queryParams.hashtags)
            message += `Summarized statistics of contributions with 
        ${queryParams.hashtags.split(',').map((h: string) => ' #' + h)}`

        if (queryParams.start)
            message += ` from ${queryParams.start}`

        if (queryParams.end)
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


        if (queryParams && queryParams['start'] && queryParams['end']) {
            startDate = new Date(queryParams['start'])
            endDate = new Date(queryParams['end'])
        }
        // if start and end date are not present in the URL fragment then use default values
        else if (queryParams && queryParams['start'] == null && queryParams['end'] == null) {
            const defaultParams = this.dataService.getDefaultValues()
            if (defaultParams !== null) {
                startDate = new Date(defaultParams['start'])
                endDate = new Date(defaultParams['end'])
            }
        }

        if (queryParams && queryParams['interval'] == null)
            interval = this.dataService.defaultIntervalValue
        else
            interval = queryParams['interval']

        return {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            interval: interval
        }
    }
}
