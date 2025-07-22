import {AfterViewInit, Component, computed, effect, ElementRef, Input, QueryList, ViewChildren} from '@angular/core';
import {ITopicDefinitionValue} from "../../types";
import {StateService} from "../../../state.service";
import {Router} from "@angular/router";
import * as bootstrap from 'bootstrap';

@Component({
    selector: 'app-big-number',
    templateUrl: './big-number.component.html',
    styleUrls: ['./big-number.component.scss'],
    standalone: false
})
export class BigNumberComponent implements AfterViewInit {
    @Input() data!: ITopicDefinitionValue
    @ViewChildren('tooltip') tooltips!: QueryList<ElementRef>;
    isSelected = false;
    alternativeSelectedLayout = false;

    constructor(private stateService: StateService, private router: Router) {
        effect(() => {
            this.isSelected = this.data.id === this.activeTopicState();
            this.alternativeSelectedLayout = <boolean>(this.isSelected && this.data.added !== undefined);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.enableTooltips(), 100)
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


    openHelp() {
        this.router.navigate([`help`], {fragment: this.data.id, queryParams: this.stateService.appState()});
    }

    enableTooltips() {
        this.tooltips.forEach(
            (tooltip) => {
                const bootsTip = new bootstrap.Tooltip(tooltip.nativeElement, {trigger: 'hover'})
                tooltip.nativeElement.addEventListener('click', () => {
                    bootsTip.hide()
                })
            }
        )
    }
}