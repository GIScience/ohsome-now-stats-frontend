import {Component} from '@angular/core';
import {QueryComponent} from "../query.component";


@Component({
    selector: 'default-query',
    templateUrl: './default-query.component.html',
    styleUrls: ['./default-query.component.scss'],
    standalone: false
})
export class DefaultQueryComponent extends QueryComponent {
    constructor() {
        super();
        this.updateSelectionFromState(this.state());
        this.updateStateFromSelection()
    }
}