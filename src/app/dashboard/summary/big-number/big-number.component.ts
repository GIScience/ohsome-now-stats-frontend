import {Component, computed, effect, Input, OnChanges, OnInit} from '@angular/core';
import {StateService} from "../../../state.service";

@Component({
    selector: 'app-big-number',
    templateUrl: './big-number.component.html',
    styleUrls: ['./big-number.component.scss'],
    standalone: false
})
export class BigNumberComponent implements OnInit, OnChanges {
    @Input() name: string | undefined;
    @Input() value: string | undefined;
    @Input() tooltip: string | undefined;
    @Input() icon: string | undefined;
    @Input() color: string | undefined;
    @Input() colorLight: string | undefined;
    @Input() id: string | undefined;
    numericValue: number = 0

    private activeTopicState = computed(() => {
        return this.stateService.appState().active_topic;
    });
    startSelected: boolean = false;

    constructor(private stateService: StateService) {
        effect(() => {
            this.startSelected = this.id === this.activeTopicState();
        });
    }

    ngOnInit() {
        this.numericValue = parseFloat(this.value!)
    }

    ngOnChanges() {
        this.numericValue = parseFloat(this.value!)
    }

    openHelp(event: any) {
        window.open(`/help#${event.target.closest(".app-big-number").id}`, '_blank');
    }
}