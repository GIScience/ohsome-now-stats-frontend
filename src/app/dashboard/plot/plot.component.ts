import { Component, Input, OnChanges, AfterContentInit } from '@angular/core';

import Plotly from 'plotly.js-basic-dist-min';
import { Layout } from 'plotly.js-basic-dist-min';
import { IPlotData } from '../../data.service';

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.scss']
})
export class PlotComponent implements AfterContentInit, OnChanges {

  @Input() data!: Array<IPlotData>;
  @Input() currentStats!: string;
  layout: Layout | any;

  content: any = {"users": 0, "edits": 1, "buildings": 2, "roads": 3}

  ngAfterContentInit(): void {
    this.initChart();

    if(this.data){
      this.refreshPlot();
    }
  }

  ngOnChanges(): void {
    if(this.data)
      this.refreshPlot();
  }

  /**
   * Draws the blank plotly chart. Traces will be added dynamically
   */
	initChart() {
		this.layout =  {
			autosize: true,
			height: 350,
			grid: { rows: 1, columns: 1 },
			shapes: [],
			annotations: [],
			margin: { l: 50, r: 20, t: 20, b: 40 },
			legend: { orientation: 'h' },
      barmode: 'group',
      font: {
        family: 'Roboto, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
      },
      yaxis: {
        title: "# of contributors"
      }
		};

    Plotly.react('summaryplot', [], this.layout, {responsive: true});

	}

  refreshPlot() {
    const currentDate = new Date()

    const plotData : any = [{
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['users']),
      customdata: this.data.map((e : any) => e.users),
      hovertext: this.data.map((e : any) => `From ${e.startdate}<br>To ${e.enddate}`),
      hovertemplate: `%{hovertext}<br>Contributors: %{customdata}<extra></extra>`,
      type: 'bar',
      name: 'Contributors',
      marker: {
        pattern: {
          // apply stripped pattern only for current running time
          shape: this.data.map((_ : any, idx: number) => (currentDate >= new Date(_.startdate) && currentDate <= new Date(_.enddate)) ? '/' : ''),
          size: 7,
          solidity: 0.6
        },
        color: '#4caf50'
      },
      ytitle: "# of contributors",
      visible: this.currentStats === 'users' ? true : false // set true only when summary value is clicked on it
    }, {
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['edits']),
      customdata: this.data.map((e : any) => e.edits),
      hovertext: this.data.map((e : any) => `From ${e.startdate}<br>To ${e.enddate}`),
      hovertemplate: `%{hovertext}<br>Total Edits: %{customdata}<extra></extra>`,
      type: 'bar',
      name: 'Total Edits',
      marker: {
        pattern: {
          shape: this.data.map((_ : any, idx: number) => (currentDate >= new Date(_.startdate) && currentDate <= new Date(_.enddate)) ? '/' : ''),
          size: 7,
          solidity: 0.6
        },
        color: '#f44336'
      },
      yaxis: 'y',
      ytitle: "# of total edits",
      visible: this.currentStats === 'edits' ? true : false // set true only when summary value is clicked on it
    }, {
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['buildings']),
      customdata: this.data.map((e : any) => e.buildings),
      hovertext: this.data.map((e : any) => `From ${e.startdate}<br>To ${e.enddate}`),
      hovertemplate: `%{hovertext}<br>Buildings Added: %{customdata}<extra></extra>`,
      type: 'bar',
      name: 'Buildings Added',
      marker: {
        pattern: {
          shape: this.data.map((_ : any, idx: number) => (currentDate >= new Date(_.startdate) && currentDate <= new Date(_.enddate)) ? '/' : ''),
          size: 7,
          solidity: 0.6
        },
        color: '#9c27b0'
      },
      yaxis: 'y',
      visible: this.currentStats === 'buildings' ? true : false, // set true only when summary value is clicked on it
      ytitle: "# of buildings added"
    }, {
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['roads']),
      customdata: this.data.map((e : any) => Math.round(e.roads)),
      hovertext: this.data.map((e : any) => `From ${e.startdate}<br>To ${e.enddate}`),
      hovertemplate: `%{hovertext}<br>Road Edits: %{customdata} km<extra></extra> `,
      type: 'bar',
      name: 'Road Edits',
      marker: {
        pattern: {
          shape: this.data.map((_ : any, idx: number) => (currentDate >= new Date(_.startdate) && currentDate <= new Date(_.enddate)) ? '/' : ''),
          size: 7,
          solidity: 0.6
        },
        color: '#2196f3'
      },
      yaxis: 'y',
      ytitle: "km of roads added",
      visible: this.currentStats === 'roads' ? true : false // set true only when summary value is clicked on it
    }];
    this.layout.yaxis.title = plotData[this.content[this.currentStats]].ytitle
    Plotly.react('summaryplot', plotData, this.layout, {responsive: true});
    // Plotly.addTraces('summaryplot', plotData);
  }
}

interface PlotHTMLElement extends HTMLElement  {
  on(eventName: string, handler: Function): void
}