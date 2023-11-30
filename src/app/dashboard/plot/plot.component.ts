import { Component, Input, OnChanges, AfterContentInit } from '@angular/core';

import Plotly from 'plotly.js-basic-dist-min';
import { Layout } from 'plotly.js-basic-dist-min';
import { IPlotData, ITopicPlotData } from '../../data.service';
import topicDefinitions from "../../../assets/static/json/topicDefinitions.json"

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.scss']
})
export class PlotComponent implements AfterContentInit, OnChanges {

  @Input() data!: Array<IPlotData>;
  @Input() currentStats!: string;
  @Input() topicPlotData!: any;         // todo: there is no type safety here anymore. Lets try to fix that?
  @Input() selectedTopics: String | undefined;
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
		this.layout = {
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

		};

    Plotly.react('summaryplot', [], this.layout, {responsive: true});

	}

  refreshPlot() {
    const currentDate = new Date()
    const topic_definitions = topicDefinitions as any
    const _data = this.data as any
    if (this.selectedTopics && this.topicPlotData && this.topicPlotData[this.currentStats]){
      if (this.topicPlotData[this.currentStats].length != this.data.length){
        return // topic response usually arrives faster, but only want to update once both requests came through
      }

      for(let i=0; i<this.topicPlotData[this.currentStats].length; i++){
        _data[i][this.currentStats] = this.topicPlotData[this.currentStats][i].value
      }
    }
    const plotData : any = [{
      x: _data.map((e : IPlotData) => `${e.startDate}`),
      y: _data.map((e: any) => e[this.currentStats]),
      customdata: _data.map((e: any) => e[this.currentStats]),
      hovertext: this.data.map((e : IPlotData) => `From ${e.startDate}<br>To ${e.endDate}`),
      hovertemplate: `%{hovertext}<br>${topic_definitions[this.currentStats]["name"]}: %{customdata}<extra></extra>`,
      type: 'bar',
      name: `${topic_definitions[this.currentStats]["name"]}`,
      marker: {
        pattern: {
          // apply stripped pattern only for current running time
          shape: this.data.map((_ : IPlotData) => (currentDate >= new Date(_.startDate) && currentDate <= new Date(_.endDate)) ? '/' : ''),
          size: 7,
          solidity: 0.6
        },
        color: `${topic_definitions[this.currentStats]["color-hex"]}`
      },
    }];
    this.layout.yaxis.title = `${topic_definitions[this.currentStats]["y-title"]}`
    Plotly.react('summaryplot', plotData, this.layout, {responsive: true});
  }
}
