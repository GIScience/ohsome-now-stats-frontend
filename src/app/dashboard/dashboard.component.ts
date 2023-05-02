import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import Masonry from 'masonry-layout';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit{

  title = 'ohsome-contribution-stats';
  isOpen = false;
  activeLink = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router  ) {}

  ngOnInit() {
    this.initMasonry()
    // this.addResizeWindowEvent()
    // const startDate = this.route.snapshot.paramMap.get('id');
    // this.route.fragment.subscribe((fragment: string | null) => {
    //   console.log("My hash fragment is here => ", fragment)
    // })
    console.log('startDate = ', this.route.snapshot.params)
  }

  toggleSidebar() {
    console.log('>>> AppComponent >>> toggleSidebar ')
    this.isOpen = !this.isOpen;
    // this.triggerResizeEvent();
    const app = document.querySelector('.app')
    if(app){
      if(app.classList.contains('is-collapsed')) 
        app.classList.remove('is-collapsed');
      else
        app.classList.add('is-collapsed');
    }
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    const clickedLink = event.target as HTMLElement;
    const parentListItem = clickedLink.parentElement;

    if(parentListItem)
    if (parentListItem.classList.contains('open')) {
      parentListItem.classList.remove('open');
    } else {
      const openLinks = document.querySelectorAll('.sidebar .sidebar-menu li.open');
      openLinks.forEach((openLink) => {
        openLink.classList.remove('open');
      });
    
      parentListItem.classList.add('open');
    }

  }

  initMasonry() {
    if(document.querySelectorAll('.masonry').length > 0) {
      new Masonry('.masonry', {
        itemSelector: '.masonry-item',
        columnWidth: '.masonry-sizer',
        percentPosition: true,
      });
    }
  }

  addResizeWindowEvent() {
    // ------------------------------------------------------
    // @Window Resize
    // ------------------------------------------------------

    /**
     * NOTE: Register resize event for Masonry layout
     */
    const EVENT = new CustomEvent('UIEvents', {
      detail: {},
      bubbles: true,
      cancelable: true,
      composed: false,
    });
    // window.Event = EVENT;
    // CustomEvent.initCustomEvent('resize', true, false, window, 0);


    window.addEventListener('load', () => {
      /**
       * Trigger window resize event after page load
       * for recalculation of masonry layout.
       */
      window.dispatchEvent(EVENT);
    });
  }
}
