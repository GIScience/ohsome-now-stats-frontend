import {Component, Input, OnChanges, OnInit} from '@angular/core';

@Component({
  selector: 'app-big-number',
  templateUrl: './big-number.component.html',
  styleUrls: ['./big-number.component.scss']
})
export class BigNumberComponent implements OnInit, OnChanges{
  @Input() name: string | undefined;
  @Input() value: string | undefined;
  @Input() tooltip: string | undefined;
  @Input() icon: string | undefined;
  @Input() color: string | undefined;
  @Input() colorLight: string | undefined;
  @Input() startSelected: boolean | undefined;
  numericValue: number = 0

  ngOnInit() {
    this.numericValue = parseFloat(this.value!!)
  }
  ngOnChanges() {
    this.numericValue = parseFloat(this.value!!)
  }
}