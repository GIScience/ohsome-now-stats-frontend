import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import dayjs from 'dayjs/esm';
import { Dayjs } from "dayjs";

import { DataService, IQueryData } from '../../data.service';
import { ToastService } from 'src/app/toast.service';
import { NgxDropdownConfig } from 'ngx-select-dropdown';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnChanges {

  @Input() data: IQueryData | undefined

  metaSub!: Subscription
  hashtags = ''
  intervals: Array<{
    label: string;
    value: string;
  }> | undefined
  interval: string | undefined // default value as 'P1M'
  selectedDateRange: { end: any; start: any; } | undefined;
  alwaysShowCalendars = true;
  ranges: any
  minDate!: Dayjs
  maxDate!: Dayjs
  maxDateString!: string
  // invalidDates: moment.Moment[] = [moment().add(2, 'days'), moment().add(3, 'days'), moment().add(5, 'days')];
  // invalidDates: moment.Moment[] = [moment(this.maxDate).add(1, 'day'), moment().add(3, 'days'), moment().add(5, 'days')];

  private _start = ''
  private _end = ''
  currentTimeInUTC!: string;
  
  constructor(
    private dataService: DataService,
    private router: Router,
    private toastService: ToastService ) {
      this.intervals = dataService.timeIntervals
      this.interval = dataService.defaultIntervalValue

      setInterval( () => {
        this.currentTimeInUTC = new Intl.DateTimeFormat('de-DE', {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
            timeZone: "UTC",
            timeZoneName: "short"})
          .format(new Date())
      }, 1000)
    }

  ngOnChanges(): void {

    // listener to metaData request, 
    // theoritically should be called only once as metaData request 
    // is fired only at the start of application
    // but it is called twice since first time it is due to its assignment to null
    if(this.metaSub)
      this.metaSub.unsubscribe()
    
    this.metaSub = this.dataService.getMetaData().subscribe( metaData => {
      if(metaData && metaData.start && metaData.end) {
        this.minDate = dayjs(metaData?.start)
        this.maxDate = dayjs(metaData?.end)
        this.maxDateString = new Intl.DateTimeFormat('de-DE', {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: false,
          timeZone: "UTC",
          timeZoneName: "short"})
        .format(this.maxDate.toDate())
        this.ranges = {
          'Today': [dayjs().startOf('day'), dayjs()],
          'Yesterday': [dayjs().subtract(1, 'days').startOf('day'), dayjs().subtract(1, 'days').endOf('day')],
          'Last 7 Days': [dayjs().subtract(6, 'days').startOf('day'), dayjs().endOf('day')],
          'Last 30 Days': [dayjs().subtract(29, 'days').startOf('day'), dayjs().endOf('day')],
          'Last Year':  [dayjs().subtract(1, 'year').startOf('day'), dayjs().endOf('day')],
          'Entire Duration':  [dayjs(this.minDate), dayjs(this.maxDate)]
        }
        // 'This Month': [moment().startOf('month'), moment().endOf('month')],
        // 'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],

      }
    })


    if(this.data) {
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
   * Initializes form values which are passes from parent component
   * 
   * @param data 
   */
  initFormValues(data: IQueryData) {
    // console.log('>>> initFormValues >>> data ', data)
    if(data && Object.keys(data).length !== 0) {
      if(!(data.start && data.end)) {
        console.log('date range is null')
      }
      // set Start and end dates
      if(data.start && data.end)
        this.selectedDateRange = {
          start: dayjs(data.start),
          end: dayjs(data.end)
        }

      // set hashtags textarea
      this.hashtags = data.hashtags.toString()

      // set interval
      this.interval = data.interval
    }
  }

  /**
   * Called on Submit button click on the form
   */
  getStatistics() {
    if(!this.validateForm())
      return
    this.dataService.requestMetadata()

    // console.log('>>> QueryComponent >>> getStatistics', this.selectedDateRange)
    // get all values from form
    if(! this.selectedDateRange)
      return
    const tempEnd = (this.selectedDateRange.end).toISOString()
    const tempStart = (this.selectedDateRange.start).toISOString()
    // currently we support only one hashtags
    // TODO: in future, if multiple hastags a present then fire 
    // request to /group-summaries endpoint and not /stats
    const tempHashTags = this.cleanHashTags(this.hashtags)
    // console.log('formvalues = ', tempStart, tempEnd, this.interval, tempHashTags)

    // update the url fragment
    this.router.navigate([], { 
      fragment: `hashtags=${tempHashTags}&start=${tempStart}&end=${tempEnd}&interval=${this.interval}` 
    })
  }

  /**
   * Validates the form values before its being fired to API
   */
  validateForm(): boolean {
    // console.log('>>> validateForm >>> this.hashtags ', this.hashtags)
    if(this.hashtags === ''){
      console.error('Hashtag is empty')
      // show the message on toast
      this.toastService.show({
        title: 'Hashtag is empty',
        body: 'Please provide a Hashtag',
        type: 'error',
        time: 3000
      })

      const hashtagsEle = document.getElementById('hastags')
      if(hashtagsEle){
        hashtagsEle.focus()
      }
      return false
    }

    // console.log('>>> validateForm >>> this.selectedDateRange ', this.selectedDateRange)
    const dateRangeEle = document.getElementById('dateRange')
    // console.log('dateRangeEle ', (dateRangeEle as HTMLInputElement).value)
    // check if text feild is empty
    if(! (dateRangeEle as HTMLInputElement).value ) {
      console.error('Date range is empty')
      // show the message on toast
      this.toastService.show({
        title: 'Date range is empty',
        body: 'Please provide a valid Date range',
        type: 'error',
        time: 3000
      })

      // dateRangeEle?.classList.add(...['was-validated','form-control:invalid','form-control.is-invalid'])

      return false
    }

    // check for actual values
    if(! this.selectedDateRange)
      return false
    if(!(this.selectedDateRange.start && this.selectedDateRange.end)) {
      console.error('Date range is empty')
      // show the message on toast
      this.toastService.show({
        title: 'Date range is empty',
        body: 'Please provide a valid Date range',
        type: 'error',
        time: 3000
      })

      // dateRangeEle?.classList.add(...['was-validated','form-control:invalid','form-control.is-invalid'])

      return false
    }

    return true
  }

  /**
   * Cleans the hastags field values
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


    configCountry: NgxDropdownConfig =  {
      displayKey: 'name',
      search: true,
      height: '20rem',
      placeholder: 'Optionally filter by Country',
      limitTo: 0,
      moreText: 'item',
      noResultsFound: 'No results found',
      searchPlaceholder: 'Search',
      searchOnKey: 'name',
      customComparator:customComparator,
      clearOnSelection: true,
      inputDirection: "up",
      enableSelectAll: true
    };

    dataModel:any = []
//todo: there might be some missing, and this is not the right place to store it
    dropdownOptions =  [
      { "name": "Afghanistan", "value": "AFG" },
      { "name": "Albania", "value": "ALB" },
      { "name": "Algeria", "value": "DZA" },
      { "name": "Andorra", "value": "AND" },
      { "name": "Angola", "value": "AGO" },
      { "name": "Antigua and Barbuda", "value": "ATG" },
      { "name": "Argentina", "value": "ARG" },
      { "name": "Armenia", "value": "ARM" },
      { "name": "Australia", "value": "AUS" },
      { "name": "Austria", "value": "AUT" },
      { "name": "Azerbaijan", "value": "AZE" },
      { "name": "Bahamas", "value": "BHS" },
      { "name": "Bahrain", "value": "BHR" },
      { "name": "Bangladesh", "value": "BGD" },
      { "name": "Barbados", "value": "BRB" },
      { "name": "Belarus", "value": "BLR" },
      { "name": "Belgium", "value": "BEL" },
      { "name": "Belize", "value": "BLZ" },
      { "name": "Benin", "value": "BEN" },
      { "name": "Bhutan", "value": "BTN" },
      { "name": "Bolivia", "value": "BOL" },
      { "name": "Bosnia and Herzegovina", "value": "BIH" },
      { "name": "Botswana", "value": "BWA" },
      { "name": "Brazil", "value": "BRA" },
      { "name": "Brunei", "value": "BRN" },
      { "name": "Bulgaria", "value": "BGR" },
      { "name": "Burkina Faso", "value": "BFA" },
      { "name": "Burundi", "value": "BDI" },
      { "name": "Cabo Verde", "value": "CPV" },
      { "name": "Cambodia", "value": "KHM" },
      { "name": "Cameroon", "value": "CMR" },
      { "name": "Canada", "value": "CAN" },
      { "name": "Central African Republic", "value": "CAF" },
      { "name": "Chad", "value": "TCD" },
      { "name": "Chile", "value": "CHL" },
      { "name": "China", "value": "CHN" },
      { "name": "Colombia", "value": "COL" },
      { "name": "Comoros", "value": "COM" },
      { "name": "Congo (Congo-Brazzaville)", "value": "COG" },
      { "name": "Costa Rica", "value": "CRI" },
      { "name": "Croatia", "value": "HRV" },
      { "name": "Cuba", "value": "CUB" },
      { "name": "Cyprus", "value": "CYP" },
      { "name": "Czechia (Czech Republic)", "value": "CZE" },
      { "name": "Democratic Republic of the Congo", "value": "COD" },
      { "name": "Denmark", "value": "DNK" },
      { "name": "Djibouti", "value": "DJI" },
      { "name": "Dominica", "value": "DMA" },
      { "name": "Dominican Republic", "value": "DOM" },
      { "name": "Ecuador", "value": "ECU" },
      { "name": "Egypt", "value": "EGY" },
      { "name": "El Salvador", "value": "SLV" },
      { "name": "Equatorial Guinea", "value": "GNQ" },
      { "name": "Eritrea", "value": "ERI" },
      { "name": "Estonia", "value": "EST" },
      { "name": "Eswatini", "value": "SWZ" },
      { "name": "Ethiopia", "value": "ETH" },
      { "name": "Fiji", "value": "FJI" },
      { "name": "Finland", "value": "FIN" },
      { "name": "France", "value": "FRA" },
      { "name": "Gabon", "value": "GAB" },
      { "name": "Gambia", "value": "GMB" },
      { "name": "Georgia", "value": "GEO" },
      { "name": "Germany", "value": "DEU" },
      { "name": "Ghana", "value": "GHA" },
      { "name": "Greece", "value": "GRC" },
      { "name": "Grenada", "value": "GRD" },
      { "name": "Guatemala", "value": "GTM" },
      { "name": "Guinea", "value": "GIN" },
      { "name": "Guinea-Bissau", "value": "GNB" },
      { "name": "Guyana", "value": "GUY" },
      { "name": "Haiti", "value": "HTI" },
      { "name": "Holy See", "value": "VAT" },
      { "name": "Honduras", "value": "HND" },
      { "name": "Hungary", "value": "HUN" },
      { "name": "Iceland", "value": "ISL" },
      { "name": "India", "value": "IND" },
      { "name": "Indonesia", "value": "IDN" },
      { "name": "Iran", "value": "IRN" },
      { "name": "Iraq", "value": "IRQ" },
      { "name": "Ireland", "value": "IRL" },
      { "name": "Israel", "value": "ISR" },  { "name": "Marshall Islands", "value": "MHL" },
      { "name": "Mauritania", "value": "MRT" },
      { "name": "Mauritius", "value": "MUS" },
      { "name": "Mexico", "value": "MEX" },
      { "name": "Micronesia", "value": "FSM" },
      { "name": "Moldova", "value": "MDA" },
      { "name": "Monaco", "value": "MCO" },
      { "name": "Mongolia", "value": "MNG" },
      { "name": "Montenegro", "value": "MNE" },
      { "name": "Morocco", "value": "MAR" },
      { "name": "Mozambique", "value": "MOZ" },
      { "name": "Myanmar (formerly Burma)", "value": "MMR" },
      { "name": "Namibia", "value": "NAM" },
      { "name": "Nauru", "value": "NRU" },
      { "name": "Nepal", "value": "NPL" },
      { "name": "Netherlands", "value": "NLD" },
      { "name": "New Zealand", "value": "NZL" },
      { "name": "Nicaragua", "value": "NIC" },
      { "name": "Niger", "value": "NER" },
      { "name": "Nigeria", "value": "NGA" },
      { "name": "North Korea", "value": "PRK" },
      { "name": "North Macedonia", "value": "MKD" },
      { "name": "Norway", "value": "NOR" },
      { "name": "Oman", "value": "OMN" },
      { "name": "Pakistan", "value": "PAK" },
      { "name": "Palau", "value": "PLW" },
      { "name": "Palestine State", "value": "PSE" },
      { "name": "Panama", "value": "PAN" },
      { "name": "Papua New Guinea", "value": "PNG" },
      { "name": "Paraguay", "value": "PRY" },
      { "name": "Peru", "value": "PER" },
      { "name": "Philippines", "value": "PHL" },
      { "name": "Poland", "value": "POL" },
      { "name": "Portugal", "value": "PRT" },
      { "name": "Qatar", "value": "QAT" },
      { "name": "Romania", "value": "ROU" },
      { "name": "Russia", "value": "RUS" },
      { "name": "Rwanda", "value": "RWA" },
      { "name": "Saint Kitts and Nevis", "value": "KNA" },
      { "name": "Saint Lucia", "value": "LCA" },
      { "name": "Saint Vincent and the Grenadines", "value": "VCT" },
      { "name": "Samoa", "value": "WSM" },
      { "name": "San Marino", "value": "SMR" },
      { "name": "Sao Tome and Principe", "value": "STP" },
      { "name": "Saudi Arabia", "value": "SAU" },
      { "name": "Senegal", "value": "SEN" },
      { "name": "Serbia", "value": "SRB" },
      { "name": "Seychelles", "value": "SYC" },
      { "name": "Sierra Leone", "value": "SLE" },
      { "name": "Singapore", "value": "SGP" },
      { "name": "Italy", "value": "ITA" },
      { "name": "Jamaica", "value": "JAM" },
      { "name": "Japan", "value": "JPN" },
      { "name": "Jordan", "value": "JOR" },
      { "name": "Kazakhstan", "value": "KAZ" },
      { "name": "Kenya", "value": "KEN" },
      { "name": "Kiribati", "value": "KIR" },
      { "name": "Kuwait", "value": "KWT" },
      { "name": "Kyrgyzstan", "value": "KGZ" },
      { "name": "Laos", "value": "LAO" },
      { "name": "Latvia", "value": "LVA" },
      { "name": "Lebanon", "value": "LBN" },
      { "name": "Lesotho", "value": "LSO" },
      { "name": "Liberia", "value": "LBR" },
      { "name": "Libya", "value": "LBY" },
      { "name": "Liechtenstein", "value": "LIE" },
      { "name": "Lithuania", "value": "LTU" },
      { "name": "Luxembourg", "value": "LUX" },
      { "name": "Madagascar", "value": "MDG" },
      { "name": "Malawi", "value": "MWI" },
      { "name": "Malaysia", "value": "MYS" },
      { "name": "Maldives", "value": "MDV" },
      { "name": "Mali", "value": "MLI" },
      { "name": "Malta", "value": "MLT" },
      { "name": "Marshall Islands", "value": "MHL" },
      { "name": "Mauritania", "value": "MRT" },
      { "name": "Mauritius", "value": "MUS" },
      { "name": "Mexico", "value": "MEX" },
      { "name": "Micronesia", "value": "FSM" },
      { "name": "Moldova", "value": "MDA" },
      { "name": "Monaco", "value": "MCO" },
      { "name": "Mongolia", "value": "MNG" },
      { "name": "Montenegro", "value": "MNE" },
      { "name": "Morocco", "value": "MAR" },
      { "name": "Mozambique", "value": "MOZ" },
      { "name": "Myanmar (formerly Burma)", "value": "MMR" },
      { "name": "Namibia", "value": "NAM" },
      { "name": "Nauru", "value": "NRU" },
      { "name": "Nepal", "value": "NPL" },
      { "name": "Netherlands", "value": "NLD" },
      { "name": "New Zealand", "value": "NZL" },
      { "name": "Nicaragua", "value": "NIC" },
      { "name": "Niger", "value": "NER" },
      { "name": "Nigeria", "value": "NGA" },
      { "name": "North Korea", "value": "PRK" },
      { "name": "North Macedonia", "value": "MKD" },
      { "name": "Norway", "value": "NOR" },
      { "name": "Oman", "value": "OMN" },
      { "name": "Pakistan", "value": "PAK" },
      { "name": "Palau", "value": "PLW" },
      { "name": "Palestine State", "value": "PSE" },
      { "name": "Panama", "value": "PAN" },
      { "name": "Papua New Guinea", "value": "PNG" },
      { "name": "Paraguay", "value": "PRY" },
      { "name": "Peru", "value": "PER" },
      { "name": "Philippines", "value": "PHL" },
      { "name": "Poland", "value": "POL" },
      { "name": "Portugal", "value": "PRT" },
      { "name": "Qatar", "value": "QAT" },
      { "name": "Romania", "value": "ROU" },
      { "name": "Russia", "value": "RUS" },
      { "name": "Rwanda", "value": "RWA" },
      { "name": "Saint Kitts and Nevis", "value": "KNA" },
      { "name": "Saint Lucia", "value": "LCA" },
      { "name": "Saint Vincent and the Grenadines", "value": "VCT" },
      { "name": "Samoa", "value": "WSM" },
      { "name": "San Marino", "value": "SMR" },
      { "name": "Sao Tome and Principe", "value": "STP" },
      { "name": "Saudi Arabia", "value": "SAU" },
      { "name": "Senegal", "value": "SEN" },
      { "name": "Serbia", "value": "SRB" },
      { "name": "Seychelles", "value": "SYC" },
      { "name": "Sierra Leone", "value": "SLE" },
      { "name": "Singapore", "value": "SGP" },
      { "name": "Slovakia", "value": "SVK" },
      { "name": "Slovenia", "value": "SVN" },
      { "name": "Solomon Islands", "value": "SLB" },
      { "name": "Somalia", "value": "SOM" },
      { "name": "South Africa", "value": "ZAF" },
      { "name": "South Korea", "value": "KOR" },
      { "name": "South Sudan", "value": "SSD" },
      { "name": "Spain", "value": "ESP" },
      { "name": "Sri Lanka", "value": "LKA" },
      { "name": "Sudan", "value": "SDN" },
      { "name": "Suriname", "value": "SUR" },
      { "name": "Sweden", "value": "SWE" },
      { "name": "Switzerland", "value": "CHE" },
      { "name": "Syria", "value": "SYR" },
      { "name": "Tajikistan", "value": "TJK" },
      { "name": "Tanzania", "value": "TZA" },
      { "name": "Thailand", "value": "THA" },
      { "name": "Timor-Leste", "value": "TLS" },
      { "name": "Togo", "value": "TGO" },
      { "name": "Tonga", "value": "TON" },
      { "name": "Trinidad and Tobago", "value": "TTO" },
      { "name": "Tunisia", "value": "TUN" },
      { "name": "Turkey", "value": "TUR" },
      { "name": "Turkmenistan", "value": "TKM" },
      { "name": "Tuvalu", "value": "TUV" },
      { "name": "Uganda", "value": "UGA" },
      { "name": "Ukraine", "value": "UKR" },
      { "name": "United Arab Emirates", "value": "ARE" },
      { "name": "United Kingdom", "value": "GBR" },
      { "name": "United States", "value": "USA" },
      { "name": "Uruguay", "value": "URY" },
      { "name": "Uzbekistan", "value": "UZB" },
      { "name": "Vanuatu", "value": "VUT" },
      { "name": "Venezuela", "value": "VEN" },
      { "name": "Vietnam", "value": "VNM" },
      { "name": "Yemen", "value": "YEM" },
      { "name": "Zambia", "value": "ZMB" },
      { "name": "Zimbabwe", "value": "ZWE" },
      { "name": "Cook Islands", "value": "COK" },
      { "name": "Taiwan", "value": "TWN" },
    ]
}

function customComparator(a:any,b:any){
    return a.name.localeCompare(b.name)
  }