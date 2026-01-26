import {Component} from '@angular/core';
import {QueryComponent} from "../query.component";
import {ISelectionItem} from "../../types";
import {FormsModule} from '@angular/forms';
import {AutoComplete} from 'primeng/autocomplete';
import {PrimeTemplate} from 'primeng/api';
import {SelectDropDownModule} from 'ngx-select-dropdown';
import {NgClass} from '@angular/common';
import {UTCToLocalConverterPipe} from '../pipes/utc-to-local-converter.pipe';
import {NzDatePickerModule, NzRangePickerComponent} from "ng-zorro-antd/date-picker";


@Component({
    selector: 'hot-query',
    templateUrl: './hot-query.component.html',
    styleUrls: ['./hot-query.component.scss'],
    imports: [FormsModule, AutoComplete, PrimeTemplate, SelectDropDownModule, NgClass, UTCToLocalConverterPipe, NzRangePickerComponent, NzDatePickerModule]
})
export class HotQueryComponent extends QueryComponent {
    hubs: { [hubName: string]: string } = {
        "asia-pacific": "AFG,BGD,BTN,BRN,KHM,TLS,FSM,FJI,IND,IDN,KIR,LAO,MYS,MMR,NPL,PAK,PNG,PHL,SLB,LKA,TON,UZB,VUT,VNM,YEM",
        "la-carribean": "ATG,BLZ,BOL,BRA,CHL,CRI,DMA,DOM,ECU,SLV,GTM,GUY,HTI,HND,JAM,MEX,NIC,PAN,PER,TTO,URY,VEN",
        "wna": "DZA,BEN,BFA,CMR,CPV,CAF,TCD,CIV,GNQ,GHA,GIN,GNB,LBR,MLI,MRT,MAR,NER,NGA,STP,SEN,SLE,GMB,TGO",
        "esa": "AGO,BDI,COM,COD,DJI,EGY,SWZ,ETH,KEN,LSO,MDG,MWI,MUS,MOZ,NAM,RWA,SOM,SSD,SDN,TZA,UGA,ZMB,ZWE"
    }
    selectedHub: string | undefined

    impactAreas: { [id: string]: string } = {
        "disaster": "wash,waterway,social_facility,place,lulc",
        "sus_cities": "wash,waterway,social_facility,lulc,amenity,education,commercial,financial",
        "pub_health": "wash,waterway,social_facility,place,healthcare",
        "migration": "waterway,social_facility,lulc,amenity,education,commercial,healthcare",
        "g_equality": "wash,social_facility,education"
    }
    selectedImpactArea: string | undefined

    constructor() {
        super()
        this.updateSelectionFromState(this.state());
        this.selectedHashtagOption = {hashtag: "hotosm-project-*", highlighted: ""}
        this.updateStateFromSelection()
    }

    changeHub(hubName: string) {
        this.selectedCountries = this.dropdownOptions.filter((option: ISelectionItem) => {
            return this.hubs[hubName].includes(option.value)
        })
        this.selectedHub = hubName
    }

    changeImpactArea(impactAreaName: string) {
        this.selectedTopics = this.topicOptions.filter((option: ISelectionItem) => {
            return this.impactAreas[impactAreaName].includes(option.value)
        })
        this.selectedImpactArea = impactAreaName
    }

}