import {Component, computed, effect, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Color, Deck, PickingInfo} from '@deck.gl/core';
import {H3HexagonLayer, H3HexagonLayerProps, TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import {lch, rgb} from 'd3-color';
import {scalePow} from 'd3-scale';
import {HexDataType, StatsType} from '../types'
import {StateService} from "../../state.service";
import {DataService} from "../../data.service";
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {interpolateHcl} from "d3-interpolate";
import {DataType} from "@loaders.gl/core";

@Component({
    selector: 'app-hex-map',
    templateUrl: './hex-map.component.html',
    styleUrls: ['./hex-map.component.scss'],
    standalone: false
})
export class HexMapComponent implements OnInit, OnDestroy {
    @ViewChild('deckContainer', {static: true}) deckContainer!: ElementRef;

    private relevantState = computed(() => this.stateService.appState())

    selectedTopic!: StatsType;
    private deck!: Deck;
    private minMaxStats!: { result: { max: number; min: number } };
    private layer!: H3HexagonLayer<HexDataType>;

    // Fixed TileLayer configuration
    private readonly osmLayer = new TileLayer({
        id: 'osm-tiles',
        data: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: (props: any) => {
            const {
                bbox: {west, south, east, north}
            } = props.tile;

            return new BitmapLayer({
                ...props,
                data: undefined, // Changed from null to undefined
                image: props.data,
                bounds: [west, south, east, north]
            });
        },
        opacity: 0.7
    });
    isH3Loading: boolean = false;

    constructor(
        private stateService: StateService,
        private dataService: DataService) {

        effect(() => {
            this.selectedTopic = this.relevantState().active_topic
            this.updateLayer()
        })
    }

    async ngOnInit() {
        const reqParams = {
            hashtag: this.relevantState().hashtag,
            start: this.relevantState().start,
            end: this.relevantState().end,
            countries: this.relevantState().countries,
            topic: this.relevantState().active_topic,
            resolution: 3
        }
        this.layer = await this.createCountryLayer(reqParams);
        this.initializeDeck();
    }

    ngOnDestroy() {
        if (this.deck) {
            this.deck.finalize();
        }
    }

    private initializeDeck() {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        this.deckContainer.nativeElement.appendChild(canvas);

        this.deck = new Deck({
            canvas: canvas,
            width: this.deckContainer.nativeElement.clientWidth,
            height: this.deckContainer.nativeElement.clientHeight,
            initialViewState: {
                latitude: 49.6112768,
                longitude: 6.129799,
                zoom: 1,
            },
            controller: true,
            layers: [this.osmLayer, this.layer],
        } as any);
    }

    async updateLayer() {
        const reqParams = {
            hashtag: this.relevantState().hashtag,
            start: this.relevantState().start,
            end: this.relevantState().end,
            countries: this.relevantState().countries,
            topic: this.relevantState().active_topic,
            resolution: 3
        }
        this.layer = await this.createCountryLayer(reqParams);
        this.deck.setProps({
            layers: [this.osmLayer, this.layer],
            getTooltip: ({object}: PickingInfo<HexDataType>) =>
                object ? { text: `Value: ${object.result} ${topicDefinitions[this.selectedTopic]?.["y-title"]}` } : null
        });
    }

    private async createCountryLayer(
        params: { hashtag: string, start: string, end: string, topic: string, resolution: number, countries: string },
        options?: Partial<H3HexagonLayerProps<HexDataType>>,
    ): Promise<H3HexagonLayer<HexDataType>> {
        this.isH3Loading = true;
        const result = await this.dataService.getH3Map(params).toPromise();

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
                        min: 0,
                        max: 0
                    }
                }
            );
        }

        // Build the layer
        let layer = new H3HexagonLayer<HexDataType>({
            id: 'H3HexagonLayer',
            data: result,
            extruded: false,
            getHexagon: (d: HexDataType) => d.hex_cell,
            getFillColor: this.getColorFn(),
            pickable: true,
            opacity: 1,
            // onHover: this.updateTooltip
        });

        if (options) {
            layer = layer.clone(options);
        }
        return layer;
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

        const { min, max } = this.minMaxStats.result;
        const abMax = Math.max(Math.abs(min), Math.abs(max));
        const negativeScale = scalePow([-abMax, 0], [0, 1]).exponent(1/4);
        const transparencyScale = scalePow([0, abMax], [0.3 * 255, 0.7 * 255]).exponent(1/4);
        const positiveScale = scalePow([0, abMax], [0, 1]).exponent(1/4);

        return (value: HexDataType): Color => {
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

    updateTooltip({object, x, y}: PickingInfo<HexDataType>) {
        // if (object) {
        //     // tooltip.style.display = 'block';
        //     // tooltip.style.left = `${x}px`;
        //     // tooltip.style.top = `${y}px`;
        //     tooltip.innerText = object.result;
        // } else {
        //     tooltip.style.display = 'none';
        // }
        return object!.result
    }
}