import {Component, computed, effect, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Color, Deck, DeckProps, MapView, PickingInfo} from '@deck.gl/core';
import {H3HexagonLayer, H3HexagonLayerProps, TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import {lch, rgb} from 'd3-color';
import {scalePow} from 'd3-scale';
import {interpolateHcl} from "d3-interpolate";
import {HexDataType, IStateParams, StatsType} from '../types'
import {StateService} from "../../state.service";
import {DataService} from "../../data.service";
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-hex-map',
    templateUrl: './hex-map.component.html',
    styleUrls: ['./hex-map.component.scss'],
    standalone: false
})
export class HexMapComponent implements OnInit, OnDestroy {
    @ViewChild('deckContainer', {static: true}) deckContainer!: ElementRef;

    private relevantState = computed((): IStateParams => {
        return this.stateService.appState()
    }, {
        equal: (a, b) => {
            return a.active_topic === b.active_topic
                && a.hashtag === b.hashtag
                && a.start === b.start
                && a.end === b.end
                && a.topics == b.topics
                && a.countries == b.countries
        }
    })
    colorFunc: ((value: HexDataType) => Color) | undefined = undefined;
    selectedTopic!: StatsType;
    deck!: Deck<MapView>;
    minMaxStats!: { result: { max: number; min: number } };
    private layer!: H3HexagonLayer<HexDataType>;
    currentResolution = 3;
    private MAX_HEX_CELL = 314000;
    private canToggleResolution = false;

    // Fixed TileLayer configuration
    private readonly osmLayer = new TileLayer({
        id: 'osm-tiles',
        data: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: (props) => {
            const {
                boundingBox: [[west, south], [east, north]]
            } = props.tile;

            return new BitmapLayer({
                ...props,
                data: undefined,
                image: props.data,
                bounds: [west, south, east, north]
            });
        },
        opacity: 0.7
    });
    isH3Loading: boolean = false;

