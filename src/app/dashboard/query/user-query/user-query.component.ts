import {Component, signal, WritableSignal} from '@angular/core';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AutoComplete, AutoCompleteCompleteEvent} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";
import {IHighlightedOsmUser} from "../../../../lib/types";
import {forkJoin} from "rxjs";

@Component({
    selector: 'user-query',
    templateUrl: './user-query.component.html',
    styleUrls: ['./user-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    providers: []
})
export class UserQueryComponent extends QueryComponent {
    filteredOsmUsers: WritableSignal<IHighlightedOsmUser[]> = signal([]);
    selectedOsmUsers: WritableSignal<IHighlightedOsmUser[]> = signal([]);

    constructor() {
        super();
        const ids = (this.state().osm_user_id || '')
            .split(',')
            .map(id => id.trim())
            .filter(id => id);

        if (ids.length > 0) {
            forkJoin(ids.map(id => this.dataService.getOsmUserNameFromId(id)))
                .subscribe(results => {
                    const users = results.flatMap(userInfos =>
                        userInfos.map(info => ({
                            id: info.id,
                            name: info.names.map((n: any) => n.name).join(', '),
                        }))
                    );

                    this.osm_user.set({
                        id: users.map(u => u.id).join(','),
                        name: users.map(u => u.name).join(', '),
                    });

                    this.selectedOsmUsers.set(users);
                    this.updateSelectionFromState(this.state());
                    this.prepareSelectionForStateChange();
                });
        }
    }

    prepareSelectionForStateChange() {
        const selected = this.selectedOsmUsers();
        if (selected.length === 0) {
            this.toastService.show({
                title: 'No user selected',
                body: 'Please select at least one OSM user.',
                type: 'error',
                time: 5000,
            });
            return;
        }
        this.osm_user.set({
            id: selected.map(u => u.id).join(','),
            name: selected.map(u => u.name).join(', '),
        });
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