import {Component, Input, OnInit} from '@angular/core';

import { Map, View, Feature } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
// import OSM from 'ol/source/OSM';
import Stamen from 'ol/source/Stamen';
import {ICountryStatsData, IPlotData} from '../../data.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @Input() data!: Array<ICountryStatsData>;

  mapView: View | undefined
  map: Map | undefined

  ngOnInit() {
    this.initMap()
  }

  initMap() {
    this.mapView = new View({
      center: fromLonLat([0, 25], 'EPSG:3857'),
      zoom: 1,
      minZoom: 1,
      maxZoom: 7,
      // extent: transformExtent([-180, -80, 180, 80], 'EPSG:4326', 'EPSG:3857'),
      constrainResolution: true,
      showFullExtent: true
    });

    this.map = new Map({
      target: 'ol-map',
      layers: [
        // new TileLayer({
        //   source: new OSM(),
        // })
        new TileLayer({
          source: new Stamen({
            layer: 'toner-lite'
          })
        })
      ],
      view: this.mapView
    });
  }
}
