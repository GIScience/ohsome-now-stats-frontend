import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private showToastSource = new BehaviorSubject<IToastUI | null>(null)
  showToast$ = this.showToastSource.asObservable()

  show(param: IToastUI) {
    this.showToastSource.next(param)
  }
}

export interface IToastUI {
  title: string,
  body: string,
  type: string,
  time?: number // number of milliseconds toast should stay on screen
}
