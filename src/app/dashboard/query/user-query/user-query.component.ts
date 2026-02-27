import {Component} from '@angular/core';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AutoComplete, AutoCompleteCompleteEvent} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";
import {IHighlightedOsmUser} from "../../../../lib/types";

@Component({
    selector: 'user-query',
    templateUrl: './user-query.component.html',
    styleUrls: ['./user-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    providers: []
})
export class UserQueryComponent extends QueryComponent {
    filteredOsmUsers: IHighlightedOsmUser[] = [];
    selectedOsmUser: IHighlightedOsmUser = {
        id: this.state().osm_user.id,
        name: this.state().osm_user.name,
    };

    constructor() {
        super();
        this.updateSelectionFromState(this.state());
        this.prepareSelectionForStateChange()
    }

    prepareSelectionForStateChange() {
        this.osm_user.set({
            id: this.selectedOsmUser!.id,
            name: this.selectedOsmUser!.name,
        })
        this.updateStateFromSelection();
    }

    searchOsmUsers(event: AutoCompleteCompleteEvent) {
        const query = event.query?.trim();
        if (!query) {
            this.filteredOsmUsers = [];
            return;
        }
        this.dataService.getOsmUserIdFromName(query)
            .subscribe(users => {
                const lowerQuery = query.toLowerCase();
                this.filteredOsmUsers = users
                    .slice(0, 100)
                    .map(user => ({
                        id: user.id,
                        name: this.stringifyStringArray(user.names),
                        highlighted: this.highlightMatch(this.stringifyStringArray(user.names), lowerQuery)
                    }));
            });
    }

    private highlightMatch(text: string, query: string): string {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<b>$1</b>');
    }

    private stringifyStringArray(arr: string[]): string {
        return arr.map(str => {
                const json = JSON.stringify(str);
                return json.substring(1, json.length - 1);
            })
            .join(", ");
    }
}