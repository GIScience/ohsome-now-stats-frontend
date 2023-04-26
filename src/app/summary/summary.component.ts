import { Component } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent {
  contributors!: string
  edits!: string
  buidlingEdits!: string
  kmOfRoads!: string

  constructor(private dataService: DataService) {
    const { contributors, edits, buildingEdits, kmOfRoads } = this.dataService.getSummary();

    this.contributors = new Intl.NumberFormat('en-US').format(contributors)
    this.buidlingEdits = new Intl.NumberFormat('en-US').format(buildingEdits)
    this.edits = new Intl.NumberFormat('en-US').format(edits)
    this.kmOfRoads = new Intl.NumberFormat('en-US').format(kmOfRoads)

  }
}
