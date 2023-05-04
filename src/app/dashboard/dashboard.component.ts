import { AfterContentInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import Masonry from 'masonry-layout';
import { DataService, IQueryData, ISummaryData } from '../data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterContentInit{

  title = 'ohsome-contribution-stats'
  isOpen = false
  activeLink = ''
  summaryData: ISummaryData | undefined
  plotData: any = [{
    "changesets": 65009011,
    "users": 3003842,
    "roads": 45964973.0494135,
    "buildings": 242,
    "edits": 1095091515,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "*",
    "enddate": "2017-10-01T00:00:00.000Z",
    "startdate": "2017-09-01T00:00:00.000Z"
  },{
    "changesets": 65009011,
    "users": 3003842,
    "roads": 45964973.0494135,
    "buildings": 110,
    "edits": 1095091515,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "*",
    "enddate": "2017-11-01T00:00:00.000Z",
    "startdate": "2017-10-01T00:00:00.000Z"
  },{
    "changesets": 65009011,
    "users": 3003842,
    "roads": 45964973.0494135,
    "buildings": 844294167,
    "edits": 1095091515,
    "latest": "2023-03-20T10:55:38.000Z",
    "hashtag": "*",
    "enddate": "2018-11-23T12:23:00.000Z",
    "startdate": "2018-11-01T00:00:00.000Z"
  }]
  queryParams: any;
  summaryMessage: string = '';

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router  ) {}

  ngOnInit() {
    this.initMasonry()
    // this.addResizeWindowEvent()
    // const startDate = this.route.snapshot.paramMap.get('id')
    this.route.fragment.subscribe((fragment: string | null) => {
      const queryParams = this.getQueryParamsFromFragments()
      
      // form a appropriate message for summary data
      this.summaryMessage = this.formSummaryMessage(queryParams)

      if(queryParams == null)
        return 

      // set Query Params for the QueryComponent can access it
      this.dataService.setQueryParams(queryParams)

      // fire the request to API
      this.dataService.requestSummary(queryParams).subscribe( res => {
        console.log('>>> res = ', res)
        // send response data to Summary Component
        this.summaryData = {
          buildingEdits: res!.buildings,
          contributors: res!.users,
          edits: res!.changesets,
          kmOfRoads: res!.roads
        }

        this.dataService.setSummary(this.summaryData)
      })
    })
    
  }

  toggleSidebar() {
    console.log('>>> AppComponent >>> toggleSidebar ')
    this.isOpen = !this.isOpen
    // this.triggerResizeEvent()
    const app = document.querySelector('.app')
    if(app){
      if(app.classList.contains('is-collapsed')) 
        app.classList.remove('is-collapsed')
      else
        app.classList.add('is-collapsed')
    }
  }

  toggleDropdown(event: Event) {
    event.preventDefault()
    const clickedLink = event.target as HTMLElement
    const parentListItem = clickedLink.parentElement

    if(parentListItem)
    if (parentListItem.classList.contains('open')) {
      parentListItem.classList.remove('open')
    } else {
      const openLinks = document.querySelectorAll('.sidebar .sidebar-menu li.open')
      openLinks.forEach((openLink) => {
        openLink.classList.remove('open')
      })
    
      parentListItem.classList.add('open')
    }

  }

  initMasonry() {
    if(document.querySelectorAll('.masonry').length > 0) {
      new Masonry('.masonry', {
        itemSelector: '.masonry-item',
        columnWidth: '.masonry-sizer',
        percentPosition: true,
      })
    }
  }

  addResizeWindowEvent() {
    // ------------------------------------------------------
    // @Window Resize
    // ------------------------------------------------------

    /**
     * NOTE: Register resize event for Masonry layout
     */
    const EVENT = new CustomEvent('UIEvents', {
      detail: {},
      bubbles: true,
      cancelable: true,
      composed: false,
    })
    // window.Event = EVENT
    // CustomEvent.initCustomEvent('resize', true, false, window, 0)


    window.addEventListener('load', () => {
      /**
       * Trigger window resize event after page load
       * for recalculation of masonry layout.
       */
      window.dispatchEvent(EVENT)
    })
  }

  ngAfterContentInit(): void {

  }

  getQueryParamsFromFragments(): any {
    if(this.route.snapshot.fragment == null)
      return null
    
    const tempQueryParams: Array<Array<string>> | any = this.route.snapshot.fragment?.split('&').map( q => [q.split('=')[0], q.split('=')[1]])
    return Object.fromEntries(tempQueryParams)
  }

  /**
   * Forms an appropriate message to be display above Summary data
   * 
   * @param queryParams 
   * @returns message 
   */
  formSummaryMessage(queryParams: any): string {
    console.log('queryParams')
    if(!queryParams)
      return `Summarized statistics for all contributions`

    let message: string = ''
    if(queryParams.hashtags)
      message += `Summarized statistics of contributions with 
        ${queryParams.hashtags.split(',').map( (h: string) => ' #'+ h)}`

    if(queryParams.start)
      message += ` from ${queryParams.start}`

    if(queryParams.end)
      message += ` till ${queryParams.end}`

    return message
  }
}
