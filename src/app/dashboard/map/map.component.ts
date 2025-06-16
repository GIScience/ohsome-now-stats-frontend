import {Component, computed, effect, ElementRef, ViewChild,} from '@angular/core';

import Plotly from 'plotly.js-geo-dist';
import {Config} from 'plotly.js-basic-dist-min';
import {ICountryData, ICountryDataAsArrays, IQueryParams, StatsType} from '../types';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {StateService} from "../../state.service";
import {DataService} from "../../data.service";

// Purples from d3-scale-chromatic at https://observablehq.com/@d3/color-schemes

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    standalone: false
})

export class MapComponent {
    @ViewChild('d3Map') d3MapElement: ElementRef | undefined;
    isCountriesLoading: boolean = false;
    data!: Record<StatsType, ICountryData[]>;
    selectedTopic!: StatsType;
    selectedCountries!: string;

    private relevantState = computed(() => {
        return this.stateService.appState()
    }, {
        equal: (a, b) => {
            return a.hashtag === b.hashtag
                && a.start === b.start
                && a.end === b.end
                && a.topics == b.topics
        }
    });
    private activeTopicState = computed(() => {
        return this.stateService.appState().active_topic;
    });
    private activeCountriesState = computed(() => {
        return this.stateService.appState().countries;
    });


    constructor(
        private stateService: StateService,
        private dataService: DataService,
    ) {
        effect(() => {
            this.selectedTopic = this.relevantState().active_topic
            this.requestDataFromAPI(this.relevantState());
        });

        // Effect for map to update when ONLY active_topic changes
        effect(() => {
            this.selectedTopic = this.activeTopicState()
            if (this.data) {
                this.prepareMapDataToPlot()
            }
        })

        // Effect for map to update to show selected countries
        effect(() => {
            this.selectedCountries = this.activeCountriesState()
            if (this.data) {
                this.prepareMapDataToPlot()
            }
        })
    }

    requestDataFromAPI(state: IQueryParams) {
        this.isCountriesLoading = true;
        // fire API to get map data
        this.dataService.requestCountryStats(state).subscribe({
            next: (res) => {
                this.data = res.result.topics
                this.prepareMapDataToPlot()
                this.isCountriesLoading = false;
            },
            error: (err) => {
                console.error('Error while requesting Country data  ', err)
                this.isCountriesLoading = false;
            },
        });
    }

    prepareMapDataToPlot(): void {
        const notSelectedCountryData: ICountryData[] = [];
        const selectedCountryData = this.data[this.selectedTopic].filter((dataPoint: any) => {
            if (!this.selectedCountries || this.selectedCountries.includes(dataPoint["country"])) {
                return true
            } else {
                notSelectedCountryData.push(dataPoint)
                return false
            }
        })
        const selectedCountryStatsArrays = this.listOfObjectsToObjectWithLists(
            selectedCountryData
        )
        const notSelectedCountryStatsArrays = this.listOfObjectsToObjectWithLists(
            notSelectedCountryData
        )

        let cMin = 0, cMax = -Infinity;
        for (const {value} of this.data[this.selectedTopic]) {
            if (value > cMax) cMax = value;
            if (value < cMin && value > 0) cMin = value;
        }

        if (this.data && this.selectedTopic) {
            this.initPlotlyMap({
                selectedCountryStatsArrays: selectedCountryStatsArrays,
                notSelectedCountryStatsArrays: notSelectedCountryStatsArrays,
                cmin: cMin,
                cmax: cMax
            });
        }

    }

    listOfObjectsToObjectWithLists(data: ICountryData[]): ICountryDataAsArrays {
        return {
            countries: data.map(d => d.country),
            values: data.map(d => d.value)
        };
    }

    initPlotlyMap({selectedCountryStatsArrays, notSelectedCountryStatsArrays, cmin, cmax}: {
        selectedCountryStatsArrays: ICountryDataAsArrays;
        notSelectedCountryStatsArrays: ICountryDataAsArrays;
        cmin: number,
        cmax: number
    }) {
        const plotData: object[] = [
            {
                type: 'scattergeo',
                mode: 'markers',
                geo: 'geo',
                locationmode: 'ISO-3',
                hoverinfo: 'location+text',
                hovertext: notSelectedCountryStatsArrays.values,
                locations: notSelectedCountryStatsArrays.countries,
                customdata: notSelectedCountryStatsArrays.values,
                marker: {
                    size: notSelectedCountryStatsArrays.values,
                    color: "#cccccc",
                    cmin: cmin,
                    cmax: cmax,
                    sizemode: 'area',
                    sizemin: 2,
                    // sizeref formula from https://stackoverflow.com/a/57422764
                    sizeref: cmax / 60 ** 2,
                    reversescale: false,
                    line: {
                        color: 'white'
                    }
                },
                name: "not selected"
            },
            {
                type: 'scattergeo',
                mode: 'markers',
                geo: 'geo',
                locationmode: 'ISO-3',
                hoverinfo: 'location+text',
                hovertext: selectedCountryStatsArrays.values,
                locations: selectedCountryStatsArrays.countries,
                customdata: selectedCountryStatsArrays.values,
                marker: {
                    size: selectedCountryStatsArrays.values,
                    color: selectedCountryStatsArrays.values,
                    colorbar: {
                        title: {
                            text: topicDefinitions[this.selectedTopic]["dropdown_name"],
                            side: "top"
                        },
                        orientation: 'h',
                        y: 0,
                        thicknessmode: 'fraction',
                        thickness: 0.03,
                        len: 0.75
                    },
                    cmin: cmin,
                    cmax: cmax,
                    sizemode: 'area',
                    sizemin: 2,
                    // sizeref formula from https://stackoverflow.com/a/57422764
                    sizeref: cmax / 60 ** 2,
                    colorscale: topicDefinitions[this.selectedTopic]["color-scale"]
                        .map((value, index) => [index / 39, value]),
                    reversescale: false,
                    line: {
                        color: 'black'
                    },
                },
                showlegend: false
            }];

        const corner = window.innerWidth > 600 ? 1 : 0;
        const anchor = window.innerWidth > 600 ? "right" : "left";

        const layout = {
            margin: {
                t: 0, l: 0, b: 0, r: 0
            },
            autosize: true,
            geo: {
                scope: 'world',
                resolution: 110, // 50 => ca 1:50 Mio.
                showcountries: true,
                showland: true,
                landcolor: "#e5e5e5",
                showocean: true,
                oceancolor: '#f5f5f5',
                showframe: true,
                projection: {
                    type: 'robinson'
                }
            },
            legend: {
                x: corner,
                xanchor: anchor,
                y: corner
            },
            xaxis: {
                automargin: true
            },
            shapes: [{
                type: 'rect',
                xref: 'paper',
                yref: 'paper',
                y0: 0,
                y1: 0.1,
                x0: 0,
                x1: 1,
                fillcolor: 'white',
                opacity: 1,
                line: {
                    width: 0
                }
            }]
        };

        const config: Partial<Config> = {
            responsive: true,
            displayModeBar: false,
            topojsonURL: "./assets/static/",
        };

        Plotly.newPlot('d3-map', plotData, layout, config);
    }
}
