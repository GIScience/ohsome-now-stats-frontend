import {Component, computed, effect, Input} from '@angular/core';
import {ITopicDefinitionValue} from "../../types";
import {StateService} from "../../../state.service";

@Component({
    selector: 'app-big-number',
    templateUrl: './big-number.component.html',
    styleUrls: ['./big-number.component.scss'],
    standalone: false
})
export class BigNumberComponent {
    @Input() data!: ITopicDefinitionValue
    isSelected = false;
    alternativeSelectedLayout = false;

    constructor(private stateService: StateService) {
        effect(() => {
            this.isSelected = this.data.id === this.activeTopicState();
            this.alternativeSelectedLayout = <boolean>(this.isSelected && this.data.added);
        });
    }

    formatNumbertoNumberformatString(value: number): string {
        return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0
            }
        ).format(value)
    }

    private activeTopicState = computed(() => {
        return this.stateService.appState().active_topic;
    });


    openHelp(event: any) {
        window.open(`/help#${this.data.id}`, '_blank');
    }
}