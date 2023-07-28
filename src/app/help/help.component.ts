import { Component } from '@angular/core';
import {dashboard} from 'src/app/dashboard/tooltip-data'

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {

    protected readonly dashboard = dashboard;
}
