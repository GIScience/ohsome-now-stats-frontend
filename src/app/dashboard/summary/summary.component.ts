import {Component, EventEmitter, Input, OnChanges, Output, ViewContainerRef, EnvironmentInjector, createComponent, ApplicationRef} from '@angular/core';
import * as bootstrap from 'bootstrap';
import {UnaryFunction, fromEvent} from "rxjs"
import { ISummaryData, ITopicData } from '../../data.service';
import { dashboard } from '../tooltip-data';
import { StatsType } from '../types';
import { BigNumberComponent } from './big-number/big-number.component';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"


@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnChanges {
  @Input() data: ISummaryData | undefined;
  @Input() topicData: ITopicData | undefined;
  @Input() selectedTopics: String | undefined;
  @Output() changeCurrentStatsEvent = new EventEmitter<StatsType>();
  
  topicComponentReferences: any = {}

  contributors!: string
  edits!: string
  buidlingEdits!: string
  kmOfRoads!: string
  dashboardTooltips: any;

  constructor(private injector: EnvironmentInjector, private appRef: ApplicationRef) { 
    this.dashboardTooltips = dashboard
    this.enableTooltips()
  }


  ngOnChanges(): void {
      if(! this.data)
        return

      // console.log('>>> SummaryComponent >>> data = ', this.data);
      this.contributors = new Intl.NumberFormat('en-US').format(this.data.users)
      this.buidlingEdits = new Intl.NumberFormat('en-US').format(this.data.buildings)
      this.edits = new Intl.NumberFormat('en-US').format(this.data.edits)
      this.kmOfRoads = new Intl.NumberFormat('en-US', {
          style: "unit",
          unit: "kilometer",
          maximumFractionDigits: 0
         }
        ).format(this.data.roads)
      
    
      if (this.selectedTopics!=""&&this.topicData){
        if (!this.topicComponentReferences["place"]){
          this.addBigNumber("place", topicDefinitions["place"], this.topicData.value)
        }
        
      }
      else {
        if (this.topicComponentReferences["place"]){
          this.topicComponentReferences["place"].destroy()
          delete this.topicComponentReferences["place"]
        }
      }
  }

  addBigNumber(topic: string, topic_definition: any, value: number){
    let targetDiv = document.getElementById("big-number_container")
    let newChild = targetDiv!.appendChild(document.createElement("div"))
    const componentRef = createComponent(
      BigNumberComponent, {
        hostElement: newChild!!,
        environmentInjector: this.injector,
        
      }
    )
    this.appRef.attachView(componentRef.hostView);
    componentRef.setInput("color", topic_definition["color"])
    componentRef.setInput("icon", topic_definition["icon"])
    componentRef.setInput("name", topic_definition["name"])
    componentRef.setInput("tooltip", topic_definition["tooltip"])
    componentRef.setInput("value", value)
    componentRef.location.nativeElement.classList.add("col-md-3")
    componentRef.location.nativeElement.style = "flex: 1 1 200px;" // for some reason scss is not applied to dynamically created component

    fromEvent(componentRef.location.nativeElement, 'click')
      .subscribe((event: any) => this.changeSelectedSummaryComponent(event));
    this.topicComponentReferences[topic] = componentRef

  }

  changeSelectedSummaryComponent(e: any){
    const newSelected = e.target.closest(".layers")
    const siblings = [...newSelected.parentNode.parentNode.parentNode.children];
    siblings.forEach((e)=>e.children[0].children[0].classList.remove("selected"))
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
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    // console.log('tooltipTriggerList =', tooltipTriggerList)
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, { trigger: 'hover' }))
  }
}
