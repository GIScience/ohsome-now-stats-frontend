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

    dropdownOptions =  [ 
      { name: 'Afghanistan', value: 'AF' },
      { name: 'Åland Islands', value: 'AX' },
      { name: 'Albania', value: 'AL' },
      { name: 'Algeria', value: 'DZ' },
      { name: 'American Samoa', value: 'AS' },
      { name: 'Andorra', value: 'AD' },
      { name: 'Angola', value: 'AO' },
      { name: 'Anguilla', value: 'AI' },
      { name: 'Antarctica', value: 'AQ' },
      { name: 'Antigua and Barbuda', value: 'AG' },
      { name: 'Argentina', value: 'AR' },
      { name: 'Armenia', value: 'AM' },
      { name: 'Aruba', value: 'AW' },
      { name: 'Australia', value: 'AU' },
      { name: 'Austria', value: 'AT' },
      { name: 'Azerbaijan', value: 'AZ' },
      { name: 'Bahamas', value: 'BS' },
      { name: 'Bahrain', value: 'BH' },
      { name: 'Bangladesh', value: 'BD' },
      { name: 'Barbados', value: 'BB' },
      { name: 'Belarus', value: 'BY' },
      { name: 'Belgium', value: 'BE' },
      { name: 'Belize', value: 'BZ' },
      { name: 'Benin', value: 'BJ' },
      { name: 'Bermuda', value: 'BM' },
      { name: 'Bhutan', value: 'BT' },
      { name: 'Bolivia', value: 'BO' },
      { name: 'Bosnia and Herzegovina', value: 'BA' },
      { name: 'Botswana', value: 'BW' },
      { name: 'Bouvet Island', value: 'BV' },
      { name: 'Brazil', value: 'BR' },
      { name: 'British Indian Ocean Territory', value: 'IO' },
      { name: 'Brunei Darussalam', value: 'BN' },
      { name: 'Bulgaria', value: 'BG' },
      { name: 'Burkina Faso', value: 'BF' },
      { name: 'Burundi', value: 'BI' },
      { name: 'Cambodia', value: 'KH' },
      { name: 'Cameroon', value: 'CM' },
      { name: 'Canada', value: 'CA' },
      { name: 'Cape Verde', value: 'CV' },
      { name: 'Cayman Islands', value: 'KY' },
      { name: 'Central African Republic', value: 'CF' },
      { name: 'Chad', value: 'TD' },
      { name: 'Chile', value: 'CL' },
      { name: 'China', value: 'CN' },
      { name: 'Christmas Island', value: 'CX' },
      { name: 'Cocos (Keeling) Islands', value: 'CC' },
      { name: 'Colombia', value: 'CO' },
      { name: 'Comoros', value: 'KM' },
      { name: 'Congo', value: 'CG' },
      { name: 'Congo, The Democratic Republic of the', value: 'CD' },
      { name: 'Cook Islands', value: 'CK' },
      { name: 'Costa Rica', value: 'CR' },
      { name: "Cote d'Ivoire", value: 'CI' },
      { name: 'Croatia', value: 'HR' },
      { name: 'Cuba', value: 'CU' },
      { name: 'Cyprus', value: 'CY' },
      { name: 'Czech Republic', value: 'CZ' },
      { name: 'Denmark', value: 'DK' },
      { name: 'Djibouti', value: 'DJ' },
      { name: 'Dominica', value: 'DM' },
      { name: 'Dominican Republic', value: 'DO' },
      { name: 'Ecuador', value: 'EC' },
      { name: 'Egypt', value: 'EG' },
      { name: 'El Salvador', value: 'SV' },
      { name: 'Equatorial Guinea', value: 'GQ' },
      { name: 'Eritrea', value: 'ER' },
      { name: 'Estonia', value: 'EE' },
      { name: 'Ethiopia', value: 'ET' },
      { name: 'Falkland Islands (Malvinas)', value: 'FK' },
      { name: 'Faroe Islands', value: 'FO' },
      { name: 'Fiji', value: 'FJ' },
      { name: 'Finland', value: 'FI' },
      { name: 'France', value: 'FR' },
      { name: 'French Guiana', value: 'GF' },
      { name: 'French Polynesia', value: 'PF' },
      { name: 'French Southern Territories', value: 'TF' },
      { name: 'Gabon', value: 'GA' },
      { name: 'Gambia', value: 'GM' },
      { name: 'Georgia', value: 'GE' },
      { name: 'Germany', value: 'DE' },
      { name: 'Ghana', value: 'GH' },
      { name: 'Gibraltar', value: 'GI' },
      { name: 'Greece', value: 'GR' },
      { name: 'Greenland', value: 'GL' },
      { name: 'Grenada', value: 'GD' },
      { name: 'Guadeloupe', value: 'GP' },
      { name: 'Guam', value: 'GU' },
      { name: 'Guatemala', value: 'GT' },
      { name: 'Guernsey', value: 'GG' },
      { name: 'Guinea', value: 'GN' },
      { name: 'Guinea-Bissau', value: 'GW' },
      { name: 'Guyana', value: 'GY' },
      { name: 'Haiti', value: 'HT' },
      { name: 'Heard Island and McDonald Islands', value: 'HM' },
      { name: 'Holy See (Vatican City State)', value: 'VA' },
      { name: 'Honduras', value: 'HN' },
      { name: 'Hong Kong', value: 'HK' },
      { name: 'Hungary', value: 'HU' },
      { name: 'Iceland', value: 'IS' },
      { name: 'India', value: 'IN' },        ];

}

function customComparator(a:any,b:any){
    return a.name.localeCompare(b.name)
  }