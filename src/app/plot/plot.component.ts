import { Component, Input, OnInit } from '@angular/core';

import Plotly from 'plotly.js-dist-min';
import { Layout } from 'plotly.js-dist-min';

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.scss']
})
export class PlotComponent implements OnInit {

  @Input() data: any;
  layout: Layout | any;

  ngOnInit(): void {
    this.initChart()
    this.drawDummyPlot()
  }

  /**
   * Draws the blank plotly chart. Traces will be added dynamically
   */
	initChart() {
		this.layout =  {
			autosize: true,
			// height: 280,
			yaxis2: { visible: false, range: [0,1], zeroline: false },
			grid: { rows: 1, columns: 1 },
			shapes: [],
			annotations: [],
			margin: { l: 30, r: 20, t: 20, b: 40 },
			legend: { orientation: 'h' }
		};

		// Plotly.newPlot("summaryplot", [], this.layout, {responsive: true});
	}

  drawDummyPlot() {
    let data: any = [
      {
        x: ['2013-10-04 22:23:00', '2013-11-04 22:23:00', '2013-12-04 22:23:00'],
        y: [1, 3, 6],
        type: 'scatter'
      }
    ];
    
    Plotly.newPlot('summaryplot', data, this.layout, {responsive: true});
  }
}
