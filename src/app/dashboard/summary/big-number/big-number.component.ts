import {Component, Input} from '@angular/core';
import {ITopicDefinitionValue} from "../../types";

@Component({
    selector: 'app-big-number',
    templateUrl: './big-number.component.html',
    styleUrls: ['./big-number.component.scss'],
    standalone: false
})
export class BigNumberComponent {
    @Input() data!: ITopicDefinitionValue
    @Input() startSelected!: boolean

    formatNumbertoNumberformatString(value: number): string {
        return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0
            }
        ).format(value)
    }

    openHelp(event: any) {
        window.open(`/help#${event.target.closest(".app-big-number").id}`, '_blank');
    }
}