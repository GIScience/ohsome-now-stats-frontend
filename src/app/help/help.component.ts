import { ViewportScroller, KeyValuePipe } from '@angular/common';
import {AfterViewInit, Component} from '@angular/core';
import {dashboard} from 'src/app/dashboard/tooltip-data'
import topicDefinitions from "../../assets/static/json/topicDefinitions.json"

@Component({
    selector: 'app-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss'],
    imports: [KeyValuePipe]
})
export class HelpComponent implements AfterViewInit {
    topicDefinitions = topicDefinitions
    protected readonly dashboard = dashboard;
    hash: string

    constructor(private scroller: ViewportScroller) {
        this.hash = window.location.hash
    }

    returnZero() {
        return 0
    }

    ngAfterViewInit() {
        if (window.location.hash != "") {
            setTimeout(() => this.scroller.scrollToAnchor(this.hash.split("#")[1]), 200)
        }
    }

}
