import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {environment} from "../../environments/environment";

@Component({
    selector: 'status-banner',
    templateUrl: './status-banner.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './status-banner.component.css'
})
export class StatusBannerComponent implements OnInit {
    announcement: string = ""
    show: boolean = false;

    hide(): void {
        this.show = false;
    }

    ngOnInit(): void {
        fetch(`${environment["ohsomeNowUrl"]}/statuspage`).then(res => res.json()).then(data => {
            if (data["Announce"]) {
                this.announcement = data["Announce"]
                if (this.announcement != "") {
                    this.show = true
                }
            }
        });
    }
}
