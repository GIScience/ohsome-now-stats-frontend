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
  layout: Layout | any;

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
			height: 450,
			yaxis: { visible: false },
			yaxis2: { visible: false },
			grid: { rows: 1, columns: 1 },
			shapes: [],
			annotations: [],
			margin: { l: 30, r: 20, t: 20, b: 40 },
			legend: { orientation: 'h' },
      barmode: 'group',
      font: {
        family: 'Roboto, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
      }
		};

    Plotly.react('summaryplot', [], this.layout, {responsive: true});

    const plotDiv: PlotHTMLElement = document.getElementById('summaryplot') as PlotHTMLElement
    if(plotDiv)
      plotDiv.on('plotly_legendclick', (event: any) => {
        const tempData: Array<any> = (event.data as Array<any>).map( (d: any, idx: number) => (idx === event.expandedIndex) ? d.visible = true : d.visible = 'legendonly')
      })

	}

  refreshPlot() {
    const maxValues = {
      users: -Infinity,
      edits: -Infinity,
      buildings: -Infinity,
      roads: -Infinity
    }
    const currentDate = new Date()
    
    this.data.forEach((e : any) => {
      if (e['users'] > maxValues.users) maxValues.users = e['users'];
      if (e['edits'] > maxValues.edits) maxValues.edits = e['edits'];
      if (e['buildings'] > maxValues.buildings) maxValues.buildings = e['buildings'];
      if (e['roads'] > maxValues.roads) maxValues.roads = e['roads'];
    });

    const plotData : any = [{
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['users'] / maxValues.users),
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
      yaxis: 'y',
      visible: true // set only contribution as visible
    }, {
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['edits'] / maxValues.edits),
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
      visible: 'legendonly' // other bars can be set visible by user click on the legend
    }, {
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['buildings'] / maxValues.buildings),
      customdata: this.data.map((e : any) => e.buildings),
      hovertext: this.data.map((e : any) => `From ${e.startdate}<br>To ${e.enddate}`),
      hovertemplate: `%{hovertext}<br>Building Edits: %{customdata}<extra></extra>`,
      type: 'bar',
      name: 'Building Edits',
      marker: {
        pattern: {
          shape: this.data.map((_ : any, idx: number) => (currentDate >= new Date(_.startdate) && currentDate <= new Date(_.enddate)) ? '/' : ''),
          size: 7,
          solidity: 0.6
        },
        color: '#9c27b0'
      },
      yaxis: 'y',
      visible: 'legendonly' // other bars can be set visible by user click on the legend
    }, {
      x: this.data.map((e : any) => `${e.startdate}`),
      y: this.data.map((e : any) => e['roads'] / maxValues.roads),
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
      visible: 'legendonly' // other bars can be set visible by user click on the legend
    }];
    
    Plotly.react('summaryplot', plotData, this.layout, {responsive: true});
    // Plotly.addTraces('summaryplot', plotData);
  }
}

interface PlotHTMLElement extends HTMLElement  {
  on(eventName: string, handler: Function): void
}