    constructor(
        private stateService: StateService,
        private dataService: DataService,
        private toastService: ToastService,
        private readonly ngZone: NgZone) {

        effect(() => {
            this.selectedTopic = this.relevantState().active_topic
            this.currentResolution = 3
            this.canToggleResolution = false
            const reqParams = {
                hashtag: this.relevantState().hashtag,
                start: this.relevantState().start,
                end: this.relevantState().end,
                countries: this.relevantState().countries,
                topic: this.relevantState().active_topic,
                resolution: 3
            }
            this.updateLayer(reqParams)
        })
    }

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.initializeDeck();
        })
    }

    ngOnDestroy() {
        if (this.deck) {
            this.deck.finalize();
        }
    }

    private initializeDeck() {
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
            layers: [this.osmLayer, this.layer],
        }  as DeckProps<MapView>);
    }

    async updateLayer(reqParams: {
        hashtag: string;
        start: string;
        end: string;
        countries: string;
        topic: string;
        resolution: number;
    }) {
        this.layer = await this.createCountryLayer(reqParams);
        this.deck.setProps({
            layers: [this.osmLayer, this.layer],
            getTooltip: ({object}: PickingInfo<HexDataType>) =>
                object ? {text: `${object.result} ${topicDefinitions[this.selectedTopic]?.["y-title"]}`} : null
        });
    }

    async createCountryLayer(
        params: { hashtag: string, start: string, end: string, topic: string, resolution: number, countries: string },
        options?: Partial<H3HexagonLayerProps<HexDataType>>,
    ): Promise<H3HexagonLayer<HexDataType>> {
        this.isH3Loading = true;
        let result;
        try {
            result = await this.dataService.getH3Map(params).toPromise();
        } catch (e: any) {
            console.error('Error getting HexMap data from API ', e);
            console.info('Request params: ', params);
            if (e.error && e.error[0]) {
                const errMessage = JSON.parse(e.error);
                this.toastService.show({
                    title: 'Error while getting Hex Map data from API',
                    body: 'Something went wrong while requesting data for Map with Hexagonal info. \n' + errMessage[0].message,
                    type: 'error'
                })
            } else {
                this.toastService.show({
                    title: 'Error while getting Hex Map data from API',
                    body: 'Something went wrong while requesting data for Map with Hexagonal info. Please try again with modify request.',
                    type: 'error'
                })
            }
            this.isH3Loading = false;
        }

        if (result) {
            this.isH3Loading = false;
            // Calculate maxStats
            this.minMaxStats = result.reduce(
                (prev, curr) => ({
                    result: {
                        max: Math.max(prev.result.max, curr.result),
                        min: Math.min(prev.result.min, curr.result)
                    }
                }),
                {
                    result: {
                        min: 1,
                        max: 0
                    }
                }
            );

            // count the number ot hex-cells
            const num_of_cells = result.length - 1 // first row is the CSV header
            if (num_of_cells * (7 * 7 * 7) < this.MAX_HEX_CELL) {
                // Enable toggle even if not auto-switching
                this.canToggleResolution = true;
            }
        }

        // Build the layer
        this.colorFunc = this.getColorFn();
        let layer = new H3HexagonLayer<HexDataType>({
            id: 'H3HexagonLayer',
            data: result,
            extruded: false,
            getHexagon: (d: HexDataType) => d.hex_cell,
            getFillColor: this.colorFunc,
            pickable: true,
            opacity: 1,
        });

        if (options) {
            layer = layer.clone(options);
        }
        return layer;
    }

    // Toggle resolution with manual override
    toggleResolution() {
        if (!this.canToggleResolution) return;

        const newResolution = this.currentResolution === 6 ? 3 : 6;
        this.currentResolution = newResolution;

        const reqParams = {
            hashtag: this.relevantState().hashtag,
            start: this.relevantState().start,
            end: this.relevantState().end,
            countries: this.relevantState().countries,
            topic: this.relevantState().active_topic,
            resolution: newResolution
        }
        this.updateLayer(reqParams);
    }

    // Getter for template access
    get showResolutionToggle(): boolean {
        return this.canToggleResolution;
    }

    // Getter for slider state
    get isHighResolution(): boolean {
        return this.currentResolution === 6;
    }

    getColorFn() {
        const topicColorHex = topicDefinitions[this.selectedTopic]?.["color-hex"]

        const tempTopicColorLch = lch(topicColorHex);
        const topicLiteColorLch = lch(
            90, // common lightness for all topic colors to start off
            tempTopicColorLch.c * 0.7,
            tempTopicColorLch.h
        );

        // Interpolator
        // Negative color ranges from red to topicColor
        const negativeInterpolator = interpolateHcl("#a50026", topicLiteColorLch);
        // Positive color ranges from topicColor to blue
        const positiveInterpolator = interpolateHcl(topicLiteColorLch, "#313695");

        const {min, max} = this.minMaxStats.result;
        const abMax = Math.max(Math.abs(min), Math.abs(max));
        const negativeScale = scalePow([-abMax, 0], [0, 1]).exponent(1 / 4);
        const transparencyScale = scalePow([0, abMax], [0.3 * 255, 0.7 * 255]).exponent(1 / 4);
        const positiveScale = scalePow([0, abMax], [0, 1]).exponent(1 / 4);

        return (value: Pick<HexDataType, "result">): Color => {
            const result = value.result;

            let color, opacity;
            if (result < 0) {
                // Use negative interpolator (from red to topicColor)
                color = rgb(negativeInterpolator(negativeScale(result)));
                opacity = transparencyScale(Math.abs(result));
            } else {
                // Use positive interpolator (from topicColor to blue)
                color = rgb(positiveInterpolator(positiveScale(result)));
                opacity = transparencyScale(Math.abs(result));
            }

            return [color.r, color.g, color.b, opacity];
        }
    }

    getTopicUnit(): string {
        return topicDefinitions[this.selectedTopic]?.["name"] + ' per hex cell' || '';
    }

    transFormFn(value: number): Pick<HexDataType, "result"> {
        return {result: value};
    }
}
