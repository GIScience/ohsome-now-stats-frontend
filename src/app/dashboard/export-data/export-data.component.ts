import {Component, Input} from '@angular/core';
import {mkConfig, generateCsv, download} from "export-to-csv";
import {ICountryStatsData, IPlotData, ISummaryData} from "../types";

@Component({
    selector: 'app-export-data',
    templateUrl: './export-data.component.html',
    styleUrl: './export-data.component.scss'
})
export class ExportDataComponent {

    @Input() summaryData!: ISummaryData
    @Input() plotData!: IPlotData
    @Input() mapData!: Array<ICountryStatsData>
    @Input() selectedCountries!: string;

    exportOverview() {
        // Converts your Array<Object> to a CsvOutput string based on the configs
        if (this.summaryData && [this.summaryData].length > 0) {
            // console.log('this.summaryData ', this.summaryData)

            // Extract keys from the input object
            const keys = Object.keys(this.summaryData)
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
                filename: `ohsome-now-stats_${this.summaryData['hashtag']}_${this.summaryData['startDate']!.substring(0, 10)}_${this.summaryData['endDate']!.substring(0, 10)}_summary`,
                columnHeaders: arrangedHeaders
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const csv = generateCsv(csvConfig)([this.summaryData]);
            download(csvConfig)(csv)
        }
    }

    exportTimeSeries() {
        console.log('>>> exportTimeSeries >>> this.plotData ', this.plotData)
        const tempHashtag = <string>this.plotData['hashtag']
        const tempPlotdata = this.addHashtagAndCountriesToPlot(this.plotData)
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

    private addHashtagAndCountriesToPlot(plotData: IPlotData) {
        // get first key's values's length
        const tempHashtagArr: string[] = []
        const tempCountriesArr: string[] = []
        for (let i = 0; i < Object.values(plotData)[0].length; i++) {
            tempHashtagArr.push(<string>plotData['hashtag'])
            if(plotData['countries'] && <string>plotData['countries'] !== '')
              tempCountriesArr.push(<string>plotData['countries'])
        }

        plotData['hashtag'] = tempHashtagArr
        if(tempCountriesArr.toString() !== '')
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
        // Converts your Array<Object> to a CsvOutput string based on the configs
        let selectedCountryCSV: Array<ICountryStatsData> = [];
        if (this.selectedCountries === '') {
            // if no country is selected than add all countries to CSV
            selectedCountryCSV = this.mapData
        } else {
            // filter only selected countries
            selectedCountryCSV = this.mapData.filter((dataPoint) => this.selectedCountries.includes(dataPoint["country"]))
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

}
