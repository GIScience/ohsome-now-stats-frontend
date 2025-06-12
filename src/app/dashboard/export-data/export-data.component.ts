import {Component} from '@angular/core';
import {download, generateCsv, mkConfig} from "export-to-csv";
import {
    ICountryStatsData,
    IPlotData,
    ISummaryData,
    ITopicCountryData,
    ITopicPlotData,
    IWrappedCountryStatsData,
    IWrappedPlotData,
    IWrappedSummaryData,
    IWrappedTopicCountryData,
    IWrappedTopicData,
    StatsType,
    TopicValues
} from "../types";
import {forkJoin, Observable} from "rxjs";
import {StateService} from "../../state.service";
import {DataService} from "../../data.service";

@Component({
    selector: 'app-export-data',
    templateUrl: './export-data.component.html',
    styleUrl: './export-data.component.scss',
    standalone: false
})
export class ExportDataComponent {

    constructor(
        private stateService: StateService,
        private dataService: DataService
    ) { }

    exportOverview() {
        const state = this.stateService.appState()
        console.log(state)
        if (state['topics'] !== '') {
            // if topics are requested then wait for both the observable
            forkJoin({
                summary: this.dataService.requestSummary(state) as Observable<IWrappedSummaryData>,
                topic: this.dataService.requestTopic(state) as Observable<IWrappedTopicData>
            }).subscribe({
                next: (responses) => {
                    // Handle summary response
                    const tempSummaryData = responses.summary.result;

                    let summaryData: ISummaryData = {
                        changesets: tempSummaryData.changesets,
                        buildings: tempSummaryData.buildings,
                        users: tempSummaryData.users,
                        edits: tempSummaryData.edits,
                        roads: tempSummaryData.roads,
                        latest: tempSummaryData.latest,
                        hashtag: state.hashtag,
                        startDate: state.start,
                        endDate: state.end
                    };

                    if (state.countries !== '') {
                        summaryData['countries'] = state.countries;
                    }

                    // Handle topic response
                    const input: { [key: string]: TopicValues } = responses.topic.result;
                    const topicValue: { [key: string]: number } = {};

                    for (const key in input) {
                        if (Object.prototype.hasOwnProperty.call(input, key)) {
                            topicValue[key] = input[key].value;
                        }
                    }

                    summaryData = {...summaryData, ...topicValue}

                    this.prepareOverviewDataAndDownload(summaryData)
                },
                error: (err) => {
                    console.error('Error while requesting data: ', err)
                }
            });
        } else {
            // Only summary request needed
            this.dataService.requestSummary(state).subscribe({
                next: (res: IWrappedSummaryData) => {
                    const tempSummaryData = res.result;

                    const summaryData: ISummaryData = {
                        changesets: tempSummaryData.changesets,
                        buildings: tempSummaryData.buildings,
                        users: tempSummaryData.users,
                        edits: tempSummaryData.edits,
                        roads: tempSummaryData.roads,
                        latest: tempSummaryData.latest,
                        hashtag: state.hashtag,
                        startDate: state.start,
                        endDate: state.end
                    };

                    if (state.countries !== '') {
                        summaryData['countries'] = state.countries;
                    }

                    this.prepareOverviewDataAndDownload(summaryData)
                },
                error: (err) => {
                    console.error('Error while requesting Summary data ', err)
                }
            });
        }

    }

