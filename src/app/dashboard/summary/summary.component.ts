import { Component, Input, OnInit } from '@angular/core';
import * as bootstrap from 'bootstrap';

import { DataService, ISummaryData } from '../../data.service';
import { dashboard } from '../tooltip-data';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() data: any;

  contributors!: string
  edits!: string
  buidlingEdits!: string
  kmOfRoads!: string
  dashboardTooltips: any;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getSummary().subscribe( (data: ISummaryData | null) => {

      if(data === null)
        return

      // console.log('>>> SummaryComponent >>> data = ', data);  
      this.contributors = new Intl.NumberFormat('en-US').format(data.contributors)
      this.buidlingEdits = new Intl.NumberFormat('en-US').format(data.buildingEdits)
      this.edits = new Intl.NumberFormat('en-US').format(data.edits)
      this.kmOfRoads = new Intl.NumberFormat('en-US', { 
          style: "unit",
          unit: "kilometer", 
          maximumFractionDigits: 0
         }
        ).format(data.kmOfRoads)

    });

    this.dashboardTooltips = dashboard
    this.enableTooltips()
  }

  /**
   * Boostrap need to enable tooltip on every element with its attribute
   */
  enableTooltips(): void {
    // enble tooltip
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    // console.log('tooltipTriggerList =', tooltipTriggerList)
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, { trigger: 'hover' }))
  }
}
