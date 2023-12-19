import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DataService} from '../data.service';
import {
    StatsType, ICountryStatsData,
    IHashtag,
    IPlotData,
    IQueryParam,
    ITopicPlotData,
    ISummaryData,
    IWrappedCountryStatsData,
    IWrappedPlotData,
    IWrappedTopicCountryData,
    ITopicCountryData,
    TopicName,
    TopicValues
} from './types';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    summaryData!: ISummaryData
    plotData!: Array<IPlotData>
    countryWithTopic: ICountryStatsData[] = [];
    selectedTopics: TopicName | "" = "";
    currentStats: StatsType = 'users';
    queryParams: any
    summaryMessage = ''
    hashtagsData!: Array<IHashtag> | []
    isSummaryLoading = false;
    isPlotsLoading = false;
    isCountriesLoading = false;
    isHashtagsLoading = false;

    constructor(
        private dataService: DataService,
        private route: ActivatedRoute) {
    }

    ngOnInit() {

        // listener for any changes in the fragment part of the URL
        // assumption is that fragments sould never be empty as is its empty the routes
        // should be redirected to have default values
        this.route.fragment.subscribe((fragment: string | null) => {
            this.isSummaryLoading = true;
            this.isHashtagsLoading = true;
            this.isPlotsLoading = true;
            this.isCountriesLoading = true;
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
                        const tempSummaryData = res.result
                        // fire the requests to API
                        if (queryParams && queryParams['topics']) {

                            this.dataService.requestTopic(queryParams).subscribe({
                                next: res => {
                                    // send response data to Summary Component
                                    const input: { [key: string]: TopicValues } = res.result
                                    const topicValue: { [key: string]: number } = {};

                                    // Iterate over the keys and extract the 'value'
                                    for (const key in input) {
                                        if (Object.prototype.hasOwnProperty.call(input, key)) {
                                            topicValue[key] = input[key].value;
                                        }
                                    }

                                    // send response data to Summary Component
                                    this.summaryData = {
                                        changesets: tempSummaryData.changesets,
                                        buildings: tempSummaryData.buildings,
                                        users: tempSummaryData.users,
                                        edits: tempSummaryData.edits,
                                        roads: tempSummaryData.roads,
                                        latest: tempSummaryData.latest,
                                        ...topicValue,
                                        hashtag: queryParams['hashtags']
                                    }
                                },
                                error: (err) => {
                                    console.error('Error while requesting Topic data ', err)
                                }
                            })
                        } else {
                            // send response data to Summary Component
                            this.summaryData = {
                                changesets: tempSummaryData.changesets,
                                buildings: tempSummaryData.buildings,
                                users: tempSummaryData.users,
                                edits: tempSummaryData.edits,
                                roads: tempSummaryData.roads,
                                latest: tempSummaryData.latest,
                                hashtag: queryParams['hashtags']
                            }
                        }
                        this.isSummaryLoading = false;

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
                                // add 'hashtag' and 'country' ISO codes to plotData #82
                                res.result.map((r: any) => {
                                    r['hashtag'] = queryParams['hashtags']
                                    r['countries'] = queryParams['countries']
                                })

                                const tempPlotResponse = res.result
                                // add Topics to PlotData to make them a part of CSV
                                if (queryParams['topics']) {
                                    this.dataService.requestTopicInterval(queryParams).subscribe({
                                        next: res => {
                                            if (res) {
                                                // add each Topic data to Plot data to make them a part of CSV
                                                this.plotData = this.addTopicDataToPlot(res.result, tempPlotResponse)
                                            }
                                        },
                                        error: (err) => {
                                            console.error('Error while requesting Topic data ', err)
                                        }
                                    })
                                } else {
                                    // if non Topic is selected only countryData is sent to MapComponent
                                    this.plotData = tempPlotResponse
                                }
                                this.isPlotsLoading = false;
                            }
                        },
                        error: (err) => {
                            console.error('Error while requesting Plot data  ', err)
                        }
                    });
                }

                // fire API to get map data
                this.dataService.requestCountryStats(queryParams)
                    .subscribe((res: IWrappedCountryStatsData) => {
                        // add 'hashtag'
                        res.result.map((r: any) => {
                            r['hashtag'] = queryParams['hashtags']
                        })

                        const tempCountryResponse = res.result
                        if (queryParams && queryParams['topics']) {
                            this.dataService.requestTopicCountryStats(queryParams)
                                .subscribe((res: IWrappedTopicCountryData) => {
                                    // add each Topic to Map data to make them a part of CSV
                                    this.countryWithTopic = this.addTopicDataToCountries(res.result, tempCountryResponse)
                                });
                        } else {
                            // if non Topic is selected only countryData is sent to MapComponent
                            this.countryWithTopic = tempCountryResponse
                        }
                        this.isCountriesLoading = false;
                    });

                this.selectedTopics = queryParams["topics"]


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
                        this.isHashtagsLoading = false;
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
                        start: queryParams && queryParams.start ? queryParams.start : urlParams.start,
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
        if (fragment == null || fragment.length < 2)
            return null
        const tempQueryParams: Array<Array<string>> = fragment?.split('&')
            .map(q => [q.split('=')[0], q.split('=')[1]])
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

    addTopicDataToCountries(res: Record<StatsType, ITopicCountryData[]>, countryData: ICountryStatsData[]) {
        // console.log('>>> addTopicDataToCountries ', res, countryData)

        const mergedData: any[] = [];

        countryData.forEach(country => {
            const countryCode = country.country;
            const countryEntry: any = {
                ...country,
            };

            Object.keys(res).forEach(topic => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const matchingData = res[topic].find(data => data.country === countryCode);
                countryEntry[topic] = matchingData ? matchingData.value : 0;
            });

            mergedData.push(countryEntry);
        });

        // console.log('mergedData = ', mergedData)
        return mergedData;
    }

    private addTopicDataToPlot(res: Record<string, Array<ITopicPlotData>>, plotData: Array<IPlotData>) {
        const mergedData: any[] = [];

        // Create a map for faster topic lookup
        const topicMap: Record<string, ITopicPlotData[]> = {};
        Object.keys(res).forEach((topic) => {
            topicMap[topic] = res[topic];
        });

        plotData.forEach((p) => {
            const startDate = p.startDate;
            const endDate = p.endDate;
            const plotEntry: any = {
                ...p,
            };

            // Iterate over topics directly instead of using Object.keys
            for (const topic in topicMap) {
                if (Object.prototype.hasOwnProperty.call(topicMap, topic)) {
                    const matchingData = topicMap[topic].find(
                        (data) => data.startDate === startDate && data.endDate === endDate
                    );
                    plotEntry[topic] = matchingData ? matchingData.value : 0;
                }
            }

            mergedData.push(plotEntry);
        });

        // console.log('mergedData = ', mergedData)
        return mergedData;
    }

}
