import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as bootstrap from 'bootstrap';

import { DataService, ISummaryData } from '../../data.service';
import { dashboard } from '../tooltip-data';
import {StatsType} from '../types';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() data: any;
  @Output() changeCurrentStatsEvent = new EventEmitter<StatsType>();

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

  changeSelectedSummaryComponent(e: any){
    var newSelected = e.target.closest(".layers")
    var siblings = [...newSelected.parentNode.parentNode.children];
    siblings.forEach((e)=>e.children[0].classList.remove("selected"))
    newSelected.classList.add("selected")
  }

  changeCurrentStats(e: any, newCurrentStats: StatsType){
    this.changeSelectedSummaryComponent(e)
    this.changeCurrentStatsEvent.emit(newCurrentStats); 
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
