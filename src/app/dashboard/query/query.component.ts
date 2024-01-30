import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import dayjs from 'dayjs/esm';
import {Dayjs} from "dayjs";
import {NgxDropdownConfig} from 'ngx-select-dropdown';

import dropdownOptions from "../../../assets/static/json/countryCodes.json"
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {DataService} from '../../data.service';
import {ToastService} from 'src/app/toast.service';
import {IHashtags, IQueryData} from "../types";
import { UTCToLocalConverterPipe } from './pipes/utc-to-local-converter.pipe';


@Component({
    selector: 'app-query',
    templateUrl: './query.component.html',
    styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnChanges, OnInit {

    @Input() data: IQueryData | undefined
    metaSub!: Subscription
    hashtags = ''

    intervals: Array<{
        label: string;
        value: string;
    }> | undefined
    interval: string | undefined // default value as 'P1M'
    selectedDateRange: { end: any; start: any; } | undefined;
    ranges: any
    minDate!: Dayjs
    maxDate!: Dayjs

    private _start = ''
    private _end = ''
    currentTimeInUTC!: string;

    countries: string[] = [];  // only codes for url and get request
    dropdownOptions = dropdownOptions;  // all possible countries with name and code
    selectedCountries: countryDataClass[] = []  // selected countries with name and code

    topics: string[] = [];  // only codes for url and get request
    topicOptions: any[] = []
    selectedTopics: topicDataClass[] = []  // selected countries with name and code

    hot_controls: boolean = false;

    allHashtagOptions: IHashtags[] = []

    keyword: string = "hashtag"

    constructor(
        private dataService: DataService,
        private router: Router,
        private utcToLocalConverter: UTCToLocalConverterPipe,
        private toastService: ToastService) {

        this.buildTopicOptions()

        this.intervals = dataService.timeIntervals
        this.interval = dataService.defaultIntervalValue

        setInterval(() => {
            this.currentTimeInUTC = this.utcToLocalConverter.transform(new Date())
        }, 1000)
    }

    ngOnInit(): void {
        this.dataService.requestAllHashtags().subscribe((hashtagsResult)=>{
            // @ts-ignore
            this.allHashtagOptions = hashtagsResult["result"]
        })
    }

    ngOnChanges(): void {

        // listener to metaData request,
        // theoritically should be called only once as metaData request
        // is fired only at the start of application
        // but it is called twice since first time it is due to its assignment to null
        if (this.metaSub)
            this.metaSub.unsubscribe()

        this.metaSub = this.dataService.getMetaData().subscribe(metaData => {
            if (metaData && metaData.start && metaData.end) {
                this.minDate = dayjs(metaData?.start)
                this.maxDate = dayjs(metaData?.end)
                this.ranges = {
                    'Today': [dayjs().startOf('day'), dayjs()],
                    'Yesterday': [dayjs().subtract(1, 'days').startOf('day'), dayjs().subtract(1, 'days').endOf('day')],
                    'Last 7 Days': [dayjs().subtract(6, 'days').startOf('day'), dayjs().endOf('day')],
                    'Last 30 Days': [dayjs().subtract(29, 'days').startOf('day'), dayjs().endOf('day')],
                    'Last Year': [dayjs().subtract(1, 'year').startOf('day'), dayjs().endOf('day')],
                    'Entire Duration': [dayjs(this.minDate), dayjs(this.maxDate)]
                }
            }
        })


        if (this.data) {
            this.initFormValues(this.data)
        }
    }

    // start date
    get start(): string {
        return this._start
    }

    /**
     *
     * @param val An ISO8601 UTC Date/Time String eg. 2010-03 or 2010-03-15 or 2010-03-15T14:20:00Z
     */
    set start(val: string) {
        this._start = val
    }

    // end date
    get end(): string {
        return this._end
    }

    /**
     *
     * @param val An ISO8601 UTC Date/Time String eg. 2010-03 or 2010-03-15 or 2010-03-15T14:20:00Z
     */
    set end(val: string) {
        this._end = val
    }

    /**
     * Build selectable topics based on the topicDefinition.json
     *
     */
    buildTopicOptions() {
        for (const [key, value] of Object.entries(topicDefinitions)) {
            const value_ = value
            if (["roads", "buildings", "edits", "users"].includes(key)) {
                continue
            }

            this.topicOptions.push({
                "name": value_["dropdown_name"],
                "value": key
            })
        }

    }

    /**
     * Initializes form values which are passes from parent component
     *
     * @param data
     */
    initFormValues(data: IQueryData) {
        // console.log('>>> initFormValues >>> data ', data)
        if (data && Object.keys(data).length !== 0) {
            if (!(data.start && data.end)) {
                console.log('date range is null')
            }
            // set Start and end dates
            if (data.start && data.end)
                this.selectedDateRange = {
                    start: dayjs(data.start),
                    end: dayjs(data.end)
                }

            // set hashtags textarea
            this.hashtags = data.hashtags.toString()

            // set interval
            this.interval = data.interval

            //set countries
            this.countries = data.countries.split(",")
            this.selectedCountries = this.dropdownOptions.filter((option: countryDataClass) => {
                return this.countries.includes(option.value)
            })
            this.topics = data.topics.split(",")
            this.selectedTopics = this.topicOptions.filter((option: topicDataClass) => {
                return this.topics.includes(option.value)
            })
        }
    }

    /**
     * Called on Submit button click on the form
     */
    getStatistics() {

        if (!this.validateForm())
            return

        this.dataService.requestMetadata()

        // get all values from form
        if (!this.selectedDateRange)
            return

        const tempEnd = (this.selectedDateRange.end).toISOString()
        const tempStart = (this.selectedDateRange.start).toISOString()

        const tempHashTags = this.cleanHashTags(this.hashtags)

        if (this.selectedCountries.length === this.dropdownOptions.length) {
            this.countries = [""]
        } else {
            this.countries = this.selectedCountries.map(e => e.value)
        }

        this.topics = this.selectedTopics.map(e => e.value)

        // update the url fragment
        this.router.navigate([], {
            fragment: `hashtags=${tempHashTags}&start=${tempStart}&end=${tempEnd}&interval=${this.interval}&countries=${this.countries}&topics=${this.topics}`,
        })
    }

    /**
     * Validates the form values before its being fired to API
     */
    validateForm(): boolean {
        if (this.hashtags === '') {
            console.error('Hashtag is empty')
            // show the message on toast
            this.toastService.show({
                title: 'Hashtag is empty',
                body: 'Please provide a Hashtag',
                type: 'error',
                time: 3000
            })

            const hashtagsEle = document.getElementById('hashtags')
            if (hashtagsEle) {
                hashtagsEle.focus()
            }
            return false
        }

        const dateRangeEle = document.getElementById('dateRange')

        // check if text feild is empty
        if (!(dateRangeEle as HTMLInputElement).value) {
            console.error('Date range is empty')
            // show the message on toast
            this.toastService.show({
                title: 'Date range is empty',
                body: 'Please provide a valid Date range',
                type: 'error',
                time: 3000
            })

            return false
        }

        // check for actual values
        if (!this.selectedDateRange)
            return false
        if (!(this.selectedDateRange.start && this.selectedDateRange.end)) {
            console.error('Date range is empty')
            // show the message on toast
            this.toastService.show({
                title: 'Date range is empty',
                body: 'Please provide a valid Date range',
                type: 'error',
                time: 3000
            })

            return false
        }

        return true
    }

    /**
     * Cleans the hashtags field values
     *
     * @param hashtags
     * @returns string comma seperated hashtags without the symbol hashtag
     */
    cleanHashTags(hashtags: string): string {
        const cleanedHashtags = hashtags
            .trim() // Remove leading/trailing whitespace
            .split(',') // Split by commas
            .map(h => h.trim()) // Trim each hashtag
            .filter(h => h !== '') // Filter out empty hashtags
            .map(h => h.replace(/^#/, '')) // Remove '#' symbol from each hashtag if it's at the beginning
            .map(h => encodeURIComponent(h)); // escape everyting but A–Z a–z 0–9 - _ . ! ~ * ' ( )
        return cleanedHashtags.join(',');
    }

    hubs: any = {
        "asia-pacific": "AFG,BGD,BTN,BRN,KHM,TLS,FSM,FJI,IND,IDN,KIR,LAO,MYS,MMR,NPL,PAK,PNG,PHL,SLB,LKA,TON,UZB,VUT,VNM,YEM",
        "la-carribean": "ATG,BLZ,BOL,BRA,CHL,CRI,DMA,DOM,ECU,SLV,GTM,GUY,HTI,HND,JAM,MEX,NIC,PAN,PER,TTO,URY,VEN",
        "wna": "DZA,BEN,BFA,CMR,CPV,CAF,TCD,CIV,GNQ,GHA,GIN,GNB,LBR,MLI,MRT,MAR,NER,NGA,STP,SEN,SLE,GMB,TGO",
        "esa": "AGO,BDI,COM,COD,DJI,EGY,SWZ,ETH,KEN,LSO,MDG,MWI,MUS,MOZ,NAM,RWA,SOM,SSD,SDN,TZA,UGA,ZMB,ZWE"
    }

    changeHub(hubName: string) {
        this.selectedCountries = this.dropdownOptions.filter((option: countryDataClass) => {
            return this.hubs[hubName].includes(option.value)
        })

    }
    impactAreas: any = {
        "disaster": "wash,waterway,social_facility,place,lulc",
        "sus_cities": "wash,waterway,social_facility,lulc,amenity,education,commercial,financial",
        "pub_health": "wash,waterway,social_facility,place,healthcare",
        "migration": "waterway,social_facility,lulc,amenity,education,commercial,healthcare",
        "g_equality": "wash,social_facility,education"
    }
     changeImpactArea(impactAreaName: string) {
        this.selectedTopics = this.topicOptions.filter((option) => {
            return this.impactAreas[impactAreaName].includes(option.value)
        })
    }

    searchChange(items: IHashtags[], searchedHashtag: string){
        if (searchedHashtag.length<1){
            return []
        }
        return items.filter((hashtagResult)=>{
            return hashtagResult.hashtag.length > 1 && hashtagResult.hashtag.includes(searchedHashtag)
        })
        .sort(
            (a: IHashtags, b: IHashtags)=>{
                if (a.hashtag.startsWith(searchedHashtag) && b.hashtag.startsWith(searchedHashtag)){
                    return a.count <= b.count ? 1 : -1
                }
                else if (a.hashtag.startsWith(searchedHashtag)){
                    return -1
                }
                else if (b.hashtag.startsWith(searchedHashtag)){
                    return 1
                }
                else {
                    return a.count <= b.count ? 1 : -1
                }
            }
        ).slice(0,1000).map((e)=>e.hashtag)
    }


    configCountry: NgxDropdownConfig = {
        displayKey: 'name',
        search: true,
        height: '20rem',
        placeholder: 'Optionally filter by Country',
        limitTo: 0,
        moreText: 'item',
        noResultsFound: 'No results found',
        searchPlaceholder: 'Search',
        searchOnKey: 'name',
        customComparator: customComparator,
        clearOnSelection: true,
        inputDirection: "up",
        enableSelectAll: true
    };

    configTopics: NgxDropdownConfig = {
        displayKey: 'name',
        search: true,
        height: '20rem',
        placeholder: 'Optionally add some Topics',
        limitTo: 0,
        moreText: 'item',
        noResultsFound: 'No results found',
        searchPlaceholder: 'Search',
        searchOnKey: 'name',
        customComparator: customComparator,
        clearOnSelection: true,
        inputDirection: "up",
        enableSelectAll: true
    };

    allowedInterval(value: string) {
        if (!this.selectedDateRange)
            return true
        if (this.selectedDateRange.start && this.selectedDateRange.end) {
            const diff = (this.selectedDateRange.end).diff(this.selectedDateRange.start, 'day')
            return (diff > 366 && value === 'PT1H');
        }
        return false
    }
}

function customComparator(a: any, b: any) {
    return a.name.localeCompare(b.name)
}

class countryDataClass {
    name: string;
    value: string;

    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
    }
}

class topicDataClass {
    name: string;
    value: string;

    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
    }
}
