import {AfterContentInit, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import Plotly, {Config, Layout} from 'plotly.js-basic-dist-min';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {IDateRange, IPlotData, StatsType} from "../types";

import {
    UTCStringToLocalDateConverterFunction,
    UTCToLocalConverterPipe
} from "../query/pipes/utc-to-local-converter.pipe";
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
    @Input() selectedDateRange!: IDateRange;
    layout: Layout | any;
    fitToContentIcon = {
        'width': 600,
        'height': 500,
        'path': 'M0 0H49.8339V500H0V0ZM550.166 0H600V500H550.166V0ZM450.086 225L421.887 196.707C412.14 186.928 412.14 171.072 421.887 161.293C431.634 151.514 447.436 151.514 457.183 161.293L527.659 232.004C532.569 236.93 535.006 243.398 534.969 249.855C535.006 256.312 532.569 262.781 527.659 267.707L457.183 338.418C447.436 348.197 431.634 348.197 421.887 338.418C412.14 328.638 412.14 312.783 421.887 303.004L449.797 275H146.924L174.835 303.004C184.582 312.783 184.582 328.638 174.835 338.418C165.088 348.197 149.285 348.197 139.538 338.418L69.0627 267.707C64.1526 262.781 61.7161 256.312 61.753 249.855C61.7161 243.399 64.1526 236.93 69.0627 232.004L139.538 161.293C149.285 151.514 165.088 151.514 174.835 161.293C184.582 171.072 184.582 186.928 174.835 196.707L146.636 225H450.086Z'
    }
    config: Partial<Config> = {
        responsive: true,
        modeBarButtonsToRemove: ['select2d', 'lasso2d', 'resetScale2d', 'zoomOut2d', 'zoomIn2d'],
    }

    constructor(private utcToLocalConverter: UTCToLocalConverterPipe) {
    }

    ngAfterContentInit(): void {
        this.initChart();

        if (this.data) {
            this.refreshPlot();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.data) {
            if ("data" in changes) {
                this.resetZoom()
            }
            this.refreshPlot();
        }
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

        Plotly.react('summaryplot', [], this.layout, this.config);
    }

    refreshPlot() {
        const plotData = [{
            x: this.data.startDate.map(e => UTCStringToLocalDateConverterFunction(e)),
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
                    shape: this.data.startDate.map((start_date, index) =>
                        this.stripedOrNot(index)
                    ),
                    size: 7,
                    solidity: 0.6
                },
                color: `${topicDefinitions[this.currentStats]["color-hex"]}`
            },
        }];
        this.layout.yaxis.title = `${topicDefinitions[this.currentStats]["y-title"]}`
        this.config.modeBarButtonsToAdd = [
            {
                name: 'FitToContent',
                icon: this.fitToContentIcon,
                title: 'Fit to Content',
                click: this.fitToContent()
            }]
        Plotly.react('summaryplot', plotData as any, this.layout, this.config);
    }

    /**
     * Return striped if first or last element are not fully contained in timeline.
     */
    stripedOrNot(index: number) {
        if (index !== 0 && index !== this.data.startDate.length - 1) {
            return ''
        }

        if (
            this.selectedDateRange.end.subtract(dayjs().utcOffset(), "minute").toDate() < UTCStringToLocalDateConverterFunction(this.data.endDate[index])
            || this.selectedDateRange.start.subtract(dayjs().utcOffset(), "minute").toDate() > UTCStringToLocalDateConverterFunction(this.data.startDate[index])
        ) {
            return '/'
        }

        return ''
    }

    // @ts-ignore
    fitToContent() {
        return () => {
            // @ts-ignore
            let data_start = this.data[this.currentStats].findIndex(value => value != 0)
            // @ts-ignore
            let data_end = this.data[this.currentStats].findLastIndex(value => value != 0)
            Plotly.relayout('summaryplot', {
                xaxis: {
                    range: [
                        this.data.startDate[data_start > 0 ? data_start : 0],
                        this.data.startDate[data_end > 0 ? data_end : this.data.startDate.length - 1]
                    ],
                },
            });
        }
    }

    resetZoom() {
        Plotly.relayout('summaryplot', {
            xaxis: {
                autorange: true
            }
        });
    }
}
