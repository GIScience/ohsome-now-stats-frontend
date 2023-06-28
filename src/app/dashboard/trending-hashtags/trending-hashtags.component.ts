import { Component } from '@angular/core';
import { DataService, ITrendingHashtags } from '../../data.service';

@Component({
  selector: 'app-trending-hashtags',
  templateUrl: './trending-hashtags.component.html',
  styleUrls: ['./trending-hashtags.component.scss']
})
export class TrendingHashtagsComponent {
  
  trendingHashtagLimit: number
  hashtags: Array<any> = [ 
    'missingmaps',
    'mapwithai',
    'redcross',
    'indonesia',
    'msf',
    'opencitieslac',
    'climatechange',
    'covid19'
  ]

  constructor(private dataService: DataService) {
    this.trendingHashtagLimit = dataService.trendingHashtagLimit
  }
}
