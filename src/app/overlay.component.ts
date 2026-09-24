import {AfterContentInit, Component, Input, ChangeDetectionStrategy} from "@angular/core";
import {NgClass} from '@angular/common';

@Component({
    selector: 'overlay',
    template: `
        <div [ngClass]="isLoading ? 'opened' : 'closed'">
            <div class="custom-modal">
                <div class="lds-dual-ring"></div>
            </div>
        </div>
    `,
    imports: [
        NgClass
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./overlay.component.scss']
})
export class Overlay implements AfterContentInit {
    @Input() isLoading: boolean = false;
    @Input() containerElement: HTMLElement | undefined;

    constructor() { }


    ngAfterContentInit() {
        // @ts-ignore
        this.containerElement.style.position = 'relative';
    }
}