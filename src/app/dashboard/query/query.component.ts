import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {Subscription} from 'rxjs';
import dayjs from "dayjs";
import {NgxDropdownConfig} from 'ngx-select-dropdown';
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import * as bootstrap from 'bootstrap';

import dropdownOptions from "../../../assets/static/json/countryCodes.json"
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {DataService} from '../../data.service';
import {ToastService} from 'src/app/toast.service';
import {IHashtags, IQueryData} from "../types";
import {UTCToLocalConverterPipe} from './pipes/utc-to-local-converter.pipe';

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)


@Component({
    selector: 'app-query',
    templateUrl: './query.component.html',
    styleUrls: ['./query.component.scss'],
})
export class QueryComponent implements OnChanges, OnInit {

    @Input() data: IQueryData | undefined
    metaSub!: Subscription
    hashtag = ''

    intervals: Array<{
        label: string;
        value: string;
    }> | undefined
    interval: string | undefined // default value as 'P1M'
    selectedDateRangeUTC: { end: dayjs.Dayjs; start: dayjs.Dayjs; } | undefined;
    ranges: any
    minDate!: dayjs.Dayjs
    maxDate!: dayjs.Dayjs
    @Output() maxDateEmitter = new EventEmitter<dayjs.Dayjs>()
    maxDateString!: string


    private _start = ''
    private _end = ''
    currentTimeInUserTimeZone!: string;

    countries: string[] = [];  // only codes for url and get request
    dropdownOptions = dropdownOptions;  // all possible countries with name and code
    selectedCountries: countryDataClass[] = []  // selected countries with name and code

    topics: string[] = [];  // only codes for url and get request
    topicOptions: any[] = []
    selectedTopics: topicDataClass[] = []  // selected countries with name and code

    hot_controls: boolean = false;

    allHashtagOptions: IHashtags[] = []

    filteredHashtagOptions: string[] = []

    liveMode: boolean = false
    refreshIntervalId: any = null

    keyword: string = "hashtag"

    constructor(
        private dataService: DataService,
        private utcToLocalConverter: UTCToLocalConverterPipe,
        private toastService: ToastService
    ) {

        this.buildTopicOptions()

        this.intervals = dataService.timeIntervals
        this.interval = dataService.defaultIntervalValue
        this.currentTimeInUserTimeZone = this.utcToLocalConverter.transform(new Date())
        setInterval(() => {
            this.currentTimeInUserTimeZone = this.utcToLocalConverter.transform(new Date())
        }, 1000)
    }

