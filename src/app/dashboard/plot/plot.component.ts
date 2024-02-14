import {Component, Input, OnChanges, AfterContentInit} from '@angular/core';

import Plotly from 'plotly.js-basic-dist-min';
import {Layout} from 'plotly.js-basic-dist-min';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {StatsType, IPlotData} from "../types";

import {UTCToLocalConverterPipe, UTCStringToLocalDateConverterFunction} from "../query/pipes/utc-to-local-converter.pipe";
import dayjs from "dayjs";

@Component({
    selector: 'app-plot',
    templateUrl: './plot.component.html',
    styleUrls: ['./plot.component.scss']
})
export class PlotComponent implements AfterContentInit, OnChanges {

    @Input() data!: IPlotData;
    @Input() currentStats!: StatsType;
    @Input() selectedTopics: string | undefined;
    @Input() isPlotsLoading!: boolean;
    @Input() maxDate!: dayjs.Dayjs;
    layout: Layout | any;

    constructor(private utcToLocalConverter: UTCToLocalConverterPipe) {}

    ngAfterContentInit(): void {
        this.initChart();

        if (this.data) {
            this.refreshPlot();
        }
    }

    ngOnChanges(): void {
        if (this.data)
            this.refreshPlot();
    }

    /**
     * Draws the blank plotly chart. Traces will be added dynamically
     */
    initChart() {
        this.layout = {
            autosize: true,
            height: 350,
            grid: {rows: 1, columns: 1},
            shapes: [],
            annotations: [],
            margin: {l: 50, r: 20, t: 20, b: 40},
            legend: {orientation: 'h'},
            barmode: 'group',
            font: {
                family: 'Roboto, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
            },

        };

        Plotly.react('summaryplot', [], this.layout, {responsive: true});

    }

    refreshPlot() {

        const plotData = [{
            x: this.data.startDate.map(e=>UTCStringToLocalDateConverterFunction(e)),
            // @ts-ignore
            y: this.data[this.currentStats],
            // @ts-ignore
            customdata: this.data[this.currentStats],
            hovertext: this.data.startDate.map((start_date, index) => `From ${this.utcToLocalConverter.transform(start_date)}<br>To ${this.utcToLocalConverter.transform(this.data.endDate[index])}`),
            hovertemplate: `%{hovertext}<br>${topicDefinitions[this.currentStats]["name"]}: %{customdata}<extra></extra>`,
            type: 'bar',
            name: `${topicDefinitions[this.currentStats]["name"]}`,
            marker: {
                pattern: {
                    // apply striped pattern only for current running time
                    shape: this.data.startDate.map((start_date, index) => (
                        this.maxDate.subtract(dayjs().utcOffset(),"minute").toDate() < UTCStringToLocalDateConverterFunction(this.data.endDate[index]))
                        ? '/' : ''),
                    size: 7,
                    solidity: 0.6
                },
                color: `${topicDefinitions[this.currentStats]["color-hex"]}`
            },
        }];
        this.layout.yaxis.title = `${topicDefinitions[this.currentStats]["y-title"]}`
        Plotly.react('summaryplot', plotData as any, this.layout, {responsive: true});
    }

}
