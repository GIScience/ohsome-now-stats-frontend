import {Component, signal, WritableSignal} from '@angular/core';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AutoComplete, AutoCompleteCompleteEvent} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";
import {IHighlightedOsmUser} from "../../../../lib/types";
import {stringifyNamesFromResponse} from "../../../../lib/utils";

@Component({
    selector: 'user-query',
    templateUrl: './user-query.component.html',
    styleUrls: ['./user-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    providers: []
})
export class UserQueryComponent extends QueryComponent {
    filteredOsmUsers: WritableSignal<IHighlightedOsmUser[]> = signal([]);
    selectedOsmUser: WritableSignal<IHighlightedOsmUser | null> = signal(null);

    constructor() {
        super();
        this.dataService.getOsmUserNameFromId(this.state().osm_user_id).subscribe(userInfo => {
            const osm_usernames = stringifyNamesFromResponse(userInfo);
            this.osm_user.set({
                id: this.state().osm_user_id,
                name: osm_usernames,
            });

            this.selectedOsmUser.set({
                id: this.osm_user()!.id,
                name: osm_usernames,
            });

            this.updateSelectionFromState(this.state());
            this.prepareSelectionForStateChange()
        })
    }

    prepareSelectionForStateChange() {
        this.osm_user.set({
            id: this.selectedOsmUser()!.id,
            name: this.selectedOsmUser()!.name,
        })
        this.updateStateFromSelection();
    }

    searchOsmUsers(event: AutoCompleteCompleteEvent) {
        const query = event.query?.trim();
        if (!query) {
            this.filteredOsmUsers.set([]);
            return;
        }
        this.dataService.getOsmUserIdFromName(query)
            .subscribe(users => {
                const lowerQuery = query.toLowerCase();
                this.filteredOsmUsers.set(users
                    .slice(0, 100)
                    .map(user => {
                        let names = user.names.join(", ")
                        return {
                            id: user.id,
                            name: names,
                            highlighted: this.highlightMatch(names, lowerQuery)
                        }
                    })
                );
            });
    }

    private highlightMatch(text: string, query: string): string {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<b>$1</b>');
    }
}