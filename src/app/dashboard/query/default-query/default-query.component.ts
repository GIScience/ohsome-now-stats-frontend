import {Component, ChangeDetectionStrategy} from '@angular/core';
import {QueryComponent} from "../query.component";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NzAutocompleteModule} from 'ng-zorro-antd/auto-complete';
import {NzInputModule} from 'ng-zorro-antd/input';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerComponent, NzDatePickerModule} from "ng-zorro-antd/date-picker";


@Component({
    selector: 'default-query',
    templateUrl: './default-query.component.html',
    styleUrls: ['./default-query.component.scss'],
    imports: [FormsModule, NzAutocompleteModule, NzInputModule, SelectDropDownModule, UTCToLocalConverterPipe, ReactiveFormsModule, NzDatePickerComponent, NzDatePickerModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: []
})
export class DefaultQueryComponent extends QueryComponent {
    constructor() {
        super();
        this.updateSelectionFromState(this.state());
        this.updateStateFromSelection()
    }
}