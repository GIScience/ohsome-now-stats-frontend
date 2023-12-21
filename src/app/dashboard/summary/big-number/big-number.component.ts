import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-big-number',
  templateUrl: './big-number.component.html',
  styleUrls: ['./big-number.component.scss']
})
export class BigNumberComponent {
  @Input() name: string | undefined;
  @Input() value: string | undefined;
  @Input() tooltip: string | undefined;
  @Input() icon: string | undefined;
  @Input() color: string | undefined;
  @Input() colorLight: string | undefined;
  @Input() startSelected: boolean | undefined;
}