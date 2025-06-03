import {Component} from '@angular/core';
import dayjs from "dayjs";
import {DataService} from '../data.service';
import {
    ICountryStatsData,
    IDateRange,
    IPlotData,
    IQueryParam,
    ISummaryData,
    ITopicCountryData,
    IWrappedCountryStatsData,
    IWrappedTopicCountryData,
    StatsType,
    TopicName
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
export class DashboardComponent {

    summaryData!: ISummaryData;
    plotData!: IPlotData;
    countryWithTopic: ICountryStatsData[] = [];
    selectedTopics: TopicName | "" = "";
    currentStats: StatsType = 'users';
    queryParams: any;
    summaryMessage = '';
    isSummaryLoading = false;
    isPlotsLoading = false;
    isCountriesLoading = false;
    selectedDateRange!: IDateRange

    constructor(
        private dataService: DataService,
        private toastService: ToastService) {
    }

    requestsToAPI() {
        if (!this.queryParams) {
            console.error('queryParams was empty')
            return
        }
        const timeRange = this.initTimeIntervals(this.queryParams)
        Object.assign(this.queryParams, timeRange)

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
                topics: queryParams && queryParams.topics ? queryParams.topics : defaultParams.topics,
                active_topic: queryParams && queryParams.active_topic ? queryParams.active_topic : defaultParams.active_topic
            }
            if (queryParams?.fit_to_content !== undefined) {
                newParams.fit_to_content = queryParams.fit_to_content
            }
            // this.dataService.updateURL(newParams)
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



}
