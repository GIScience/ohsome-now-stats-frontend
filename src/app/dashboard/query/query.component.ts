import {
    AfterViewInit,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    OnInit,
    QueryList,
    signal,
    ViewChildren
} from '@angular/core';
import dayjs from "dayjs";
import {NgxDropdownConfig} from 'ngx-select-dropdown';
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import dropdownOptions from "../../../assets/static/json/countryCodes.json"
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"
import {DataService} from '../../../lib/data.service';
import {ToastService} from '../../../lib/toast.service';
import {DropdownOption, IHashtags, IHighlightedHashtag, IStateParams, StatsType} from "../../../lib/types";
import {StateService} from "../../../lib/state.service";
import {AutoCompleteCompleteEvent} from "primeng/autocomplete";
import {enableTooltips, over5000IntervalBins} from "../../../lib/utils";

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)


@Component({
    selector: 'app-query',
    templateUrl: './query.component.html',
    styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnInit, AfterViewInit {
    @ViewChildren('tooltip') tooltips!: QueryList<ElementRef>;
    stateService = inject(StateService);
    dataService = inject(DataService);
    toastService = inject(ToastService);

    readonly selectedDateRange = signal<Date[] | null>(null);
    readonly selectedCountries = signal<any[]>([]);
    readonly selectedTopics = signal<any[]>([]);
    readonly interval = signal<string | null>(null);

    intervals = this.dataService.timeIntervals;


    minDate = computed(() => {
        return dayjs(this.dataService.metaData().min_timestamp);
    });

    maxDate = computed(() => {
        return dayjs(this.dataService.metaData().max_timestamp);
    });


    disabledDate = (current: Date): boolean => {
        return dayjs(current).isBefore(this.minDate())
            || dayjs(current).isAfter(this.maxDate());
    };

    dateRangeShiftedMaxDate = computed(() => {
        return this.maxDate().local().add(dayjs().utcOffset(), 'minute');
    });

    ranges = computed(() => {
        return {
            'Today': [dayjs().startOf('day').toDate(), this.dateRangeShiftedMaxDate().toDate()],
            'Yesterday': [dayjs().subtract(1, 'days').startOf('day').toDate(), dayjs().subtract(1, 'days').endOf('day').toDate()],
            'Last 3 Hours': [dayjs().subtract(3, 'hours').startOf('hour').toDate(), dayjs().toDate()],
            'Last 7 Days': [dayjs().subtract(6, 'days').startOf('day').toDate(), dayjs().endOf('day').toDate()],
            'Last 30 Days': [dayjs().subtract(29, 'days').startOf('day').toDate(), dayjs().endOf('day').toDate()],
            'Last Year': [dayjs().subtract(1, 'year').startOf('day').toDate(), dayjs().endOf('day').toDate()],
            'Entire Duration': [this.minDate().local().toDate(), this.dateRangeShiftedMaxDate().toDate()]
        }
    })

    readonly isInvalidInterval = computed(() => {
        const range = this.selectedDateRange();
        const interval = this.interval();
        if (!range || !interval) return false;

        return over5000IntervalBins(
            dayjs(range[0]),
            dayjs(range[1]),
            interval
        );
    });

    countries: string[] = [];  // only codes for url and get request
    dropdownOptions: DropdownOption[] = dropdownOptions;  // all possible countries with name and code

    topics: string[] = [];  // only codes for url and get request
    topicOptions: DropdownOption[] = []
    allHashtagOptions: IHashtags[] = []
    filteredHashtagOptions: IHighlightedHashtag[] = []
    selectedHashtagOption: IHighlightedHashtag = {hashtag: "", highlighted: ""}

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
        placeholder: 'Topics for which to generate Stats',
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
    state = computed(() => this.stateService.appState())

    constructor() {
        effect(() => {
            // TODO: check if the values differ
            this.updateSelectionFromState(this.state());
        });
        this.buildTopicOptions()

    }

    ngOnInit(): void {
        this.dataService.requestAllHashtags().subscribe((hashtagsResult: Array<IHashtags>) => {
            this.allHashtagOptions = hashtagsResult
        })

    }

    ngAfterViewInit() {
        setTimeout(() => {
            enableTooltips(this.tooltips, false)
        }, 300)
    }

    /**
     * Build selectable topics based on the topicDefinition.json
     *
     */
    buildTopicOptions() {
        for (const [key, value] of Object.entries(topicDefinitions)) {

            this.topicOptions.push({
                "name": value["dropdown_name"],
                "value": key
            })
        }
    }

    /**
     * Called on Submit button click on the form
     */
    updateStateFromSelection() {
        if (!this.validateForm() || !this.selectedDateRange())
            return

        const tempStart = dayjs(this.selectedDateRange()![0]).utc().format()
        const tempEnd = dayjs(this.selectedDateRange()![1]).utc().format()

        const tempHashTag = this.cleanHashTag(this.selectedHashtagOption)

        if (this.selectedCountries().length === this.dropdownOptions.length) {
            this.countries = [""]
        } else {
            this.countries = this.selectedCountries().map(e => e.value)
        }

        this.topics = this.selectedTopics().map(e => e.value)
        const previousState = this.stateService.appState()
        const active_topic = this.topics.includes(previousState.active_topic) ? previousState.active_topic : this.topics[0]

        const state = {
            countries: this.countries.toString(),
            hashtag: tempHashTag,
            start: tempStart,
            end: tempEnd,
            interval: this.interval()!,
            topics: this.topics.toString(),
            active_topic: active_topic as StatsType
        };

        // update the state
        this.stateService.updatePartialState(state)
    }

    /**
     * Validates the form values before its being fired to API
     */
    validateForm(): boolean {
        // check for actual values
        const dateRange = this.selectedDateRange();
        if (!dateRange)
            return false
        if (!(dateRange[0] && dateRange[1])) {
            console.error('Date range is empty')
            // show the message on toast
            this.toastService.show({
                title: 'Date range is empty',
                body: 'Please provide a valid Date range',
                type: 'error',
                time: 5000
            })

            return false
        }

        if (!(dayjs(dayjs(dateRange[0]), 'DD-MM-YYYY', true).isValid()
            && dayjs(dayjs(dateRange[1]), 'DD-MM-YYYY', true).isValid())) {

            console.error('Either the start date or end is invalid')
            // show the message on toast
            this.toastService.show({
                title: 'Invalid date',
                body: 'Please provide a valid date for the start and end',
                type: 'error',
                time: 5000
            })

            return false
        }

        if (dayjs(dateRange[0]).isAfter(dayjs(dateRange[1])) || dayjs(dateRange[0]).isSame(dayjs(dateRange[1]))) {
            this.toastService.show({
                title: 'Invalid date',
                body: 'End date needs to be after start date',
                type: 'error',
                time: 5000
            })

            return false
        }

        if (this.selectedTopics().length === 0) {
            this.toastService.show({
                title: 'No topic selected',
                body: 'Please provide at least one topic.',
                type: 'error',
                time: 5000
            })

            return false
        }

        if (this.isInvalidInterval()) {
            this.toastService.show({
                title: 'Mismatch of timespan and interval',
                body: 'The combination would result in over 5000 interval bins, please select a shorter timespan or bigger interval.',
                type: 'error',
                time: 5000
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
        if (hashtag === null) hashtag = ""

        if (typeof hashtag != "string") {
            hashtag = hashtag.hashtag
        }
        return encodeURIComponent( // escape everyting but A–Z a–z 0–9 - _ . ! ~ * ' ( )
            hashtag
                .trim()
                .replace(/^#/, '')
        )
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

    isForbiddenInterval(value: string) {
        return over5000IntervalBins(dayjs(this.selectedDateRange()![0]), dayjs(this.selectedDateRange()![1]), value)
    }

    /**
     * Updates form fields based on current state
     * This is called automatically when state changes
     *
     * @param inputData - Current query parameters state
     */
    protected updateSelectionFromState(inputData: IStateParams): void {
        if (inputData.start && inputData.end) {
            this.selectedDateRange.set([
                dayjs.utc(inputData.start).local().toDate(),
                dayjs.utc(inputData.end).local().toDate()
            ])
        }

        // Set hashtag textarea
        this.selectedHashtagOption = {
            hashtag: decodeURIComponent(inputData.hashtag || ''),
            highlighted: ""
        };

        this.interval.set(inputData.interval);

        // Set countries
        this.countries = inputData.countries ? inputData.countries.split(",").filter(c => c.trim()) : [];
        this.selectedCountries.set(this.dropdownOptions.filter((option) => {
            return this.countries.includes(option.value);
        }));

        // Set topics
        this.topics = inputData.topics ? inputData.topics.split(",").filter(t => t.trim()) : [];
        this.selectedTopics.set(this.topicOptions.filter((option) => {
            return this.topics.includes(option.value);
        }));
    }
}

function customComparator(a: DropdownOption, b: DropdownOption) {
    return a.name.localeCompare(b.name)
}
