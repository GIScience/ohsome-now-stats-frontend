import {Component, computed, effect, EventEmitter, Input, OnDestroy, OnInit, Output, Signal} from '@angular/core';
import {Subscription} from 'rxjs';
import dayjs, {Dayjs} from "dayjs";
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
import {IDateRange, IHashtags, IHighlightedHashtag, IQueryParams} from "../types";
import {UTCToLocalConverterPipe} from './pipes/utc-to-local-converter.pipe';
import {ActivatedRoute} from "@angular/router";
import {StateService} from "../../state.service";
import {DateRanges, TimePeriod} from "ngx-daterangepicker-material/daterangepicker.component";
import {AutoCompleteCompleteEvent} from "primeng/autocomplete";

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)


@Component({
    selector: 'app-query',
    templateUrl: './query.component.html',
    styleUrls: ['./query.component.scss'],
    standalone: false
})
export class QueryComponent implements OnInit, OnDestroy {

    hashtag = ''
    intervals: Array<{
        label: string;
        value: string;
    }> | undefined
    interval: string | undefined // default value as 'P1M'
    selectedDateRangeUTC: IDateRange | undefined
    minDate = computed(() => dayjs.utc(this.dataService.metaData().min_timestamp).add(dayjs().utcOffset(), "minute"))
    maxDate = computed(() => dayjs.utc(this.dataService.metaData().max_timestamp).add(dayjs().utcOffset(), "minute"))
    ranges: Signal<DateRanges> = computed(() => {
        return {
            'Today': [dayjs().startOf('day'), this.maxDate()],
            'Yesterday': [dayjs().subtract(1, 'days').startOf('day'), dayjs().subtract(1, 'days').endOf('day')],
            'Last 3 Hours': [dayjs().subtract(3, 'hours').startOf('hour'), dayjs().endOf('day')],
            'Last 7 Days': [dayjs().subtract(6, 'days').startOf('day'), dayjs().endOf('day')],
            'Last 30 Days': [dayjs().subtract(29, 'days').startOf('day'), dayjs().endOf('day')],
            'Last Year': [dayjs().subtract(1, 'year').startOf('day'), dayjs().endOf('day')],
            'Entire Duration': [dayjs(this.minDate()), dayjs(this.maxDate())]
        }
    })

    maxDateString = this.utcToLocalConverter.transform(dayjs.utc(this.maxDate()).toDate())

    currentTimeInUserTimeZone!: string;

    countries: string[] = [];  // only codes for url and get request
    dropdownOptions = dropdownOptions;  // all possible countries with name and code
    selectedCountries: countryDataClass[] = []  // selected countries with name and code

