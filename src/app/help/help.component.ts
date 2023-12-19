import { Component } from '@angular/core';
import {dashboard} from 'src/app/dashboard/tooltip-data'
import topicDefinitions from "../../assets/static/json/topicDefinitions.json"

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
    topicDefinitions = topicDefinitions
    protected readonly dashboard = dashboard;

    returnZero(){
        return 0
    }
}
