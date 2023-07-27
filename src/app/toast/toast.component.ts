import { Component } from '@angular/core';
import * as bootstrap from 'bootstrap';

import { IToastUI, ToastService } from '../toast.service';
import { ToastTypes } from './toasttypes.modal';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  toastVisible: boolean = false
  // toastTypes: typeof ToastTypes = ToastTypes
  title: string | undefined
  body: string | undefined
  type: string | undefined
  time: number | undefined

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.showToast$.subscribe((param: IToastUI | null) => {
      if(! param)
        return
        
      // console.log('>>> ToastComponent >>> showToast$.subscribe ', param, ToastTypes, ToastTypes[param.type as keyof typeof ToastTypes])
      this.title = param.title
      this.body = param.body
      this.type = ToastTypes[param.type as keyof typeof ToastTypes]
      this.time = param.time

      this.showToast()
    })
  }

  showToast() {
    const toastLiveExample = document.getElementById('liveToast')
    if(toastLiveExample){
      const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
      toastBootstrap.show()
      this.toastVisible = true
    }
    // set auto disappearing only if provided by the caller
    if(this.time ){
      setTimeout(() => {
        this.hideToast()
      }, this.time) 
    }
  }

  hideToast() {
    this.toastVisible = false
    const toastLiveExample = document.getElementById('liveToast')
    if(toastLiveExample){
      const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
      toastBootstrap.hide()
    }
  }
}