    topics: string[] = [];  // only codes for url and get request
    topicOptions: Array<{ name: string; value: string; }> = []
    selectedTopics: topicDataClass[] = []  // selected countries with name and code
    hot_controls: boolean = false;
    allHashtagOptions: IHashtags[] = []
    filteredHashtagOptions: IHighlightedHashtag[] = []
    selectedHashtagOption: IHighlightedHashtag = {hashtag: "", highlighted: ""}
    liveMode: boolean = false
    refreshIntervalId: number | null = null
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
    }
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
    }
    private subscription = new Subscription();
    state = computed(() => this.stateService.appState())

    constructor(
        private stateService: StateService,
        private dataService: DataService,
        private utcToLocalConverter: UTCToLocalConverterPipe,
        private toastService: ToastService,
        private activatedRoute: ActivatedRoute
    ) {

        effect(() => {
            // TODO: check if the values differ
            this.updateFormFromState(this.state());
        });

        this.buildTopicOptions()

        this.intervals = dataService.timeIntervals
        this.interval = dataService.defaultIntervalValue
        this.currentTimeInUserTimeZone = this.utcToLocalConverter.transform(new Date())
        setInterval(() => {
            this.currentTimeInUserTimeZone = this.utcToLocalConverter.transform(new Date())
        }, 1000)
    }

    ngOnInit(): void {
        this.enableTooltips()
        this.dataService.requestAllHashtags().subscribe((hashtagsResult: Array<IHashtags>) => {
            // view mode is HOT
            if(this.activatedRoute.snapshot.url.length == 2 ) {
                if (this.activatedRoute.snapshot.url[0].path == 'dashboard' && this.activatedRoute.snapshot.url[1].path == 'hotosm') {
                    this.hot_controls = true
                    this.selectedHashtagOption = {hashtag: "hotosm-project-*", highlighted: "hotosm-project-*"}
                    this.getStatistics()
                }
            } else if (this.activatedRoute.snapshot.url.length == 1 && this.activatedRoute.snapshot.url[0].path == 'dashboard' ) {
                this.getStatistics()
            }

            this.allHashtagOptions = hashtagsResult
        })
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
     * Called on Submit button click on the form
     */
    getStatistics() {

        if (!this.validateForm())
            return

        // get all values from form
        if (!this.selectedDateRangeUTC)
            return

        if (this.liveMode) {
            setTimeout(() => {
                this.selectedDateRangeUTC = {
                    start: dayjs(this.maxDate()).subtract(3, 'hours'),
                    end: this.maxDate()
                }
            }, 1500);
        }

        const tempStart = this.selectedDateRangeUTC.start.subtract(dayjs().utcOffset(), "minute").toISOString().split(".")[0] + "Z"//.format('YYYY-MM-DDTHH:mm:ss')
        const tempEnd = this.selectedDateRangeUTC.end.subtract(dayjs().utcOffset(), "minute").toISOString().split(".")[0] + "Z"//.format('YYYY-MM-DDTHH:mm:ss')

        const tempHashTag = this.cleanHashTag(this.selectedHashtagOption)

        if (this.selectedCountries.length === this.dropdownOptions.length) {
            this.countries = [""]
        } else {
            this.countries = this.selectedCountries.map(e => e.value)
        }

        this.topics = this.selectedTopics.map(e => e.value)

        const state = {
            countries: this.countries.toString(),
            hashtag: tempHashTag,
            start: tempStart,
            end: tempEnd,
            interval: this.interval ? this.interval : "P1M", // Default monthly interval
            topics: this.topics.toString()
        };

        // update the state
        this.stateService.updatePartialState(state)
    }

    /**
     * Validates the form values before its being fired to API
     */
    validateForm(): boolean {
        const dateRangeEle = document.getElementById('dateRange') as HTMLInputElement | null

        // check if text field is empty
        if (!dateRangeEle || !dateRangeEle.value) {
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
    cleanHashTag(hashtag: IHighlightedHashtag | string): string {
        if (typeof hashtag != "string") {
            hashtag = hashtag.hashtag
        }
        return encodeURIComponent( // escape everyting but A–Z a–z 0–9 - _ . ! ~ * ' ( )
            hashtag
                .trim()
                .replace(/^#/, '')
        )
    }

    changeHub(hubName: string) {
        this.selectedCountries = this.dropdownOptions.filter((option: countryDataClass) => {
            return this.hubs[hubName].includes(option.value)
        })
        this.selectedHub = hubName
    }

    changeImpactArea(impactAreaName: string) {
        this.selectedTopics = this.topicOptions.filter((option) => {
            return this.impactAreas[impactAreaName].includes(option.value)
        })
        this.selectedImpactArea = impactAreaName
    }

    searchChange(event: AutoCompleteCompleteEvent) {
        const searchedHashtag = event.query.toString().toLocaleLowerCase()
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
            ).slice(0, 100).map((e) => {
                return {
                    "hashtag": e.hashtag,
                    "highlighted": e.hashtag.replace(searchedHashtag, `<b>${searchedHashtag}</b>`)
                }
            })
    }

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
    dateUpdated($event: TimePeriod | null) {
        if (!$event)
            return

        if (!$event['target'])
            return

        if (!this.validateForm())
            return

        this.selectedDateRangeUTC = {
            start: $event.startDate as Dayjs,
            end: ($event.endDate as Dayjs).endOf('day')
        }

        this.onDateRangeChange(this.selectedDateRangeUTC)
    }

    enableLiveModeButton() {
        return this.interval === 'PT5M'
            && Math.abs(this.selectedDateRangeUTC!.end.diff(this.selectedDateRangeUTC!.start, 'hours')) < 4
    }

    toggleLiveMode() {
        this.liveMode = !this.liveMode
        if (this.liveMode) {
            this.getStatistics()
            this.refreshIntervalId = setInterval(() => {
                this.getStatistics()
            }, 10000) as unknown as number

            // change tooltip
            this.updateLiveTooltip('Stop Live')
        } else {
            this.turnOffLiveMode()
        }
        this.dataService.toggleLiveMode(this.liveMode)
    }

    turnOffLiveMode() {
        this.liveMode = false
        this.dataService.toggleLiveMode(false)
        this.updateLiveTooltip('Query Live')
        if (this.refreshIntervalId) {
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
        // enable tooltip
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {trigger: 'hover'}))

        // remove previous tooltips
        const tooltips = Array.from(document.getElementsByClassName("tooltip"))
        tooltips.forEach(tooltipEle => {
            tooltipEle.remove()
        })
    }

    /**
     * Updates form fields based on current state
     * This is called automatically when state changes
     *
     * @param inputData - Current query parameters state
     */
    private updateFormFromState(inputData: IQueryParams): void {
        // Set Start and end dates
        if (inputData.start && inputData.end) {
            this.selectedDateRangeUTC = {
                start: dayjs.utc(inputData.start).add(dayjs(inputData.start).utcOffset(), "minute"),
                end: dayjs.utc(inputData.end).add(dayjs(inputData.end).utcOffset(), "minute")
            };
        }

        // Set hashtag textarea
        this.hashtag = decodeURIComponent(inputData.hashtag || '');
        this.selectedHashtagOption = {
            hashtag: this.hashtag,
            highlighted: ""
        };

        // Set interval
        this.interval = inputData.interval;

        // Set countries
        this.countries = inputData.countries ? inputData.countries.split(",").filter(c => c.trim()) : [];
        this.selectedCountries = this.dropdownOptions.filter((option) => {
            return this.countries.includes(option.value);
        });

        // Set topics
        this.topics = inputData.topics ? inputData.topics.split(",").filter(t => t.trim()) : [];
        this.selectedTopics = this.topicOptions.filter((option) => {
            return this.topics.includes(option.value);
        });
    }

    /**
     * Handle date range changes from date picker
     */
    onDateRangeChange(dateRange: IDateRange): void {
        if (dateRange.start && dateRange.end) {
            // console.log('>>> onDateRangeChange >>> ', dateRange.start);
            const startISO = dayjs(dateRange.start).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            const endISO = dayjs(dateRange.end).format('YYYY-MM-DDTHH:mm:ss') + 'Z';

            this.stateService.updatePartialState({
                start: startISO,
                end: endISO
            });
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.turnOffLiveMode()
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
