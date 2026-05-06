import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {environment} from "@environments/environment";

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    imports: [NgOptimizedImage]
})
export class AboutComponent {

    protected readonly environment = environment;
}
