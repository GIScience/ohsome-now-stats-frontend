import { Component } from '@angular/core';
import { DataService } from '../data.service';

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

  constructor(private dataService: DataService) {
    // ({ this.contributors, this.edits, this.buidlingEdits, this.kmOfRoads } = this.dataService.getSummary())
    const summary = this.dataService.getSummary();
    const { contributors, edits, buildingEdits, kmOfRoads } = this.dataService.getSummary();
    this.contributors = contributors
    this.buidlingEdits = buildingEdits
    this.edits = edits
    this.kmOfRoads = kmOfRoads
    
  }
}
