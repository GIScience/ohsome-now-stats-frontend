import {Component} from '@angular/core';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AutoComplete} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";

@Component({
    selector: 'user-query',
    templateUrl: './user-query.component.html',
    styleUrls: ['./user-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    providers: []
})
export class UserQueryComponent extends QueryComponent {
    osmUserName: string = this.state().osm_user.name;
    constructor() {
        super();
        this.updateSelectionFromState(this.state());
        this.prepareSelectionForStateChange()
    }

    prepareSelectionForStateChange() {
        if(this.osmUserName === ''){
            this.toastService.show({
                title: 'OSM Username can\'t be blank',
                body: 'Please provide a valid OSM username. Username field can\'t be blank',
                type: 'warning',
                time: 5000
            })
        } else {
            this.dataService.getOsmUserId(this.osmUserName).subscribe(data => {
                this.osm_user.set({
                    id: data[0].id,
                    name: data[0].names[0],
                })
                this.updateStateFromSelection();
            })
        }
    }
}