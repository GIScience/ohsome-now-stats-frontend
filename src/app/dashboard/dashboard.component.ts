import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import dayjs from "dayjs";
import {DataService} from '../data.service';
import {
    ICountryStatsData,
    IDateRange,
    IHashtag,
    IPlotData,
    IQueryParam,
    ISummaryData,
    ITopicCountryData,
    ITopicPlotData,
    IWrappedCountryStatsData,
    IWrappedPlotData,
    IWrappedTopicCountryData,
    StatsType,
    TopicName,
    TopicValues
} from './types';
import {ToastService} from "../toast.service";
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit {

    summaryData!: ISummaryData;
    topicData!: { [p: string]: number } | null;
    plotData!: IPlotData;
    countryWithTopic: ICountryStatsData[] = [];
    selectedTopics: TopicName | "" = "";
    currentStats: StatsType = 'users';
    queryParams: any;
    summaryMessage = '';
    hashtagsData!: Array<IHashtag> | [];
    isSummaryLoading = false;
    isPlotsLoading = false;
    isCountriesLoading = false;
    isHashtagsLoading = false;
    selectedDateRange!: IDateRange

    constructor(
        private dataService: DataService,
        private route: ActivatedRoute,
        private toastService: ToastService) {
    }

    ngOnInit() {

        // listener for any changes in the fragment part of the URL
        // assumption is that fragments should never be empty as is its empty the routes
        // should be redirected to have default values
        this.route.fragment.subscribe(() => {
            this.isSummaryLoading = true;
            this.isHashtagsLoading = true;
            this.isPlotsLoading = true;
            this.isCountriesLoading = true;
            const queryParams = this.dataService.getQueryParamsFromFragments()

            if (queryParams === null || !this.queryParamsComplete(queryParams)) {
                this.setDefaultValues(queryParams)
                return
            }

            queryParams.hashtag = this.checkHashtagParameter(queryParams["hashtag"])

            queryParams.start = this.setQueryParamOrDefault("start", queryParams)
            queryParams.end = this.setQueryParamOrDefault("end", queryParams)
            queryParams.interval = this.setQueryParamOrDefault("interval", queryParams)

            queryParams.interval = this.checkIntervalParameter(queryParams["interval"], queryParams)

            if (queryParams['countries'] == null)
                queryParams.countries = ''

            if (queryParams['topics'] == null)
                queryParams.topics = ''

            this.queryParams = queryParams

            // form a appropriate message for summary data
            this.summaryMessage = this.formSummaryMessage(queryParams)
            // fire the request to API
            this.requestsToAPI()
        })
    }


    requestsToAPI() {
        if (!this.queryParams) {
            console.error('queryParams was empty')
            return
        }
        const timeRange = this.initTimeIntervals(this.queryParams)
        Object.assign(this.queryParams, timeRange)
        this.dataService.requestSummary(this.queryParams).subscribe({
            next: res => {
                // console.log('>>> res = ', res)
                const tempSummaryData = res.result
                // fire the requests to API
                // send response data to Summary Component
                this.summaryData = {
                    changesets: tempSummaryData.changesets,
                    buildings: tempSummaryData.buildings,
                    users: tempSummaryData.users,
                    edits: tempSummaryData.edits,
                    roads: tempSummaryData.roads,
                    latest: tempSummaryData.latest,
                    hashtag: decodeURIComponent(this.queryParams['hashtag']),
                    startDate: this.queryParams['start'],
                    endDate: this.queryParams['end']
                }
                if (this.queryParams['countries'] !== '')
                    this.summaryData['countries'] = this.queryParams['countries']

                this.isSummaryLoading = false;

                this.dataService.setSummary(this.summaryData)
            },
            error: (err) => {
                console.error('Error while requesting Summary data ', err)
            }
        })

        if (this.queryParams['topics']) {
            this.dataService.requestTopic(this.queryParams).subscribe({
                next: res => {
                    const tempSummaryData = this.dataService.getSummary()
                    if (!tempSummaryData) {
                        console.error('Got response of Topics but SummaryData was empty')
                        return
                    }
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
                    this.topicData = {
                        ...topicValue
                    }
                    if (this.queryParams['countries'] !== '')
                        this.summaryData['countries'] = this.queryParams['countries']

                    // this.dataService.setSummary(this.summaryData)
                },
                error: (err) => {
                    console.error('Error while requesting Topic data ', err)
                }
            })
        } else {
            this.topicData = null
        }

        // fire timeseries API to get plot data
        this.dataService.requestPlot(this.queryParams).subscribe({
            next: (res: IWrappedPlotData) => {
                if (res) {
                    // add 'hashtag' and 'country' ISO codes to plotData #82
                    const tempPlotResponse = res.result
                    // add Topics to PlotData to make them a part of CSV
                    if (this.queryParams['topics']) {
                        this.dataService.requestTopicInterval(this.queryParams).subscribe({
                            next: res => {
                                if (res) {
                                    // add each Topic data to Plot data to make them a part of CSV
                                    this.plotData = this.addTopicDataToPlot(res.result, tempPlotResponse)
                                    this.plotData['hashtag'] = decodeURIComponent(this.queryParams['hashtag'])
                                    if (this.queryParams['countries'] !== '')
                                        this.plotData['countries'] = this.queryParams['countries']
                                }
                            },
                            error: (err) => {
                                console.error('Error while requesting Topic data ', err)
                            }
                        })
                    } else {
                        // if non Topic is selected only countryData is sent to PlotComponent
                        this.plotData = tempPlotResponse
                        this.plotData['hashtag'] = decodeURIComponent(this.queryParams['hashtag'])
                        if (this.queryParams['countries'] !== '')
                            this.plotData['countries'] = this.queryParams['countries']
                    }
                    this.isPlotsLoading = false;
                }
            },
            error: (err) => {
                console.error('Error while requesting Plot data  ', err)
            }
        });

        // fire API to get map data
        this.dataService.requestCountryStats(this.queryParams).subscribe({
            next: (res: IWrappedCountryStatsData) => {
                // add 'hashtag'
                res.result.map((r: any) => {
                    r['hashtag'] = decodeURIComponent(this.queryParams['hashtag'])
                    r['startDate'] = this.queryParams['start']
                    r['endDate'] = this.queryParams['end']
                })

                const tempCountryResponse = res.result
                if (this.queryParams && this.queryParams['topics']) {
                    this.dataService.requestTopicCountryStats(this.queryParams)
                        .subscribe((res: IWrappedTopicCountryData) => {
                            // add each Topic to Map data to make them a part of CSV
                            this.countryWithTopic = this.addTopicDataToCountries(res.result, tempCountryResponse)
                        });
                } else {
                    // if non Topic is selected only countryData is sent to MapComponent
                    this.countryWithTopic = tempCountryResponse
                }
                this.isCountriesLoading = false;
            },
            error: (err) => {
                console.error('Error while requesting Country data  ', err)
            }
        });

        this.selectedTopics = this.queryParams["topics"]


        // stop trending hashtag request if already fired any
        this.stopHashtagReq()
        // fire trending hashtag API
        this.dataService.getTrendingHashtags({
            start: timeRange.start,
            end: timeRange.end,
            limit: this.dataService.trendingHashtagLimit,
            countries: this.queryParams.countries
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

    }


    setDefaultValues(queryParams: IQueryParam | null) {
        // resolve #26
        const defaultParams = this.dataService.getDefaultValues()
        // if URL params are empty then fill it with default values
        if (defaultParams !== null) {
            const newParams: IQueryParam = {
                hashtag: queryParams && queryParams.hashtag ? queryParams.hashtag : defaultParams.hashtag,
                interval: queryParams && queryParams.interval ? queryParams.interval : defaultParams.interval,
                start: queryParams && queryParams.start ? queryParams.start : queryParams && queryParams.hashtag ? "2009-04-21T22:02:04Z" : defaultParams.start,
                end: queryParams && queryParams.end ? queryParams.end : defaultParams.end,
                countries: queryParams && queryParams.countries ? queryParams.countries : defaultParams.countries,
                topics: queryParams && queryParams.topics ? queryParams.topics : defaultParams.topics
            }
            if (queryParams?.fit_to_content !== undefined) {
                newParams.fit_to_content = queryParams.fit_to_content
            }
            this.dataService.updateURL(newParams)
        }
    }


    queryParamsComplete(params: any): boolean {
        return ["start", "end", "interval", "hashtag", "countries", "topics"].sort().join()
            === Object.keys(params).filter((item) => item !== "fit_to_content").sort().join()
    }

    setQueryParamOrDefault(target: string, queryParams: any): string {
        if (queryParams[target] == null || queryParams[target] == "") {
            const defaultParams = this.dataService.getDefaultValues()
            if (defaultParams !== null) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                return defaultParams[target]
            }
        }
        return queryParams[target]
    }

    checkHashtagParameter(hashtag: string): string {
        if (hashtag == null)
            hashtag = this.dataService.defaultHashtag

        if (hashtag === "*") {
            console.warn('Unsupported hashtag *')
            // show the message on toast
            this.toastService.show({
                title: 'Unsupported hashtag 🍞',
                body: 'Unsupported hashtag \'*\', defaulting to hashtag missingmaps',
                type: 'warning',
                time: 6000
            })
            hashtag = 'missingmaps'
        }

        return hashtag
    }

    checkIntervalParameter(interval: string, queryParams: any): string {
        // difference of time between start and end dates in days
        const startDate = dayjs(queryParams.start)
        const endDate = dayjs(queryParams.end)
        const diff = endDate.diff(startDate, 'day')

        const max_bins = 10000
        if (dayjs.duration(diff, "day").as("second") / dayjs.duration(queryParams.interval).as("second") > max_bins) {
            console.warn('Too many bins requested')
            // show the message on toast
            this.toastService.show({
                title: 'Unsupported interval',
                body: `Unsupported interval for the given time range, max ${max_bins} interval bins allowed, hence changed it to \'${diff > 366 ? "Daily" : "Hourly"}\'`,
                type: 'warning',
                time: 6000
            })
            return diff > 366 ? 'P1D' : 'PT1H'
        }
        return interval
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
     * Forms an appropriate message to be display above Summary data
     *
     * @param queryParams
     * @returns message
     */
    formSummaryMessage(queryParams: IQueryParam): string {
        if (!queryParams)
            return `Summarized statistics for all contributions`

        let message = ''
        if (queryParams.hashtag)
            message += `Summarized statistics of contributions with #${queryParams.hashtag}`

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

        startDate.setMilliseconds(0)

        endDate.setDate(endDate.getDate() - 1)
        endDate.setMilliseconds(0)

        // todo: what if one is set, the other one isnt?
        if (queryParams && queryParams['start'] && queryParams['end']) {
            startDate = dayjs.utc(queryParams['start']).toDate()
            endDate = dayjs.utc(queryParams['end']).toDate()
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

    private addTopicDataToPlot(res: Record<string, ITopicPlotData>, plotData: IPlotData) {
        Object.keys(res).forEach((topic: string) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            plotData[topic] = res[topic].value
        })
        return plotData
    }

}
