import {AfterViewInit, Component, HostListener} from '@angular/core';
import * as bootstrap from 'bootstrap';
import {ToastService} from './toast.service';
import {DataService} from "./data.service";
import {Router} from "@angular/router";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit {
    title = 'ohsomeNow Stats';
    name = 'HeiGIT';
    isOpen = false
    activeLink = ''
    live: boolean = false

    constructor(private toastService: ToastService,
                private dataService: DataService,
                private router: Router) {
        this.dataService.liveMode.subscribe(mode => {
            this.live = mode
        })
    }

    @HostListener('window:resize', ['$event'])
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
            this.checkForSmallScreen()
        }, 1000);

        // enble tooltip
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {trigger: 'hover'}))


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

    toggleDropdown(event: Event) {
        event.preventDefault()
        const clickedLink = event.target as HTMLElement
        const parentListItem = clickedLink.parentElement

        if (parentListItem)
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

    /**
     * Redirects to HOT view
     * Maintains the parameter the user selected in the QueryComponent except the Hastag as that
     * defaults to "hotosm-project-*"
     * Gets the fragment values directly from the
     */
    redirectTo(pageName: string) {
        const fragmentData = this.dataService.getQueryParamsFromFragments()
        if(pageName == "dashboard") {
            let fragment = `hashtag=${fragmentData.hashtag}&start=${fragmentData.start}&end=${fragmentData.end}&interval=${fragmentData.interval}&countries=${fragmentData.countries}&topics=${fragmentData.topics}`
            if (fragmentData.fit_to_content !== undefined) {
                fragment += "&fit_to_content="
            }
            this.router.navigate(['/dashboard'], {fragment: fragment});
        } else if(pageName == "hotosm") {
            let fragment = `start=${fragmentData.start}&end=${fragmentData.end}&interval=${fragmentData.interval}`
            if (fragmentData.fit_to_content !== undefined) {
                fragment += "&fit_to_content="
            }
            this.router.navigate(['/dashboard/hotosm'], {fragment: fragment});
        }
    }
}
