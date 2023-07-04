import { Component, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as bootstrap from 'bootstrap';

import { DataService, IHashtag } from '../../data.service';

@Component({
  selector: 'app-trending-hashtags',
  templateUrl: './trending-hashtags.component.html',
  styleUrls: ['./trending-hashtags.component.scss']
})
export class TrendingHashtagsComponent implements OnChanges {
  
  @Input() hashtags!: Array<IHashtag> | [] | undefined
  trendingHashtagLimit: number = 0
  numOfHashtags: number = 0

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router ) {
      this.trendingHashtagLimit = dataService.trendingHashtagLimit
  }

  ngOnChanges(): void {
    if(this.hashtags){
      // give sometime to the renderer to actually find elements
      setTimeout( () => {
        this.enableTooltips()
      }, 300)
      
      this.numOfHashtags = this.hashtags ? this.hashtags.length : this.trendingHashtagLimit
      // arange the hashtags in desc order
      this.hashtags.sort((a, b) => b.number_of_users - a.number_of_users)
      // clip longer hashtag to fix in view
      this.hashtags.forEach( h => {
        h.tooltip = h.hashtag
        if(h.hashtag.length > 20)
          h.hashtag = h.hashtag.substring(0, 19) + "...";
      })
    }    
  }
  
  /**
   * Called on click of individual hashtag among the list. Updates the URL to trigger further action
   * @param hashtag 
   */
  clickHashtag(hashtag: string) {
    console.log('>>> clickHashtag ', hashtag)
    const queryParams = this.getQueryParamsFromFragments()

    this.router.navigate([], { 
      fragment: `hashtags=${hashtag.substring(1)}&start=${queryParams.start}&end=${queryParams.end}&interval=${queryParams.interval}` 
    });
  }

  /**
   * Creates query param from enitre fragment of the URL
   * @returns Object with all query params sepearted
   */
  getQueryParamsFromFragments(): any {
    if(this.route.snapshot.fragment == null || this.route.snapshot.fragment.length < 2)
      return null
    
    const tempQueryParams: Array<Array<string>> | any = this.route.snapshot.fragment?.split('&')
        .map( q => [q.split('=')[0], q.split('=')[1]])
    return Object.fromEntries(tempQueryParams)
  }

  /**
   * Boostrap need to enable tooltip on every element with its attribute
   */
  enableTooltips(): void {
    // enble tooltip
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    // console.log('tooltipTriggerList =', tooltipTriggerList)
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, { trigger: 'hover'}))
  }
}
