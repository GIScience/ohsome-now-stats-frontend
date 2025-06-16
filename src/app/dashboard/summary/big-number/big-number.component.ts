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
    startSelected = false;

    constructor(private stateService: StateService) {
        effect(() => {
            this.startSelected = this.data.id === this.activeTopicState();
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
        window.open(`/help#${event.target.closest(".app-big-number").id}`, '_blank');
    }
}