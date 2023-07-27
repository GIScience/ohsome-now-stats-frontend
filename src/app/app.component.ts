import { AfterViewInit, Component, HostListener } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'Dashboard - ohsomeNow Stats';
  name = 'HeiGIT';
  isOpen = false
  activeLink = ''

  constructor(private toastService: ToastService ) {}

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.checkForSmallScreen()
  }

  checkForSmallScreen() {
    if(window.innerWidth - 5 <=460) {
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
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, { trigger: 'hover'}))
  }

  toggleSidebar() {
    // console.log('>>> AppComponent >>> toggleSidebar ')
    this.isOpen = !this.isOpen
    // this.triggerResizeEvent()
    const app = document.querySelector('#sidebar-container')
    if(app){
      if(app.classList.contains('is-collapsed'))
        app.classList.remove('is-collapsed')
      else
        app.classList.add('is-collapsed')
    }
  }

  toggleDropdown(event: Event) {
    event.preventDefault()
    const clickedLink = event.target as HTMLElement
    const parentListItem = clickedLink.parentElement

    if(parentListItem)
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

}
