import {Component, OnInit} from '@angular/core';
import {environment} from "../../environments/environment";

@Component({
    selector: 'status-banner',
    templateUrl: './status-banner.component.html',
    styleUrl: './status-banner.component.css',
    standalone: false
})
export class StatusBannerComponent implements OnInit {
    announcement: string = ""
    show: boolean = false;

    hide(): void {
        this.show = false;
    }

    ngOnInit(): void {
        fetch(`${environment["ohsomeStatsUrl"]}/statuspage`).then(res => res.json()).then(data => {
            if (data["Announce"]) {
                this.announcement = data["Announce"]
                if (this.announcement != "") {
                    this.show = true
                }
            }
        });
    }
}
