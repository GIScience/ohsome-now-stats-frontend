import {AfterContentInit, Component, Input} from "@angular/core";
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