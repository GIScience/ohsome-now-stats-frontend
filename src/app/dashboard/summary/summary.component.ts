import { Component, Input, OnInit } from '@angular/core';
import { DataService, ISummaryData } from '../../data.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() data: any;

  contributors!: string
  edits!: string
  buidlingEdits!: string
  kmOfRoads!: string

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    
    this.dataService.getSummary().subscribe( (data: ISummaryData | null) => {

      if(data === null)
        return

      // console.log('>>> SummaryComponent >>> data = ', data);  
      this.contributors = new Intl.NumberFormat('en-US').format(data.contributors)
      this.buidlingEdits = new Intl.NumberFormat('en-US').format(data.buildingEdits)
      this.edits = new Intl.NumberFormat('en-US').format(data.edits)
      this.kmOfRoads = new Intl.NumberFormat('en-US', { 
          style: "unit",
          unit: "kilometer", 
          maximumFractionDigits: 0
         }
        ).format(data.kmOfRoads)

    });
  }
}
