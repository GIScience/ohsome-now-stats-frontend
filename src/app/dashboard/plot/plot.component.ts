import {Component, computed, effect} from '@angular/core';

import {Config, Layout} from 'plotly.js-basic-dist-min';
import dayjs from "dayjs";
import moment from "moment";
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"

import {
    UTCStringToLocalDateConverterFunction,
    UTCToLocalConverterPipe
} from "../query/pipes/utc-to-local-converter.pipe";
import {StateService} from "../../state.service";
import {DataService} from "../../data.service";
import {IPlotResult, IQueryParams, StatsType} from "../types";

@Component({
    selector: 'app-plot',
    templateUrl: './plot.component.html',
    styleUrls: ['./plot.component.scss'],
    standalone: false
})
export class PlotComponent {

    private relevantState = computed(() => {
        return this.stateService.appState();
    }, {
        equal: (a, b) => {
            return a.hashtag === b.hashtag
                && a.start === b.start
                && a.end === b.end
                && a.countries === b.countries
                && a.interval === b.interval
                && a.topics === b.topics
        }
    });

    private activeTopicState = computed(() => {
        return this.stateService.appState().active_topic;
    });

    data!: IPlotResult;
    activeTopic!: StatsType;

    plotData: any[] | undefined;

    layout: Partial<Layout> = {
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
        xaxis: {range: [], autorange: false},
        yaxis: {title: {text: ""}}
    };

    fitToContentIcon = {
        'width': 600,
        'height': 500,
        'path': 'M0 0H49.8339V500H0V0ZM550.166 0H600V500H550.166V0ZM450.086 225L421.887 196.707C412.14 186.928 412.14 171.072 421.887 161.293C431.634 151.514 447.436 151.514 457.183 161.293L527.659 232.004C532.569 236.93 535.006 243.398 534.969 249.855C535.006 256.312 532.569 262.781 527.659 267.707L457.183 338.418C447.436 348.197 431.634 348.197 421.887 338.418C412.14 328.638 412.14 312.783 421.887 303.004L449.797 275H146.924L174.835 303.004C184.582 312.783 184.582 328.638 174.835 338.418C165.088 348.197 149.285 348.197 139.538 338.418L69.0627 267.707C64.1526 262.781 61.7161 256.312 61.753 249.855C61.7161 243.399 64.1526 236.93 69.0627 232.004L139.538 161.293C149.285 151.514 165.088 151.514 174.835 161.293C184.582 171.072 184.582 186.928 174.835 196.707L146.636 225H450.086Z'
    }
    config: Partial<Config> = {
        responsive: true,
        modeBarButtonsToRemove: ['select2d', 'lasso2d', 'resetScale2d', 'zoomOut2d', 'zoomIn2d'],
        modeBarButtonsToAdd: [
            {
                name: 'FitToContent',
                icon: this.fitToContentIcon,
                title: 'Fit to Content',
                click: this.fitToContent()
            }]
    }
    isPlotsLoading: boolean = false;

    constructor(
        private stateService: StateService,
        private dataService: DataService,
        private utcToLocalConverter: UTCToLocalConverterPipe
    ) {

        // Overall Effect for calling API
        effect(() => {
            this.activeTopic = this.relevantState().active_topic
            this.requestToAPI(this.relevantState());
        });

        // Effect for plot refresh when ONLY active_topic changes
        effect(() => {
            this.activeTopic = this.activeTopicState()
            if (this.data) {
                this.refreshPlot()
            }
        })
    }

    private requestToAPI(state: IQueryParams) {
        this.isPlotsLoading = true;
        this.dataService.requestPlot(state).subscribe({
            next: (res) => {
                if (res) {
                    this.data = res.result
                    this.refreshPlot();
                    this.isPlotsLoading = false;

                    if (this.relevantState().fit_to_content !== undefined) {
                        this.fitToContent()()
                    } else {
                        this.resetZoom()
                    }
                }
            },
            error: (err) => {
                console.error('Error while requesting Plot data  ', err)
            }
        });
    }


    refreshPlot() {
        this.plotData = [{
            x: this.data.startDate.map(e => UTCStringToLocalDateConverterFunction(e)),
            y: this.data.topics[this.activeTopic].value,
            customdata: this.data.topics[this.activeTopic].value,
            hovertext: this.data.startDate.map((start_date, index) => `From ${this.utcToLocalConverter.transform(start_date)}<br>To ${this.utcToLocalConverter.transform(this.data.endDate[index])}`),
            hovertemplate: `%{hovertext}<br>${topicDefinitions[this.activeTopic]["name"]}: %{customdata}<extra></extra>`,
            type: 'bar',
            name: `${topicDefinitions[this.activeTopic]["name"]}`,
            marker: {
                pattern: {
                    // apply striped pattern only for current running time
                    shape: this.data.startDate.map((_, index) =>
                        this.stripedOrNot(index)
                    ),
                    size: 7,
                    solidity: 0.6
                },
                color: `${topicDefinitions[this.activeTopic]["color-hex"]}`
            },
        }];
        this.layout.yaxis!.title!.text = `${topicDefinitions[this.activeTopic]["y-title"]}`
    }

    /**
     * Return striped if first or last element are not fully contained in timeline.
     */
    stripedOrNot(index: number) {
        // only check first and last 2 indexes - otherwise performance will suffer
        if (![0, this.data.startDate.length - 1, this.data.startDate.length - 2].includes(index)) {
            return ''
        }

        if (
            dayjs.utc(this.relevantState().end).isBefore(dayjs.utc(this.data.endDate[index]))
            || dayjs.utc(this.dataService.metaData().max_timestamp).isBefore(dayjs.utc(this.data.endDate[index]))
            || dayjs.utc(this.relevantState().start).isAfter(dayjs.utc(this.data.startDate[index]))
        ) {
            return '/'
        }

        return ''
    }

    fitToContent() {
        return () => {
            const data_start = this.data.topics[this.activeTopic].value.findIndex(value => value != 0)
            const data_end = this.data.topics[this.activeTopic].value.findLastIndex(value => value != 0)
            const half_an_interval = moment.duration(this.relevantState().interval).asMilliseconds() / 2;
            this.layout.xaxis = {
                autorange: false,
                range: [
                    UTCStringToLocalDateConverterFunction(dayjs(this.data.startDate[data_start > 0 ? data_start : 0]).subtract(half_an_interval, 'milliseconds').toDate().toISOString()),
                    UTCStringToLocalDateConverterFunction(dayjs(this.data.startDate[data_end > 0 ? data_end : this.data.startDate.length - 1]).add(half_an_interval, 'milliseconds').toDate().toISOString())
                ]
            }
        }
    }

    resetZoom() {
        this.layout.xaxis = {
            autorange: true
        }
    }
}
