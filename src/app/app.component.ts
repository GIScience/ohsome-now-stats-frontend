import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    inject,
    OnInit,
    QueryList,
    ViewChildren
} from '@angular/core';
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
    stateService = inject(StateService);
    // private router: Router = inject(Router);
    // private route: ActivatedRoute = inject(ActivatedRoute);
    private toastService: ToastService = inject(ToastService);
    private dataService: DataService = inject(DataService);

    title = 'ohsomeNow Stats'
    name = 'HeiGIT'
    isOpen = false
    live: boolean = false
    page: string = ''
    isLoggedIn: boolean = false;
    protected readonly appVersion: string = packageJson.version
    protected currentYear: string = new Date().getFullYear().toString()


    constructor() {
        this.dataService.liveMode.subscribe(mode => {
            this.live = mode
        })
        this.stateService.activePage.subscribe(page => {
            this.page = page!.split('?')[0]
        })
    }

    @HostListener('window:resize')
    onWindowResize() {
        this.checkForSmallScreen()
        this.tryCollapseMenuOnBiggerScreens()
    }

    // async ngOnInit() {
    //     // Check if user is already logged in by checking for auth cookie
    //     // this.checkLoginStatus();
    //     await this.appwriteService.tryToLogin()
    // }

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

    // checkLoginStatus(): void {
    //     const authToken = this.stateService.getCookie('authToken');
    //     this.isLoggedIn = !!authToken;
    // }
    //
    // async onLogin() {
    //     // const currentUrl = window.location.href;
    //     // window.location.href = `https://account.heigit.org/login?redirect=${encodeURIComponent(currentUrl)}`;
    //     await this.appwriteService.tryToLogin()
    // }
    //
    // handleLoginCallback(token: string): void {
    //     // Set the auth token cookie (expires in 7 days)
    //     this.stateService.setCookie('authToken', token, 7);
    //     this.isLoggedIn = true;
    //
    // }
    //
    // onSignOut(): void {
    //     // Delete the auth cookie
    //     this.stateService.deleteCookie('authToken');
    //     this.isLoggedIn = false;
    //
    //     // this.router.navigate(['/']);
    // }
    //
    //
    // onSignup() {
    //     const currentUrl = window.location.href;
    //     window.location.href = `https://account.heigit.org/signup?redirect=${encodeURIComponent(currentUrl)}`;
    // }
}
