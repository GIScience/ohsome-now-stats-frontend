import {Component, Input, OnChanges, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import * as bootstrap from 'bootstrap';

import {DataService} from '../../data.service';
import {dashboard} from '../tooltip-data';
import {IHashtag} from "../types";

@Component({
    selector: 'app-trending-hashtags',
    templateUrl: './trending-hashtags.component.html',
    styleUrls: ['./trending-hashtags.component.scss'],
    standalone: false
})
export class TrendingHashtagsComponent implements OnChanges, OnDestroy {

    @Input() hashtags!: Array<IHashtag> | []
    @Input() isHashtagsLoading = false;
    trendingHashtagLimit = 0
    numOfHashtags = 0
    dashboardTooltips: any


    constructor(
        private dataService: DataService,
        private route: ActivatedRoute,
) {
        this.trendingHashtagLimit = dataService.trendingHashtagLimit
        this.dashboardTooltips = dashboard
    }

    ngOnChanges(): void {
        if (this.hashtags) {

            this.numOfHashtags = this.hashtags ? this.hashtags.length : this.trendingHashtagLimit
            // arrange the hashtags in desc order
            this.hashtags.sort((a, b) => b.number_of_users - a.number_of_users)
            this.hashtags.forEach(h => {
                // prepare a readable tooltip
                h.tooltip = `${h.hashtag} with ${h.number_of_users} distinct users`
                // clip longer hashtag to fix in view
                if (h.hashtag.length > 20)
                    h.hashtagTitle = h.hashtag.substring(0, 19) + "..."
                else
                    h.hashtagTitle = h.hashtag

                // calc hashtag's percentage
                if (this.hashtags[0])
                    h.percent = h.number_of_users / this.hashtags[0].number_of_users * 100

            })

            // give sometime to the renderer to actually find elements
            setTimeout(() => {
                this.enableTooltips()
            }, 300)

        }
    }

    /**
     * Called on click of individual hashtag among the list. Updates the URL to trigger further action
     * @param hashtag
     */
    clickHashtag(hashtag: string) {
        // console.log('>>> clickHashtag ', hashtag)
        const queryParams = this.getQueryParamsFromFragments()
        this.dataService.updateURL({
            hashtag: hashtag,
            interval: queryParams.interval,
            start: queryParams.start,
            end: queryParams.end,
            countries: queryParams.countries,
            topics: queryParams.topics
        })
    }

    /**
     * Creates query param from entire fragment of the URL
     * @returns Object with all query params separated
     */
    getQueryParamsFromFragments(): any {
        if (this.route.snapshot.fragment == null || this.route.snapshot.fragment.length < 2)
            return null

        const tempQueryParams: Array<Array<string>> | any = this.route.snapshot.fragment?.split('&')
            .map(q => [q.split('=')[0], q.split('=')[1]])
        return Object.fromEntries(tempQueryParams)
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

    ngOnDestroy(): void {
        this.hashtags = []
    }
}
