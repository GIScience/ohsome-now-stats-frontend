import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    effect,
    ElementRef,
    HostListener,
    model,
    OnDestroy,
    viewChild
} from '@angular/core';
import * as bootstrap from "bootstrap";

@Component({
    selector: 'app-map-maximize-button',
    templateUrl: './map-maximize-button.component.html',
    styleUrl: './map-maximize-button.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager
})
export class MapMaximizeButtonComponent implements AfterViewInit, OnDestroy {
    maximized = model(false);

    private button = viewChild.required<ElementRef<HTMLButtonElement>>('button');
    private tooltip?: bootstrap.Tooltip;

    constructor() {
        effect(() => {
            this.tooltip?.setContent({'.tooltip-inner': this.tooltipTitle()});
        });
    }

    tooltipTitle() {
        return this.maximized() ? 'Exit maximized view (Esc)' : 'Maximize map';
    }

    @HostListener('document:keydown.escape')
    onEscapeKey() {
        if (this.maximized()) {
            this.toggle();
        }
    }

    toggle() {
        this.tooltip?.hide();
        this.maximized.update(v => !v);
    }

    ngAfterViewInit() {
        this.tooltip = new bootstrap.Tooltip(this.button().nativeElement, {
            trigger: 'hover',
            placement: 'right',
            title: this.tooltipTitle()
        });
    }

    ngOnDestroy() {
        this.tooltip?.dispose();
    }
}
