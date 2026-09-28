import {Component, computed, signal, WritableSignal, ChangeDetectionStrategy} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NzAutocompleteModule} from 'ng-zorro-antd/auto-complete';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";
import {IHighlightedOsmUser} from "../../../../lib/types";
import {debounceTime, forkJoin, Subject} from "rxjs";

@Component({
    selector: 'user-query',
    templateUrl: './user-query.component.html',
    styleUrls: ['./user-query.component.scss'],
    imports: [FormsModule, NzAutocompleteModule, NzInputModule, NzSelectModule, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: []
})
export class UserQueryComponent extends QueryComponent {
    filteredOsmUsers: WritableSignal<IHighlightedOsmUser[]> = signal([]);
    selectedOsmUsers: WritableSignal<IHighlightedOsmUser[]> = signal([]);
    userSearch$ = new Subject<string>();

    // keep selected users in the option list so their tags stay visible between searches
    userOptions = computed(() => {
        const selected = this.selectedOsmUsers();
        const selectedIds = new Set(selected.map(u => u.id));
        return [...selected, ...this.filteredOsmUsers().filter(u => !selectedIds.has(u.id))];
    });

    compareUsers = (a?: IHighlightedOsmUser, b?: IHighlightedOsmUser) => a?.id === b?.id;

    constructor() {
        super();
        this.userSearch$
            .pipe(debounceTime(350), takeUntilDestroyed())
            .subscribe(query => this.searchOsmUsers(query));

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

    searchOsmUsers(searchText: string) {
        const query = searchText?.trim();
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