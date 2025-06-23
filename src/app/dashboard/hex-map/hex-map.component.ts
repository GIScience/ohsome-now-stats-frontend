import {Component, computed, effect, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Deck} from '@deck.gl/core';
import {H3HexagonLayer, H3HexagonLayerProps, TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import {HexDataType, StatsType} from '../types'
import {StateService} from "../../state.service";
import {DataService} from "../../data.service";
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"

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
    private result: any;
    private maxStats!: { result: number };
    private layer!: H3HexagonLayer<HexDataType>;

    // Fixed TileLayer configuration
    private readonly osmLayer = new TileLayer({
        id: 'osm-tiles',
        data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
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
        }
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
        // this.deck = new Deck({
        //   container: this.deckContainer.nativeElement,

        // Create canvas manually
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
        this.deck.setProps({layers: [this.osmLayer, this.layer]});
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
            this.maxStats = result.reduce(
                (prev, curr) => ({
                    result: Math.max(prev.result, curr.result)
                }),
                {result: 0}
            );
        }

        // Get the base color from topic definitions
        const topicColor = topicDefinitions[this.selectedTopic]?.["color-hex"] || "#9c27b0";
        const baseRgb = this.hexToRgb(topicColor);

        // Build the layer
        let layer = new H3HexagonLayer<HexDataType>({
            id: 'H3HexagonLayer',
            data: result,
            extruded: false,
            getHexagon: (d: any) => d.hex_cell,
            getFillColor: (d: any) => {
                const intensity = Math.log(d.result + 1) / Math.log(this.maxStats.result + 1);
                return [
                    baseRgb.r * intensity,
                    baseRgb.g * intensity,
                    baseRgb.b * intensity,
                ];
            },
            pickable: true,
            opacity: 0.3,
        });

        if (options) {
            layer = layer.clone(options);
        }
        return layer;
    }

    /**
     * Helper method to convert hex to RGB
     * @return r g b
     * @param hex
     */
    private hexToRgb(hex: string): { r: number, g: number, b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 156, g: 39, b: 176 }; // fallback to purple if parsing fails
    }
}