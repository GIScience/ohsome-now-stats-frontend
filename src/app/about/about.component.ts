import {Component, ChangeDetectionStrategy} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {environment} from "@environments/environment";

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgOptimizedImage]
})
export class AboutComponent {

    protected readonly environment = environment;
}
