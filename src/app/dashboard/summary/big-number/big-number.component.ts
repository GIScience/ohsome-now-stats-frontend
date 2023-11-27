import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-big-number',
  templateUrl: './big-number.component.html',
  styleUrls: ['./big-number.component.scss']
})
export class BigNumberComponent {
  @Input() name: String | undefined;
  @Input() value: String | undefined;
  @Input() tooltip: String | undefined;
  @Input() icon: String | undefined;
  @Input() color: String | undefined;
  @Input() startSelected: boolean | undefined;
}