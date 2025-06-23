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

        // Get the color scale from topic definitions
        const colorScale = topicDefinitions[this.selectedTopic]?.["color-scale"] || [];

        // Build the layer
        let layer = new H3HexagonLayer<HexDataType>({
            id: 'H3HexagonLayer',
            data: result,
            extruded: false,
            getHexagon: (d: HexDataType) => d.hex_cell,
            getFillColor: (d: any) => {
                if (d.result === 0) {
                    // Neutral color for zero values (middle of the scale or white)
                    return [255, 255, 255];
                }

                // Calculate normalized value (0-1) based on absolute value
                const normalizedValue = Math.abs(d.result) / this.maxStats.result;

                // Map to color scale index
                const colorIndex = Math.floor(normalizedValue * (colorScale.length - 1));
                const clampedIndex = Math.max(0, Math.min(colorIndex, colorScale.length - 1));

                if (d.result > 0) {
                    // Positive values: use original color scale
                    const selectedColor = colorScale[clampedIndex];
                    return this.hexToRgbArray(selectedColor);
                } else {
                    // Negative values: use complementary/opposite colors
                    const selectedColor = colorScale[clampedIndex];
                    return this.getComplementaryColor(selectedColor);
                    // return this.getOppositeHueColor(selectedColor);
                }
            },
            pickable: true,
            opacity: 0.4,
        });

        if (options) {
            layer = layer.clone(options);
        }
        return layer;
    }

    // Helper method to get complementary color
    private getComplementaryColor(hex: string): [number, number, number] {
        const rgb = this.hexToRgbArray(hex);
        // Create complementary color by inverting RGB values
        return [
            255 - rgb[0],
            255 - rgb[1],
            255 - rgb[2]
        ];
    }

    // Alternative: Get opposite hue color (more sophisticated)
    private getOppositeHueColor(hex: string): [number, number, number] {
        const rgb = this.hexToRgbArray(hex);
        const hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);

        // Shift hue by 180 degrees for opposite color
        const oppositeHue = (hsl.h + 180) % 360;
        const oppositeRgb = this.hslToRgb(oppositeHue, hsl.s, hsl.l);

        return [oppositeRgb.r, oppositeRgb.g, oppositeRgb.b];
    }

    // Helper methods for HSL conversion
    private rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    private hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
        h /= 360;
        s /= 100;
        l /= 100;

        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // Helper method to convert hex to RGB array for deck.gl
    private hexToRgbArray(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [156, 39, 176]; // fallback to purple if parsing fails
    }
}