import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Dashboard - ohsome Contribution Statistics';
  name = 'HeiGIT';

  isOpen = false
  activeLink = ''

  constructor() {}

  toggleSidebar() {
    console.log('>>> AppComponent >>> toggleSidebar ')
    this.isOpen = !this.isOpen
    // this.triggerResizeEvent()
    const app = document.querySelector('.app')
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
