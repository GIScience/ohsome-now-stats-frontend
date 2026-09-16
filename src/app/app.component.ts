import {
    AfterViewInit,
    Component,
    ElementRef,
    inject,
    QueryList,
    signal,
    ViewChildren
} from '@angular/core';
import {DataService} from "../lib/data.service";
import {StateService} from "../lib/state.service";
import packageJson from '../../package.json';
import {enableTooltips} from "../lib/utils";
import {StatusBannerComponent} from "./status-banner/status-banner.component";
import {ToastComponent} from "./toast/toast.component";
import {NgClass} from "@angular/common";
import {RouterLink, RouterOutlet} from "@angular/router";
import {AuthService} from "../lib/auth.service";
import {NzIconModule} from "ng-zorro-antd/icon";
import {NzButtonModule} from "ng-zorro-antd/button";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [StatusBannerComponent, ToastComponent, NgClass, RouterOutlet, RouterLink, NzButtonModule, NzIconModule],
    standalone: true
})
export class AppComponent implements AfterViewInit {
    @ViewChildren('tooltip') tooltips!: QueryList<ElementRef>;
    stateService = inject(StateService);
    private dataService = inject(DataService);
    protected authService = inject(AuthService);

    title = 'ohsomeNow'
    name = 'HeiGIT'
    isOpen = false
    live = signal<boolean>(false)
    page: string = ''
    protected readonly appVersion: string = packageJson.version
    protected currentYear: string = new Date().getFullYear().toString()

    constructor() {
        this.dataService.liveMode.subscribe(mode => {
            this.live.set(mode)
        })
        this.stateService.activePage.subscribe(page => {
            this.page = page!.split('?')[0]
        })
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            enableTooltips(this.tooltips, true)
        }, 300)
    }

    toggleSidebar() {
        this.isOpen = !this.isOpen
        const app = document.querySelector('#sidebar-container')
        if (app) {
            if (app.classList.contains('is-collapsed'))
                app.classList.remove('is-collapsed')
            else
                app.classList.add('is-collapsed')
        }
    }
}