    ngOnInit(): void {
        this.dataService.requestAllHashtags().subscribe((hashtagsResult) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
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
                this.minDate = dayjs.utc(metaData?.start)
                this.maxDate = dayjs.utc(metaData?.end).add(dayjs().utcOffset(), "minute")
                this.maxDateEmitter.emit(this.maxDate);

                this.maxDateString = this.utcToLocalConverter.transform(dayjs.utc(metaData?.end).toDate())

                this.ranges = {
                    'Today': [dayjs().startOf('day'), this.maxDate],
                    'Yesterday': [dayjs().subtract(1, 'days').startOf('day'), dayjs().subtract(1, 'days').endOf('day')],
                    'Last 3 Hours': [dayjs().subtract(3, 'hours').startOf('hour'), dayjs().endOf('day')],
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
                this.selectedDateRangeUTC = {
                    start: dayjs.utc(data.start).add(dayjs(data.start).utcOffset(), "minute"),
                    end: dayjs.utc(data.end).add(dayjs(data.end).utcOffset(), "minute")
                }

            // set hashtag textarea
            this.hashtag = decodeURIComponent(data.hashtag.toString())

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
        if (!this.selectedDateRangeUTC)
            return

        if (this.liveMode) {
            setTimeout(() => {
                this.selectedDateRangeUTC = {
                    start: dayjs(this.maxDate).subtract(3, 'hours'),
                    end: this.maxDate
                }
            }, 1500);
        }

        const tempStart = this.selectedDateRangeUTC.start.subtract(dayjs().utcOffset(), "minute").toISOString().split(".")[0] + "Z"//.format('YYYY-MM-DDTHH:mm:ss')
        const tempEnd = this.selectedDateRangeUTC.end.subtract(dayjs().utcOffset(), "minute").toISOString().split(".")[0] + "Z"//.format('YYYY-MM-DDTHH:mm:ss')

        const tempHashTag = this.cleanHashTag(this.hashtag)

        if (this.selectedCountries.length === this.dropdownOptions.length) {
            this.countries = [""]
        } else {
            this.countries = this.selectedCountries.map(e => e.value)
        }

        this.topics = this.selectedTopics.map(e => e.value)

        this.dataService.updateURL(
            {
                hashtag: tempHashTag,
                interval: this.interval ? this.interval : "",
                start: tempStart,
                end: tempEnd,
                countries: this.countries.toString(),
                topics: this.topics.toString()
            }
        )
    }

    /**
     * Validates the form values before its being fired to API
     */
    validateForm(): boolean {
        if (this.hashtag === '') {
            console.error('Hashtag is empty')
            // show the message on toast
            this.toastService.show({
                title: 'Hashtag is empty',
                body: 'Please provide a Hashtag',
                type: 'error',
                time: 3000
            })

            const hashtagEle = document.getElementById('hashtag')
            if (hashtagEle) {
                hashtagEle.focus()
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
        if (!this.selectedDateRangeUTC)
            return false
        if (!(this.selectedDateRangeUTC.start && this.selectedDateRangeUTC.end)) {
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
        if (!(dayjs(this.selectedDateRangeUTC.start, 'DD-MM-YYYY', true).isValid()
            && dayjs(this.selectedDateRangeUTC.end, 'DD-MM-YYYY', true).isValid())) {

            console.error('Either the start date or end is invalid')
            // show the message on toast
            this.toastService.show({
                title: 'Invalid date',
                body: 'Please provide a valid date for the start and end',
                type: 'error',
                time: 3000
            })

            return false
        }

        return true
    }

    /**
     * Cleans the hashtag field value
     *
     * @param hashtag
     * @returns string comma seperated hashtag without the symbol hashtag
     */
    cleanHashTag(hashtag: string): string {
        return encodeURIComponent( // escape everyting but A–Z a–z 0–9 - _ . ! ~ * ' ( )
            hashtag
                .trim() // Remove leading/trailing whitespace
                .replace(/^#/, '')
        ) // Remove '#' symbol from hashtag if it's at the beginning
    }

    hubs: { [hubName: string]: string } = {
        "asia-pacific": "AFG,BGD,BTN,BRN,KHM,TLS,FSM,FJI,IND,IDN,KIR,LAO,MYS,MMR,NPL,PAK,PNG,PHL,SLB,LKA,TON,UZB,VUT,VNM,YEM",
        "la-carribean": "ATG,BLZ,BOL,BRA,CHL,CRI,DMA,DOM,ECU,SLV,GTM,GUY,HTI,HND,JAM,MEX,NIC,PAN,PER,TTO,URY,VEN",
        "wna": "DZA,BEN,BFA,CMR,CPV,CAF,TCD,CIV,GNQ,GHA,GIN,GNB,LBR,MLI,MRT,MAR,NER,NGA,STP,SEN,SLE,GMB,TGO",
        "esa": "AGO,BDI,COM,COD,DJI,EGY,SWZ,ETH,KEN,LSO,MDG,MWI,MUS,MOZ,NAM,RWA,SOM,SSD,SDN,TZA,UGA,ZMB,ZWE"
    }

    selectedHub: string | undefined

    changeHub(hubName: string) {
        this.selectedCountries = this.dropdownOptions.filter((option: countryDataClass) => {
            return this.hubs[hubName].includes(option.value)
        })
        this.selectedHub = hubName
    }

    impactAreas: { [id: string]: string } = {
        "disaster": "wash,waterway,social_facility,place,lulc",
        "sus_cities": "wash,waterway,social_facility,lulc,amenity,education,commercial,financial",
        "pub_health": "wash,waterway,social_facility,place,healthcare",
        "migration": "waterway,social_facility,lulc,amenity,education,commercial,healthcare",
        "g_equality": "wash,social_facility,education"
    }

    selectedImpactArea: string | undefined

    changeImpactArea(impactAreaName: string) {
        this.selectedTopics = this.topicOptions.filter((option) => {
            return this.impactAreas[impactAreaName].includes(option.value)
        })
        this.selectedImpactArea = impactAreaName
    }

    searchChange(event: any) {
        let searchedHashtag = event.query
        if (searchedHashtag.length < 1) {
            return
        }
        this.filteredHashtagOptions = this.allHashtagOptions.filter((hashtagResult) => {
            return hashtagResult.hashtag.length > 1 && hashtagResult.hashtag.includes(searchedHashtag)
        })
            .sort(
                (a: IHashtags, b: IHashtags) => {
                    if (a.hashtag.startsWith(searchedHashtag) && b.hashtag.startsWith(searchedHashtag)) {
                        return a.count <= b.count ? 1 : -1
                    } else if (a.hashtag.startsWith(searchedHashtag)) {
                        return -1
                    } else if (b.hashtag.startsWith(searchedHashtag)) {
                        return 1
                    } else {
                        return a.count <= b.count ? 1 : -1
                    }
                }
            ).slice(0, 500).map((e) => e.hashtag.replace(searchedHashtag, `<b>${searchedHashtag}</b>`))
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
        if (!this.selectedDateRangeUTC)
            return true
        if (this.selectedDateRangeUTC.start && this.selectedDateRangeUTC.end) {
            const diff = (this.selectedDateRangeUTC.end).diff(this.selectedDateRangeUTC.start, 'day')
            return (diff > 366 && dayjs.duration(value) < dayjs.duration('P1D'));
        }
        return false
    }

    /**
     * Function used if user manually writes in the date range. Currently, users can only
     * write the date part and not the time part manually
     *
     * @param $event
     */
    dateUpdated($event: any) {
        if (!$event.target)
            return

        if (!this.validateForm())
            return

        const dateRange = ($event.target.value).split(' - ')
        this.selectedDateRangeUTC = {
            start: dayjs.utc((dateRange[0]), 'DD-MM-YYYY'),
            end: dayjs.utc((dateRange[1]), 'DD-MM-YYYY').endOf('day')
        }
        // console.log('>>> dateUpdated ', $event.target.value, this.selectedDateRange)
    }

    enableLiveModeButton() {
        return this.interval === 'PT5M'
            && Math.abs(this.selectedDateRangeUTC!!.end.diff(this.selectedDateRangeUTC!!.start, 'hours')) < 4
    }

    toggleLiveMode() {
        this.liveMode = !this.liveMode
        if (this.liveMode) {
            // console.log("live mode enabled")
            this.getStatistics()
            this.refreshIntervalId = setInterval(() => {
                this.getStatistics()
            }, 10000)

            // change tooltip
            this.updateLiveTooltip('Stop Live')
        } else {
            this.turnOffLiveMode()
        }
        this.dataService.toggleLiveMode(this.liveMode)
    }

    turnOffLiveMode() {
        // console.log("live mode disabled")
        this.liveMode = false
        this.dataService.toggleLiveMode(false)
        this.updateLiveTooltip('Query Live')
        if (this.refreshIntervalId) {
            // console.log("live mode disabled")
            clearInterval(this.refreshIntervalId)
            this.refreshIntervalId = null
        }
    }

    updateLiveTooltip(msg: string) {
        const tooltipElement = <HTMLElement>document.getElementById('btnLive')
        if (!tooltipElement)
            return
        tooltipElement.setAttribute('data-bs-title', msg)
        setTimeout(() => {
            this.enableTooltips()
        }, 300)
    }

    /**
     * Boostrap need to enable tooltip on every element with its attribute
     */
    enableTooltips(): void {
        // enble tooltip
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {trigger: 'hover'}))

        // remove previous tooltips
        const tooltips = Array.from(document.getElementsByClassName("tooltip"))
        tooltips.forEach(tooltipEle => {
            tooltipEle.remove()
        })
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
