import {Component, computed, effect, ElementRef, ViewChild,} from '@angular/core';

import Plotly from 'plotly.js-geo-dist';
import {Config} from 'plotly.js-basic-dist-min';
import {
    ICountryStatsData,
    ICountryStatsDataAsArrays,
    ITopicCountryData,
    IWrappedCountryStatsData,
    IWrappedTopicCountryData,
    StatsType
} from '../types';
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
    data!: Array<ICountryStatsData>;
    selectedTopics!: StatsType;
    selectedCountries!: string;

    private relevantState = computed(() => {
        const state = this.stateService.appState();
        return {
            hashtag: state.hashtag,
            start: state.start,
            end: state.end,
            countries: state.countries,
            topics: state.topics,
            active_topic: state.active_topic
        }
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
            this.selectedTopics = this.relevantState().active_topic
            this.requestDataFromAPI(this.relevantState());
        });

        // Effect for map to update when ONLY active_topic changes
        effect(() => {
            this.selectedTopics = this.activeTopicState()
            if (this.data) {
                this.prepareMapDataToPlot(this.data)
            }
        })

        // Effect for map to update to show selected countries
        effect(() => {
            this.selectedCountries = this.activeCountriesState()
            if (this.data) {
                this.prepareMapDataToPlot(this.data)
            }
        })
    }

    requestDataFromAPI(state: { hashtag: string; start: string; end: string; topics: string }) {
        this.isCountriesLoading = true;
        // fire API to get map data
        this.dataService.requestCountryStats(state).subscribe({
            next: (res: IWrappedCountryStatsData) => {
                // add 'hashtag'
                res.result.map((r: any) => {
                    r['hashtag'] = state['hashtag']
                    r['startDate'] = state['start']
                    r['endDate'] = state['end']
                })

                const tempCountryResponse = res.result
                if (state['topics'] !== '') {
                    this.dataService.requestTopicCountryStats(state)
                        .subscribe((res: IWrappedTopicCountryData) => {
                            // add each Topic to Map data to make them a part of CSV
                            this.data = this.addTopicDataToCountries(res.result, tempCountryResponse)
                            this.prepareMapDataToPlot(this.data)
                        });
                } else {
                    // if non Topic is selected only countryData is sent to MapComponent
                    this.data = tempCountryResponse
                    this.prepareMapDataToPlot(this.data)
                }
                this.isCountriesLoading = false;
            },
            error: (err) => {
                console.error('Error while requesting Country data  ', err)
                this.isCountriesLoading = false;
            }
        });
    }

    prepareMapDataToPlot(data: Array<ICountryStatsData>): void {
        const notSelectedCountryData: ICountryStatsData[] = [];
        const selectedCountryData = data.filter((dataPoint: any) => {
            if (this.selectedCountries.includes(dataPoint["country"])) {
                return true
            } else {
                notSelectedCountryData.push(dataPoint)
                return false
            }
        })

        const selectedCountryStatsArrays = this.selectedCountries != "" ?
            this.getSortedStatsFromData(selectedCountryData, this.activeTopicState())
            : this.getSortedStatsFromData(data, this.activeTopicState())
        const notSelectedCountryStatsArrays = this.selectedCountries != "" ?
            this.getSortedStatsFromData(notSelectedCountryData, this.activeTopicState())
            : this.getSortedStatsFromData([], this.activeTopicState())


        let cmin;
        let cmax;
        if (notSelectedCountryStatsArrays[this.activeTopicState()]!.length != 0) {
            cmax = notSelectedCountryStatsArrays[this.activeTopicState()]![0] > selectedCountryStatsArrays[this.activeTopicState()]![0]
                ? notSelectedCountryStatsArrays[this.activeTopicState()]![0]
                : selectedCountryStatsArrays[this.activeTopicState()]![0]

            cmin = notSelectedCountryStatsArrays[this.activeTopicState()]!.at(-1)! < selectedCountryStatsArrays[this.activeTopicState()]!.at(-1)!
                ? notSelectedCountryStatsArrays[this.activeTopicState()]!.at(-1)!
                : selectedCountryStatsArrays[this.activeTopicState()]!.at(-1)!
        } else {
            cmax = selectedCountryStatsArrays[this.activeTopicState()]![0]
            cmin = selectedCountryStatsArrays[this.activeTopicState()]!.at(-1)!
        }

        // min should never be negative, otherwise the positive which is currently the only one displayed
        // can lose its color scale
        cmin = cmin > 0 ? cmin : 0;

        if (data && this.activeTopicState()) {
            this.initPlotlyMap({
                selectedCountryStatsArrays: selectedCountryStatsArrays,
                notSelectedCountryStatsArrays: notSelectedCountryStatsArrays,
                stats: this.activeTopicState(),
                cmin: cmin,
                cmax: cmax
            });
        }

    }

    getSortedStatsFromData(data: ICountryStatsData[], stats: StatsType): Partial<ICountryStatsDataAsArrays> {
        return data.sort((a, b) => b[stats]! - a[stats]!)
            .reduce<Partial<ICountryStatsDataAsArrays> & { country: string[] }>((previousValue, currentValue) => {
                previousValue["country"].push(currentValue["country"]);
                previousValue[stats]?.push(currentValue[stats]!);
                return previousValue;
            }, {
                country: [],
                [stats]: []
            })
    }

    initPlotlyMap({selectedCountryStatsArrays, notSelectedCountryStatsArrays, stats, cmin, cmax}: {
        selectedCountryStatsArrays: Partial<ICountryStatsDataAsArrays>;
        notSelectedCountryStatsArrays: Partial<ICountryStatsDataAsArrays>;
        stats: StatsType,
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
                hovertext: notSelectedCountryStatsArrays[stats],
                locations: notSelectedCountryStatsArrays.country,
                customdata: notSelectedCountryStatsArrays[stats],
                marker: {
                    size: notSelectedCountryStatsArrays[stats],
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
                hovertext: selectedCountryStatsArrays[stats],
                locations: selectedCountryStatsArrays.country,
                customdata: selectedCountryStatsArrays[stats],
                marker: {
                    size: selectedCountryStatsArrays[stats],
                    color: selectedCountryStatsArrays[stats],
                    colorbar: {
                        title: {
                            text: topicDefinitions[stats]["dropdown_name"],
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
                    colorscale: topicDefinitions[stats]["color-scale"]
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
        return mergedData;
    }

}
