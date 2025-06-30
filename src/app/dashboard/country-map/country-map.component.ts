import {Component, computed, effect, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {StateService} from 'src/app/state.service';
import {Overlay} from '../../overlay.component';
import {Color, Deck, DeckProps, MapView, PickingInfo} from '@deck.gl/core';
import {TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer, ScatterplotLayer} from '@deck.gl/layers';
import {DataService} from '../../data.service';
import {ICountryData, ICountryLocationData, IWrappedCountryResult, StatsType} from '../types';
import countryPlotPositions from '../../../assets/static/json/countryLabelpoint.json';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json";
import {scalePow, scaleSqrt} from 'd3-scale';
import {interpolateHcl} from 'd3-interpolate';
import {lch, rgb} from 'd3-color';

const typedCountryPlotPositions = countryPlotPositions as unknown as { [countryCode: string]: [number, number] | null };

@Component({
    selector: 'app-country-map',
    imports: [Overlay],
    templateUrl: './country-map.component.html',
    styleUrl: './country-map.component.scss'
})
export class CountryMapComponent implements OnInit, OnDestroy {

    @ViewChild('deckContainer', {static: true}) deckContainer!: ElementRef;

    private relevantState = computed(() => {
        return this.stateService.appState()
    }, {
        // country map data changes when one of the following properties change
        equal: (a, b) => {
            return a.hashtag === b.hashtag
                && a.start === b.start
                && a.end === b.end
                && a.active_topic == b.active_topic
        }
    });
    // filtering on countries should only change style, but not trigger new data request
    private countryState = computed(() => {
        return this.stateService.appState().countries
    })

    activeTopic: StatsType = this.relevantState().active_topic;
    selectedCountries: string = this.countryState();
    isLoading: boolean = false;
    deck!: Deck<MapView>;
    minMaxStats: {minValue: number; maxValue: number;} = {minValue:0, maxValue:0};

    constructor(
        private stateService: StateService,
        private dataService: DataService
    ) {
        effect(() => {
            this.activeTopic = this.relevantState().active_topic;
            this.updateData();

        });

        effect(() => {
            this.selectedCountries = this.countryState();
            this.updateCountryFilterStyle(this.selectedCountries);
        });
    }

    ngOnInit() {
        this.initializeDeck();
    }

    ngOnDestroy() {
        if (this.deck) {
            this.deck.finalize();
        }
    }

    updateData() {
        console.log("updateData")

        //create or update ScatterplotLayer

        //get data
        const reqParams = {
            hashtag: this.relevantState().hashtag,
            start: this.relevantState().start,
            end: this.relevantState().end,
            topics: this.relevantState().active_topic,
        }

        function getAreaProportionalRadius(options: { minRadiusPx: number, maxRadiusPx:number, minValue: number, maxValue: number, value: number }) {
            const {minRadiusPx, maxRadiusPx, minValue, maxValue, value} = options;

            const absoluteMaxValue = Math.max(Math.abs(minValue),Math.abs(maxValue));
            const scalePowFn = scaleSqrt([0,absoluteMaxValue], [0,maxRadiusPx]);

            return (value !== 0)? Math.max((scalePowFn(Math.abs(value))), minRadiusPx) : 0;
        }

        const drawNewCountryDataLayer = (response: IWrappedCountryResult) => {
            const countryData: ICountryData[] = response.result.topics[this.activeTopic];
            const enrichedCountryData: ICountryLocationData[] = this.enrichCountryDataWithPlotPositions(countryData);
            this.minMaxStats = enrichedCountryData.reduce(
                (previousValue:{minValue: number; maxValue: number;}, currentValue: ICountryLocationData)=> {
                    return {
                        minValue: Math.min(previousValue.minValue, currentValue.value),
                        maxValue: Math.max(previousValue.maxValue, currentValue.value)
                    }
                }, {minValue: Infinity, maxValue: -Infinity}
            );

            const countryLayer = new ScatterplotLayer<ICountryLocationData>({
                id: 'countryLayer',
                data: enrichedCountryData,
                getPosition: (d: ICountryLocationData) => d.lonLat,
                getFillColor: this.getColorFn(),
                getRadius: (d: ICountryLocationData) => getAreaProportionalRadius({
                    minRadiusPx: 3,
                    maxRadiusPx: 40,
                    minValue: this.minMaxStats.minValue,
                    maxValue: this.minMaxStats.maxValue,
                    value: d.value
                }),
                radiusUnits: 'pixels',
                stroked: true,
                getLineWidth: 0.6,
                lineWidthUnits: 'pixels',
                pickable: true
            });

            this.deck.setProps({layers: [this.deck.props.layers[0], countryLayer]})
        }

        this.isLoading = true;
        this.dataService.requestCountryStats(reqParams).subscribe({
            next: drawNewCountryDataLayer,
            error: (err) => {
                console.log(err);
                this.isLoading = false;
            },
            complete: () => {
                this.isLoading = false;
            }
        })


    }

    /**
     * Country codes, which are defined as null in the countryPlotPositions will be filtered out and therefore not rendered.
     * If we get data with unknown (undefined) country codes an error will be logged in the console such that we can update our location file
     */
    enrichCountryDataWithPlotPositions(countryData: ICountryData[]): ICountryLocationData[] {
        return (countryData.map(countryData => {
            const plotPosition = typedCountryPlotPositions[countryData.country];
            if (plotPosition !== undefined) {
                const enrichedCountryData: Omit<ICountryLocationData, 'lonLat'> & { lonLat: [number, number] | null } =
                    {...structuredClone(countryData), lonLat: plotPosition};
                return enrichedCountryData;
            } else {
                console.error(`CountryMapComponent: No plot position available for country: ${countryData.country}`);
                return {...countryData, lonLat: null};
            }
        })
            // remove all data where we do not have a location
            .filter(enrichedCountryData => enrichedCountryData.lonLat !== null) as ICountryLocationData[])
            // draw small values on top of lage ones
            .sort((a: ICountryLocationData, b: ICountryLocationData) => Math.abs(b.value) - Math.abs(a.value));
    }

    updateCountryFilterStyle(selectedCountries: string) {
        console.log("updateCountryFilterStyle", selectedCountries);
        (selectedCountries === "") ?
            console.log("use no filter style") :
            console.log("use filter style");
    }

    getColorFn() {
        const topicColorHex = topicDefinitions[this.activeTopic]?.["color-hex"]

        // Interpolator
        // Negative color ranges from pale to strong red
        const negativeColorStrong = lch("#a50026");
        negativeColorStrong.opacity = 1;
        const negativeColorPale = lch(70,negativeColorStrong.c, negativeColorStrong.h, 0.7);
        const negativeInterpolator = interpolateHcl(negativeColorPale, negativeColorStrong);

        // Positive color ranges from strong to pale topicColor
        const positiveColorStrong = lch(topicColorHex);
        positiveColorStrong.opacity = 0.7;
        const positiveColorPale = lch(70, positiveColorStrong.c, positiveColorStrong.h, 0.3);
        const positiveInterpolator = interpolateHcl(positiveColorStrong, positiveColorPale);

        const { minValue, maxValue } = this.minMaxStats;
        const abMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
        const negativeScale = scalePow([-abMax, 0], [0, 1]).exponent(1/4);
        const positiveScale = scalePow([0, abMax], [0, 1]).exponent(2);

        return (d: ICountryLocationData): Color => {
            const value = d.value;

            let color;
            if (value < 0) {
                // Use negative interpolator
                color = rgb(negativeInterpolator(negativeScale(value)));
            } else {
                // Use positive interpolator
                color = rgb(positiveInterpolator(positiveScale(value)));
            }

            return [color.r, color.g, color.b, color.opacity * 255];
        }
    }

    private initializeDeck() {
        const osmLayer = new TileLayer({
            id: 'osm-tiles',
            data: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png',
            maxZoom: 19,
            minZoom: 0,
            tileSize: 256,
            renderSubLayers: (props: any) => {
                const {bbox: {west, south, east, north}} = props.tile;
                return new BitmapLayer({
                    ...props,
                    data: undefined, // Changed from null to undefined
                    image: props.data,
                    bounds: [west, south, east, north]
                });
            },
            opacity: 0.6,
            pickable: false
        });


        this.deck = new Deck({
            parent: this.deckContainer.nativeElement,
            initialViewState: {
                latitude: 49.6112768,
                longitude: 6.129799,
                zoom: 1,
            },
            views: new MapView({
                repeat: true,
                controller: true,
            }),
            getTooltip: ({object: countryData}: PickingInfo<ICountryLocationData>) => countryData && `${countryData.country}: ${countryData.value}`,
            layers: [osmLayer],
        } as DeckProps<MapView>);
    };


}
