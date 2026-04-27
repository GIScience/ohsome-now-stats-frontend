import {Component, inject} from '@angular/core';
import {download, generateCsv, mkConfig} from "export-to-csv";
import {ICountryResult, IPlotResult, IStateParams, IStatsResult} from "../../../lib/types";
import {StateService} from "../../../lib/state.service";
import {DataService} from "../../../lib/data.service";

@Component({
    selector: 'app-export-data',
    templateUrl: './export-data.component.html',
    styleUrl: './export-data.component.scss'
})
export class ExportDataComponent {
    private stateService: StateService = inject(StateService);
    private dataService: DataService = inject(DataService);
    mode: string = '';

    constructor() {
        this.stateService.activePage.subscribe(page => this.mode = page!)
    }

    isUserMode() {
        return this.mode == 'user-dashboard';
    }

    exportOverview() {
        const state = this.stateService.appState()
        const result = this.isUserMode()
            ? this.dataService.requestUserSummary(state) : this.dataService.requestSummary(state)

        result.subscribe({
            next: (data) => {
                this.prepareOverviewDataAndDownload(data.result, state)
            },
            error: (err) => {
                console.error('Error while requesting data: ', err)
            }
        });

    }

    prepareOverviewDataAndDownload(data: IStatsResult, state: IStateParams) {
        if (data) {
            const arrangedHeaders = [
                "startDate", "endDate", "hashtag", "countries",
                ...Object.keys(data.topics)
            ]

            const csv_data: CsvData = {
                "startDate": state.start,
                "endDate": state.end,
                "hashtag": decodeURIComponent(state.hashtag),
                "countries": state.countries,
                ...Object.fromEntries(
                    Object.entries(data.topics).map(entry => [entry[0], entry[1].value])
                )
            }

            if (this.isUserMode()) {
                arrangedHeaders.unshift("userIds")
                csv_data.userIds = state.osm_user_id
            }

            const csvConfig = mkConfig({
                filename: `ohsome-now-stats_${decodeURIComponent(state.hashtag)}_${state.start.substring(0, 10)}_${state.end.substring(0, 10)}_summary`,
                columnHeaders: arrangedHeaders
            });

            const csv = generateCsv(csvConfig)([csv_data]);
            download(csvConfig)(csv)
        }
    }

    exportTimeSeries() {
        const state = this.stateService.appState()
        const result = this.isUserMode()
            ? this.dataService.requestUserPlot(state) : this.dataService.requestPlot(state)

        result.subscribe({
            next: (res) => {
                this.preparePlotDataAndDownload(res.result, state)
            },
            error: (err) => {
                console.error('Error while requesting Plot data  ', err)
            }
        });
    }

    private preparePlotDataAndDownload(plotData: IPlotResult, state: IStateParams) {
        const hashtag = decodeURIComponent(state.hashtag)

        const arrangedHeaders = [
            "startDate", "endDate", "hashtag", "countries",
            ...Object.keys(plotData.topics)
        ]
        if (this.isUserMode()) arrangedHeaders.unshift("userIds")

        const csvConfig = mkConfig({
            filename: `ohsome-now-stats_${hashtag}_${plotData.startDate[0].substring(0, 10)}_${plotData.endDate.at(-1)!.substring(0, 10)}_interval`,
            columnHeaders: arrangedHeaders
        });

        const csvData = plotData.startDate.map((value, index) => {
            let csvData: CsvData = {
                startDate: value,
                endDate: plotData.endDate[index],
                hashtag: hashtag,
                countries: state.countries,
                ...Object.fromEntries(
                    Object.entries(plotData.topics).map(entry => [entry[0], entry[1].value[index]])
                )
            }
            if (this.isUserMode()) {
                csvData.userIds = state.osm_user_id
            }
            return csvData
        });

        const csv = generateCsv(csvConfig)(csvData);
        download(csvConfig)(csv)
    }


    exportMap() {
        const state = this.stateService.appState()
        // fire API to get map data
        const result = this.isUserMode()
            ? this.dataService.requestUserCountryStats(state) : this.dataService.requestCountryStats(state)

        result.subscribe({
            next: (res) => {
                this.prepareMapDataAndDownload(res.result, state)
            },
            error: (err) => {
                console.error('Error while requesting Country data  ', err)
            }
        });
    }

    private prepareMapDataAndDownload(mapData: ICountryResult, state: IStateParams) {
        const selectedCountryList = state.countries.split(",").filter(val => val !== "")
        const hashtag = decodeURIComponent(state.hashtag)

        const countries = [...new Set(
            Object.values(mapData.topics).flatMap(
                countryValues => countryValues.map(val => val.country)
            )
        )].filter(country =>
            selectedCountryList.length === 0 || selectedCountryList.includes(country as string)
        )

        const countryData = countries.map(country => {
            let csvData: CsvData = {
                startDate: state.start,
                endDate: state.end,
                hashtag: hashtag,
                country: country,
                ...Object.fromEntries(
                    Object.entries(mapData.topics).map(
                        topicEntry => [
                            topicEntry[0],
                            topicEntry[1].find(countryResult => countryResult.country === country)?.value
                        ]
                    )
                )
            }
            if (this.isUserMode()) csvData.userIds = state.osm_user_id
            return csvData
        })

        if (countryData.length > 0) {
            const arrangedHeaders = [
                "startDate", "endDate", "hashtag", "country",
                ...Object.keys(mapData.topics)
            ]
            if (this.isUserMode()) arrangedHeaders.unshift("userIds")

            const csvConfig = mkConfig({
                filename: `ohsome-now-stats_${hashtag}_${state.start.substring(10)}_${state.end.substring(10)}_per-country`,
                columnHeaders: arrangedHeaders
            });

            const csv = generateCsv(csvConfig)(countryData);
            download(csvConfig)(csv)
        }
    }

}

interface CsvData {
    startDate: string;
    endDate: string;
    hashtag: string;
    countries?: string;
    userIds?: string;
    country?: string;

    [k: string]: string | null | undefined;
}
