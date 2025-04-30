import { ViewportScroller } from '@angular/common';
import { AfterViewChecked, Component} from '@angular/core';
import {dashboard} from 'src/app/dashboard/tooltip-data'
import topicDefinitions from "../../assets/static/json/topicDefinitions.json"

@Component({
    selector: 'app-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss'],
    standalone: false
})
export class HelpComponent implements AfterViewChecked{
    topicDefinitions = topicDefinitions
    protected readonly dashboard = dashboard;
    hash: string
    constructor(private scroller: ViewportScroller){
        this.hash = window.location.hash
    }
    returnZero(){
        return 0
    }
    ngAfterViewChecked() {
        if(window.location.hash != ""){
            this.scroller.scrollToAnchor(this.hash.split("#")[1])
        }
    }

}
