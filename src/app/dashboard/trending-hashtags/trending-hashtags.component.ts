import { Component, Input, OnChanges } from '@angular/core';
import { DataService, IHashtag, IQueryParam, ITrendingHashtags } from '../../data.service';

@Component({
  selector: 'app-trending-hashtags',
  templateUrl: './trending-hashtags.component.html',
  styleUrls: ['./trending-hashtags.component.scss']
})
export class TrendingHashtagsComponent implements OnChanges {
  
  @Input() hashtags!: Array<IHashtag> | [] | undefined
  trendingHashtagLimit: number = 0
  numOfHashtags: number = 0

  constructor(dataService: DataService) {
    this.trendingHashtagLimit = dataService.trendingHashtagLimit
  }

  ngOnChanges(): void {
    if(this.hashtags){
      this.numOfHashtags = this.hashtags ? this.hashtags.length : this.trendingHashtagLimit
      // arange the hashtags in desc order
      this.hashtags.sort((a, b) => b.number_of_users - a.number_of_users)
    }    
  }
  
}
