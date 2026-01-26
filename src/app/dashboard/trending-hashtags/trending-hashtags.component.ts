import {Component, computed, effect, ElementRef, QueryList, ViewChildren} from '@angular/core';

import {DataService} from '../../data.service';
import {dashboard} from '../tooltip-data';
import {IHashtag} from "../types";
import {StateService} from "../../state.service";
import {enableTooltips} from "../../utils";
import {Overlay} from '../../overlay.component';

@Component({
    selector: 'app-trending-hashtags',
    templateUrl: './trending-hashtags.component.html',
    styleUrls: ['./trending-hashtags.component.scss'],
    imports: [Overlay],
})
export class TrendingHashtagsComponent {
    @ViewChildren('tooltip') tooltips!: QueryList<ElementRef>;
    hashtags!: Array<IHashtag> | []
    trendingHashtagLimit = 0
    numOfHashtags = 0
    dashboardTooltips
    isHashtagsLoading: boolean = false
    private relevantState = computed(() => {
        const state = this.stateService.appState();
        return {
            start: state.start,
            end: state.end,
            countries: state.countries
        };
    }, {
        equal: (a, b) => {
            return a.start === b.start
                && a.end === b.end
                && a.countries === b.countries;
        }
    });

    constructor(
        private stateService: StateService,
        private dataService: DataService
    ) {
        this.trendingHashtagLimit = dataService.trendingHashtagLimit
        this.dashboardTooltips = dashboard

        effect(() => {
            this.requestFromAPI(this.relevantState());
        });
    }

    private requestFromAPI(state: { start: string; end: string; countries: string; }) {
        this.isHashtagsLoading = true;
        // fire trending hashtag API
        this.dataService.getTrendingHashtags({
            start: state.start,
            end: state.end,
            limit: this.dataService.trendingHashtagLimit,
            countries: state.countries
        }).subscribe({
            next: (res: Array<IHashtag>) => {
                // console.log('>>> getTrendingHashtags >>> res = ', res)
                this.isHashtagsLoading = false;
                this.hashtags = res;
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
                    setTimeout(() => enableTooltips(this.tooltips, true), 300)
                }
            },
            error: (err) => {
                console.error('Error while requesting TRending hashtags data  ', err)
            }
        })
    }

    /**
     * Called on click of individual hashtag among the list. Updates the URL to trigger further action
     * @param hashtag
     */
    clickHashtag(hashtag: string) {
        this.stateService.updatePartialState({
            hashtag: hashtag
        })
    }
}
