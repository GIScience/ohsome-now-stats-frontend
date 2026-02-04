import {Component} from '@angular/core';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AutoComplete} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";
import dayjs from "dayjs";
import {StatsType} from "../../../../lib/types";


@Component({
    selector: 'user-query',
    templateUrl: './user-query.component.html',
    styleUrls: ['./user-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    providers: []
})
export class UserQueryComponent extends QueryComponent {
    userID: string = "6687852";

    constructor() {
        super();
        this.updateSelectionFromState(this.state());
        this.updateStateWithOSMUser()
    }

    updateStateWithOSMUser() {
        if (!this.validateForm() || !this.selectedDateRange())
            return

        const tempStart = dayjs(this.selectedDateRange()![0]).utc().format()
        const tempEnd = dayjs(this.selectedDateRange()![1]).utc().format()

        const tempHashTag = this.cleanHashTag(this.selectedHashtagOption)

        if (this.selectedCountries().length === this.dropdownOptions.length) {
            this.countries = [""]
        } else {
            this.countries = this.selectedCountries().map(e => e.value)
        }

        this.topics = this.selectedTopics().map(e => e.value)
        const previousState = this.stateService.appState()
        const active_topic = this.topics.includes(previousState.active_topic) ? previousState.active_topic : this.topics[0]

        const state = {
            countries: this.countries.toString(),
            hashtag: tempHashTag,
            start: tempStart,
            end: tempEnd,
            interval: this.interval()!,
            topics: this.topics.toString(),
            active_topic: active_topic as StatsType,
            osm_user_id: this.userID
        };

        // update the state
        this.stateService.updatePartialState(state)
    }
}