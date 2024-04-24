import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'status-banner',
    templateUrl: './status-banner.component.html',
    styleUrl: './status-banner.component.css'
})
export class StatusBannerComponent implements OnInit {
    announcement: string = ""
    show: boolean = false;

    hide(): void {
        this.show = false;
    }

    ngOnInit(): void {
        fetch('https://int-stats.now.ohsome.org/statuspage').then(res => res.json()).then(data => {
            if (data["Announce"]) {
                this.announcement = data["Announce"]
                if (this.announcement != "") {
                    this.show = true
                }
            } else {
                console.log("No announcement in Statuscake available!!!")
            }
        });
    }
}
