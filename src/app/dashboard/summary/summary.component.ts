import {
    ApplicationRef,
    Component,
    createComponent,
    EnvironmentInjector,
    EventEmitter,
    Input,
    OnChanges,
    Output
} from '@angular/core';
import * as bootstrap from 'bootstrap';
import {fromEvent} from "rxjs";
import {ISummaryData, TopicDefinition, TopicDefinitionValue, TopicName, TopicResponse} from '../../data.service';
import {dashboard} from '../tooltip-data';
import {StatsType} from '../types';
import {BigNumberComponent} from './big-number/big-number.component';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"


@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnChanges {
    @Input() data: ISummaryData | undefined;
    @Input() topicData: TopicResponse | undefined;
    @Input() selectedTopics!: TopicName | "";
    @Output() changeCurrentStatsEvent = new EventEmitter<StatsType>();

    topicComponentReferences: any = {}

    contributors!: string
    edits!: string
    buidlingEdits!: string
    kmOfRoads!: string
    dashboardTooltips

    currentlySelected = 'users';

    constructor(private injector: EnvironmentInjector, private appRef: ApplicationRef) {
        this.dashboardTooltips = dashboard
        this.enableTooltips()
    }


    ngOnChanges(): void {
        const topic_definitions: TopicDefinition = topicDefinitions

        if (!["users", "roads", "edits", "buildings"].includes(this.currentlySelected) && !this.selectedTopics!.split(",").includes(this.currentlySelected)) {
            document.getElementById("users")?.click()
        }

        if (!this.data)
            return

        // console.log('>>> SummaryComponent >>> data = ', this.data);
        this.contributors = this.formatNumbertoNumberformatString(this.data.users)
        this.buidlingEdits = this.formatNumbertoNumberformatString(this.data.buildings)
        this.edits = this.formatNumbertoNumberformatString(this.data.edits)
        this.kmOfRoads = this.formatNumbertoNumberformatString(this.data.roads)

        // destroy now unused topics
        for (const topic of Object.keys(this.topicComponentReferences)) {
            if (!this.selectedTopics!.split(',').includes(topic)) {
                this.topicComponentReferences[topic].destroy()
                delete this.topicComponentReferences[topic]
            }
        }

        if (this.selectedTopics && this.topicData) {

            // build or update used topics
            for (const topic of this.selectedTopics.split(',')) {
                const topicName = topic as TopicName
                if (this.topicData[topicName]) {
                    if (Object.keys(this.topicComponentReferences).includes(topic)) {

                        this.adjustBigNumberValue(topic, this.topicData[topicName].value)
                    } else {
                        this.addBigNumber(topic, topic_definitions[topicName], this.topicData[topicName].value)
                    }
                }
            }
        }
    }

    addBigNumber(topic: string, topic_definition: TopicDefinitionValue, value: number) {
        const targetDiv = document.getElementById("big-number_container")
        const newChild = targetDiv?.appendChild(document.createElement("div"))
        const componentRef = createComponent(
            BigNumberComponent, {
                hostElement: newChild!,
                environmentInjector: this.injector,

            }
        )

        this.appRef.attachView(componentRef.hostView);
        componentRef.setInput("color", topic_definition["color"])
        componentRef.setInput("icon", topic_definition["icon"])
        componentRef.setInput("name", topic_definition["name"])
        componentRef.setInput("tooltip", topic_definition["tooltip"])
        componentRef.setInput("value", this.formatNumbertoNumberformatString(value))
        componentRef.location.nativeElement.classList.add("col-md-3")
        componentRef.location.nativeElement.style = "flex: 1 1 25%; min-width: 250px;" // for some reason scss is not applied to dynamically created component

        fromEvent(componentRef.location.nativeElement, 'click')
            .subscribe((event: any) => this.changeCurrentStats(event, topic as StatsType));
        this.topicComponentReferences[topic] = componentRef
    }

    adjustBigNumberValue(topic: string, value: number) {
        this.topicComponentReferences[topic].setInput("value", this.formatNumbertoNumberformatString(value))
    }

    formatNumbertoNumberformatString(value: number) : string {
        return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0
            }
        ).format(value)
    }

    changeSelectedSummaryComponent(e: any) {
        // if nodeName is APP-BIG-NUMBER our actual target is a child - thus not findable with .closest
        const newSelected = e.target.nodeName != "APP-BIG-NUMBER" ? e.target.closest(".big_number") : e.target.children[0].closest(".big_number")
        const siblings = [...newSelected.parentNode.parentNode.children];
        siblings.forEach((e) => e.children[0].children[0].classList.remove("selected"))
        newSelected.children[0].classList.add("selected")
    }

    changeCurrentStats(e: any, newCurrentStats: StatsType) {
        this.currentlySelected = newCurrentStats as string
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
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {trigger: 'hover'}))
    }
}
