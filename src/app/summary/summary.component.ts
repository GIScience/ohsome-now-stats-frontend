import { Component } from '@angular/core';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent {
  contributors!: number
  edits!: number
  buidlingEdits!: number
  kmOfRoads!: number

  constructor(){ }
}
