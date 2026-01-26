import {AfterViewInit, Component, ElementRef, HostListener, QueryList, ViewChildren} from '@angular/core';
import {ToastService} from './toast.service';
import {DataService} from "./data.service";
import {StateService} from "./state.service";
import packageJson from '../../package.json';
import {enableTooltips} from "./utils";
import {StatusBannerComponent} from "./status-banner/status-banner.component";
import {ToastComponent} from "./toast/toast.component";
import {NgClass} from "@angular/common";
import {RouterLink, RouterOutlet} from "@angular/router";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [StatusBannerComponent, ToastComponent, NgClass, RouterOutlet, RouterLink],
    standalone: true
})
export class AppComponent implements AfterViewInit {
    @ViewChildren('tooltip') tooltips!: QueryList<ElementRef>;
    title = 'ohsomeNow Stats'
    name = 'HeiGIT';
    isOpen = false
    live: boolean = false
    page: string = ''
    protected readonly appVersion: string = packageJson.version
    protected currentYear: string = new Date().getFullYear().toString()

    constructor(private toastService: ToastService,
                private dataService: DataService,
                stateService: StateService,
    ) {
        this.dataService.liveMode.subscribe(mode => {
            this.live = mode
        })
        stateService.activePage.subscribe(page => {
            this.page = page!.split('?')[0]
        })
    }

    @HostListener('window:resize')
    onWindowResize() {
        this.checkForSmallScreen()
        this.tryCollapseMenuOnBiggerScreens()
    }

    tryCollapseMenuOnBiggerScreens() {
        if (window.innerWidth >= 992) {
            document.querySelector('#sidebar-container')?.classList.add("is-collapsed")
        }
    }

    checkForSmallScreen() {
        if (window.innerWidth - 5 <= 460) {
            this.toastService.show({
                title: 'Viewing on Mobile',
                body: 'ohsomeNow Stats is suitable for tablets and computers. It\'s not yet optimized for smaller screens, we invite you to visit this website on a larger screen.',
                type: 'warning'
            })
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.checkForSmallScreen();
        }, 1000);
        setTimeout(() => {
            enableTooltips(this.tooltips, true)
        }, 300)
    }

    toggleSidebar() {
        // console.log('>>> AppComponent >>> toggleSidebar ')
        this.isOpen = !this.isOpen
        // this.triggerResizeEvent()
        const app = document.querySelector('#sidebar-container')
        if (app) {
            if (app.classList.contains('is-collapsed'))
                app.classList.remove('is-collapsed')
            else
                app.classList.add('is-collapsed')
        }
    }

}
