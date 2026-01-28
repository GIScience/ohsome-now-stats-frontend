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
    userName: string = "";

    constructor() {
        super();
        this.updateSelectionFromState(this.state());
        this.updateStateFromSelection()
    }


    // todo: logic for setting username as well
    //  query as a parent should probably not be aware of username
    //  so if we can manage all that here it would be great

}