    prepareOverviewDataAndDownload(summaryData: ISummaryData) {
        // Converts your Array<Object> to a CsvOutput string based on the configs
        if (summaryData && [summaryData].length > 0) {
            // console.log('summaryData ', summaryData)

            // Extract keys from the input object
            const keys = Object.keys(summaryData)
            // Filter out 'startDate' and 'endDate' keys
            const dateKeys = keys.filter((key) => key === 'startDate' || key === 'endDate')
            // Filter out non-date keys
            const otherKeys = keys.filter((key) => key !== 'startDate' && key !== 'endDate')
            // Place the date keys at the start and then the other keys
            const arrangedHeaders = [
                ...dateKeys,
                ...otherKeys
            ]

            const csvConfig = mkConfig({
                filename: `ohsome-now-stats_${summaryData['hashtag']}_${summaryData['startDate']!.substring(0, 10)}_${summaryData['endDate']!.substring(0, 10)}_summary`,
                columnHeaders: arrangedHeaders
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const csv = generateCsv(csvConfig)([summaryData]);
            download(csvConfig)(csv)
        }
    }

    exportTimeSeries() {
        let plotData: IPlotData
        const state = this.stateService.appState()
        // fire timeseries API to get plot data
        this.dataService.requestPlot(state).subscribe({
            next: (res: IWrappedPlotData) => {
                if (res) {
                    // add 'hashtag' and 'country' ISO codes to plotData #82
                    const tempPlotResponse = res.result
                    // add Topics to PlotData to make them a part of CSV
                    if (state['topics']) {
                        this.dataService.requestTopicInterval(state).subscribe({
                            next: res => {
                                if (res) {
                                    // add each Topic data to Plot data to make them a part of CSV
                                    plotData = this.addTopicDataToPlot(res.result, tempPlotResponse)
                                    plotData['hashtag'] = decodeURIComponent(state['hashtag'])
                                    if (state['countries'] !== '')
                                        plotData['countries'] = state['countries']

                                    this.preparePlotDataAndDownload(plotData)
                                }
                            },
                            error: (err) => {
                                console.error('Error while requesting Topic data ', err)
                            }
                        })
                    } else {
                        // if non Topic is selected only countryData is sent to PlotComponent
                        plotData = tempPlotResponse
                        plotData['hashtag'] = decodeURIComponent(state['hashtag'])
                        if (state['countries'] !== '')
                            plotData['countries'] = state['countries']

                        this.preparePlotDataAndDownload(plotData)
                    }
                }
            },
            error: (err) => {
                console.error('Error while requesting Plot data  ', err)
            }
        });

    }

    private preparePlotDataAndDownload(plotData: IPlotData) {
        const tempHashtag = <string>plotData['hashtag']
        const tempPlotdata = this.addHashtagAndCountriesToPlot(plotData)
        // Extract keys from the input object
        const keys = Object.keys(tempPlotdata)
        // Filter out 'startDate' and 'endDate' keys
        const metaKeys = keys.filter((key) => key === 'startDate' || key === 'endDate' || key === 'hashtag' || key === 'countries')
        // Filter out non-date keys
        const otherKeys = keys.filter((key) => key !== 'startDate' && key !== 'endDate' && key !== 'hashtag' && key !== 'countries')
        // Place the date keys at the start and then the other keys
        const arrangedHeaders = [
            ...metaKeys,
            ...otherKeys
        ]

        const csvConfig = mkConfig({
            filename: `ohsome-now-stats_${tempHashtag}_${tempPlotdata['startDate'][0]!.substring(0, 10)}_${tempPlotdata['endDate'][tempPlotdata['endDate'].length - 1]!.substring(0, 10)}_interval`,
            columnHeaders: arrangedHeaders
        });

        const convertedData = this.convertToJsonArray(tempPlotdata)
        console.log(convertedData)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const csv = generateCsv(csvConfig)(convertedData);
        download(csvConfig)(csv)
    }

    private addTopicDataToPlot(res: Record<string, ITopicPlotData>, plotData: IPlotData) {
        Object.keys(res).forEach((topic: string) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            plotData[topic] = res[topic].value
        })
        return plotData
    }

    private addHashtagAndCountriesToPlot(plotData: IPlotData) {
        // get first key's values's length
        const tempHashtagArr: string[] = []
        const tempCountriesArr: string[] = []
        for (let i = 0; i < Object.values(plotData)[0].length; i++) {
            tempHashtagArr.push(<string>plotData['hashtag'])
            if (plotData['countries'] && <string>plotData['countries'] !== '')
                tempCountriesArr.push(<string>plotData['countries'])
        }

        plotData['hashtag'] = tempHashtagArr
        if (tempCountriesArr.toString() !== '')
            plotData['countries'] = tempCountriesArr

        console.log('plotData ', plotData)
        return plotData
    }

    private convertToJsonArray(input: any): any[] {
        const result: any[] = []
        // Extract keys from the input object
        const keys = Object.keys(input)
        // Assuming all arrays have the same length
        const arrayLength = input[keys[0]].length
        for (let i = 0; i < arrayLength; i++) {
            const newObj: any = {}
            // Iterate over keys and populate the new object
            keys.forEach((key) => {
                newObj[key] = input[key][i]
            });
            result.push(newObj)
        }

        return result
    }

    exportMap() {
        let mapData: Array<ICountryStatsData>
        const state = this.stateService.appState()
        // fire API to get map data
        this.dataService.requestCountryStats(state).subscribe({
            next: (res: IWrappedCountryStatsData) => {
                // add 'hashtag'
                res.result.map((r: any) => {
                    r['hashtag'] = decodeURIComponent(state['hashtag'])
                    r['startDate'] = state['start']
                    r['endDate'] = state['end']
                })

                const tempCountryResponse = res.result
                if (state && state['topics']) {
                    this.dataService.requestTopicCountryStats(state)
                        .subscribe((res: IWrappedTopicCountryData) => {
                            // add each Topic to Map data to make them a part of CSV
                            mapData = this.addTopicDataToCountries(res.result, tempCountryResponse)
                        });
                } else {
                    // if non Topic is selected only countryData is sent to MapComponent
                    mapData = tempCountryResponse
                }
                this.prepareMapDataAndDownload(mapData, state.countries)
            },
            error: (err) => {
                console.error('Error while requesting Country data  ', err)
            }
        });
    }

    private prepareMapDataAndDownload(mapData: Array<ICountryStatsData>, selectedCountries: string) {
        // Converts Array<Object> to a CsvOutput string based on the configs
        let selectedCountryCSV: Array<ICountryStatsData> = [];
        if (selectedCountries === '') {
            // if no country is selected than add all countries to CSV
            selectedCountryCSV = mapData
        } else {
            // filter only selected countries
            selectedCountryCSV = mapData.filter((dataPoint) => selectedCountries.includes(dataPoint["country"]))
        }

        if (selectedCountryCSV.length > 0) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const tempHashtag = selectedCountryCSV[0]['hashtag']
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const tempStartDate = selectedCountryCSV[0]['startDate']!.substring(0, 10)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const tempEndDate = selectedCountryCSV[0]['endDate']!.substring(0, 10)
            // Extract keys from the input object
            const keys = Object.keys(selectedCountryCSV[0])
            // Filter out 'startDate' and 'endDate' keys
            const dateKeys = keys.filter((key) => key === 'startDate' || key === 'endDate')
            // Filter out non-date keys
            const otherKeys = keys.filter((key) => key !== 'startDate' && key !== 'endDate')
            // Place the date keys at the start and then the other keys
            const arrangedHeaders = [
                ...dateKeys,
                ...otherKeys
            ]

            const csvConfig = mkConfig({
                filename: `ohsome-now-stats_${tempHashtag}_${tempStartDate}_${tempEndDate}_per-country`,
                columnHeaders: arrangedHeaders
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const csv = generateCsv(csvConfig)(selectedCountryCSV);
            download(csvConfig)(csv)
        }
    }

    private addTopicDataToCountries(res: Record<StatsType, ITopicCountryData[]>, countryData: ICountryStatsData[]) {
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
