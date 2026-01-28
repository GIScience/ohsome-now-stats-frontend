import {Component, computed, effect, ElementRef, QueryList, signal, ViewChildren} from '@angular/core';

import {DataService} from '../../../lib/data.service';
import {dashboard} from '../tooltip-data';
import {IHashtag} from "../../../lib/types";
import {StateService} from "../../../lib/state.service";
import {Overlay} from '../../overlay.component';
import {enableTooltips} from "../../../lib/utils";

@Component({
    selector: 'app-trending-hashtags',
    templateUrl: './trending-hashtags.component.html',
    styleUrls: ['./trending-hashtags.component.scss'],
    imports: [Overlay],
})
export class TrendingHashtagsComponent {
    @ViewChildren('tooltip') tooltips!: QueryList<ElementRef>;
    hashtags = signal<IHashtag[]>([]);
    isHashtagsLoading = signal(false);
    trendingHashtagLimit = this.dataService.trendingHashtagLimit;
    numOfHashtags = computed(() => this.hashtags().length);
    dashboardTooltips = dashboard;

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
        effect(() => {
            this.fetchHashtags(this.relevantState());
        });

        effect(() => {
            if (this.hashtags().length) {
                queueMicrotask(() =>
                    enableTooltips(this.tooltips, true)
                );
            }
        });
    }

    private fetchHashtags(state: { start: string; end: string; countries: string; }) {
        this.isHashtagsLoading.set(true);
        this.dataService.getTrendingHashtags({
            start: state.start,
            end: state.end,
            limit: this.dataService.trendingHashtagLimit,
            countries: state.countries
        }).subscribe({
            next: (res: IHashtag[]) => {
                const sorted = res
                    .sort((a, b) => b.number_of_users - a.number_of_users);

                const maxUsers = sorted[0]?.number_of_users ?? 1;

                this.hashtags.set(
                    sorted.map(h => ({
                        ...h,
                        tooltip: `${h.hashtag} with ${h.number_of_users} distinct users`,
                        hashtagTitle:
                            h.hashtag.length > 20
                                ? h.hashtag.substring(0, 19) + '...'
                                : h.hashtag,
                        percent: (h.number_of_users / maxUsers) * 100,
                    }))
                );

                this.isHashtagsLoading.set(false);
            },
            error: err => {
                console.error('Error while requesting trending hashtags data', err);
                this.isHashtagsLoading.set(false);
            }
        });
    }

    clickHashtag(hashtag: string) {
        this.stateService.updatePartialState({
            hashtag: hashtag
        })
    }
}
