import {Component, computed, effect, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {StateService} from 'src/app/state.service';
import {Overlay} from '../../overlay.component';
import {Deck, DeckProps} from '@deck.gl/core';
import {TileLayer, TileLayerProps} from '@deck.gl/geo-layers';
import {BitmapLayer, BitmapLayerProps} from '@deck.gl/layers';
import {DataService} from '../../data.service';
import {ICountryData, IWrappedCountryResult, StatsType} from '../types';
import {SubLayersProps} from '@deck.gl/layers/dist/geojson-layer/geojson-layer-props';
import {Tile2DHeader, TileBoundingBox, TileLoadProps} from '@deck.gl/geo-layers/dist/tileset-2d';

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
    deck!: Deck;

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

        const handleResponse = (response: IWrappedCountryResult) => {
            const countryData: ICountryData[] = response.result.topics[this.activeTopic];
            console.log(countryData[0]);
        }

        this.isLoading = true;
        this.dataService.requestCountryStats(reqParams).subscribe({
            next: handleResponse,
            error: (err) => {
                console.log(err);
                this.isLoading = false;
            },
            complete: () => {
                this.isLoading = false;
            }
        })


    }

    updateCountryFilterStyle(selectedCountries: string) {
        console.log("updateCountryFilterStyle", selectedCountries);
        (selectedCountries === "") ?
            console.log("use no filter style") :
            console.log("use filter style");
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
            opacity: 0.7,
            pickable: false
        });


        this.deck = new Deck({
            parent: this.deckContainer.nativeElement,
            initialViewState: {
                latitude: 49.6112768,
                longitude: 6.129799,
                zoom: 1,
            },
            controller: true,
            layers: [osmLayer],
        } as DeckProps);
    };


}
