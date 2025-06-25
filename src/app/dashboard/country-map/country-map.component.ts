import {Component, computed, effect} from '@angular/core';
import {StateService} from 'src/app/state.service';

@Component({
    selector: 'app-country-map',
    imports: [],
    templateUrl: './country-map.component.html',
    styleUrl: './country-map.component.scss'
})
export class CountryMapComponent {


    private relevantState = computed(() => {
        return this.stateService.appState()
    }, {
        // country map changes when one of the following properties change
        equal: (a, b) => {
            return a.hashtag === b.hashtag
                && a.start === b.start
                && a.end === b.end
                && a.active_topic == b.active_topic
        }
    });
    // changing countries should only change style, but not trigger new data request
    private countryState = computed(() => {
        return this.stateService.appState().countries
    })

    activeTopic: string = this.relevantState().active_topic;
    selectedCountries: string = this.countryState();

    constructor(private stateService: StateService) {
        effect(() => {
            this.activeTopic = this.relevantState().active_topic;
            this.updateData();

        });

        effect(() => {
            this.selectedCountries = this.countryState();
            this.updateCountryFilterStyle(this.selectedCountries);
        });
    }

    updateData() {
        console.log("updateData")
    }

    updateCountryFilterStyle(selectedCountries: string) {
        console.log("updateCountryFilterStyle", selectedCountries);
        (selectedCountries === "")?
            console.log("use no filter style") :
            console.log("use filter style");
    }

}
