import {Component, computed, effect, ElementRef, NgZone, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {StateService} from '../../../lib/state.service';
import {Overlay} from '../../overlay.component';
import {Color, Deck, DeckProps, MapView, PickingInfo} from '@deck.gl/core';
import {TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer, ScatterplotLayer} from '@deck.gl/layers';
import {DataService} from '../../../lib/data.service';
import {ICountryData, ICountryLocationData, IStateParams, StatsType} from '../../../lib/types';
import countryPlotPositions from '../../../assets/static/json/countryLabelpoint.json';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json";
import {scalePow, scaleSqrt} from 'd3-scale';
import {interpolateHcl} from 'd3-interpolate';
import {lch, rgb} from 'd3-color';

import {CountryMapLegendComponent} from "./country-map-legend/country-map-legend.component";

const typedCountryPlotPositions = countryPlotPositions as unknown as { [countryCode: string]: [number, number] | null };

@Component({
    selector: 'app-country-map',
    imports: [Overlay, CountryMapLegendComponent],
    templateUrl: './country-map.component.html',
    styleUrl: './country-map.component.scss'
})
export class CountryMapComponent implements OnInit, OnDestroy {

    @ViewChild('deckContainer', {static: true}) deckContainer!: ElementRef;

    isLoading = signal(false);
    enrichedCountryData = signal<ICountryLocationData[]>([]);
    selectedCountries = computed(
        () => this.stateService.appState().countries
    );
    activeTopic = computed<StatsType>(
        () => this.relevantState().active_topic
    );

    minMaxStats = computed(() => {
        const data = this.enrichedCountryData();
        if (!data.length) {
            return {minValue: 0, maxValue: 0};
        }

        return data.reduce(
            (previousValue: { minValue: number; maxValue: number; }, currentValue: ICountryLocationData) => {
                return {
                    minValue: Math.min(previousValue.minValue, currentValue.value),
                    maxValue: Math.max(previousValue.maxValue, currentValue.value)
                }
            }, {minValue: Infinity, maxValue: -Infinity}
        );
    });

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

    deck!: Deck<MapView>;

    constructor(
        private stateService: StateService,
        private dataService: DataService,
        private readonly ngZone: NgZone
    ) {
        effect(() => {
            this.updateData(this.relevantState());
        });

        effect(() => {
            this.createOrReplaceCountryDataLayer(this.enrichedCountryData(), this.selectedCountries());
        });
    }

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.initializeDeck();
        })

    }

    ngOnDestroy() {
        this.deck?.finalize();
    }

    updateData(state: IStateParams) {
        const reqParams = {
            hashtag: state.hashtag,
            start: state.start,
            end: state.end,
            topics: state.active_topic,
        }

        this.isLoading.set(true);
        this.dataService.requestCountryStats(reqParams).subscribe({
            next: (res) => {
                const countryData: ICountryData[] = res.result.topics[this.activeTopic()];
                this.enrichedCountryData.set(this.enrichCountryDataWithPlotPositions(countryData));
                this.isLoading.set(false);
            },
            error: (err) => {
                console.log(err);
                this.isLoading.set(false);
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

    getColorFn() {
        const topicColorHex = topicDefinitions[this.activeTopic()]?.["color-hex"]

        // Interpolator
        // Negative color ranges from pale to strong red
        const negativeColorStrong = lch("#a50026");
        negativeColorStrong.opacity = 1;
        const negativeColorPale = lch(70, negativeColorStrong.c, negativeColorStrong.h, 0.7);
        const negativeInterpolator = interpolateHcl(negativeColorPale, negativeColorStrong);

        // Positive color ranges from strong to pale topicColor
        const positiveColorStrong = lch(topicColorHex);
        positiveColorStrong.opacity = 0.7;
        const positiveColorPale = lch(70, positiveColorStrong.c, positiveColorStrong.h, 0.3);
        const positiveInterpolator = interpolateHcl(positiveColorStrong, positiveColorPale);

        const {minValue, maxValue} = this.minMaxStats();
        const abMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
        const negativeScale = scalePow([-abMax, 0], [0, 1]).exponent(1 / 4);
        const positiveScale = scalePow([0, abMax], [0, 1]).exponent(2);

        return function (value: number, country: string, selectedCountries = ""): Color {

            let color;
            if (value < 0) {
                color = lch(negativeInterpolator(negativeScale(value)));
            } else {
                color = lch(positiveInterpolator(positiveScale(value)));
            }

            if (selectedCountries !== "" && !selectedCountries.split(",").includes(country)) {
                color.c = 0;
            }

            color = rgb(color)

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
            renderSubLayers: (props) => {
                const {boundingBox: [[west, south], [east, north]]} = props.tile;
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

        const numberFormat = new Intl.NumberFormat();
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
            getTooltip: ({object: countryData}: PickingInfo<ICountryLocationData>) => countryData && `${countryData.country}: ${numberFormat.format(countryData.value)}`,
            layers: [osmLayer],
        } as DeckProps<MapView>);
    };

    createOrReplaceCountryDataLayer = (enrichedCountryData: ICountryLocationData[], selectedCountries: string) => {
        const countryLayer = new ScatterplotLayer<ICountryLocationData>({
            id: 'countryLayer',
            data: enrichedCountryData,
            getPosition: d => d.lonLat,
            getFillColor: d => this.getColorFn()(d.value, d.country, selectedCountries),
            updateTriggers: {
                getFillColor: selectedCountries
            },
            getRadius: this.getRadiusFn(),
            radiusUnits: 'pixels',
            stroked: true,
            getLineWidth: 0.6,
            lineWidthUnits: 'pixels',
            pickable: true
        });
        this.deck.setProps({layers: [this.deck.props.layers[0], countryLayer]})
    }

    getRadiusFn() {
        const {minValue, maxValue} = this.minMaxStats();
        const minRadiusPx = 3;
        const maxRadiusPx = 40;
        const absoluteMaxValue = Math.max(Math.abs(minValue), Math.abs(maxValue));
        const scalePowFn = scaleSqrt([0, absoluteMaxValue], [0, maxRadiusPx]);
        return (d: Pick<ICountryLocationData, "value">): number => {
            return (d.value !== 0) ? Math.max((scalePowFn(Math.abs(d.value))), minRadiusPx) : 0;
        }
    }

    transFormFn(value: number): Pick<ICountryLocationData, "value" | "country"> {
        return {value, country: ""};
    }

    protected readonly topicDefinitions = topicDefinitions;
}
