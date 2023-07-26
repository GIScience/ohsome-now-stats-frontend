import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild
} from '@angular/core';

import {Map, View} from 'ol';
import {ICountryStatsData} from '../../data.service';
import Plotly, {Data} from 'plotly.js-geo-dist';
import {Config} from 'plotly.js-basic-dist-min';
import {StatsType} from '../types';

export interface ICountryStatsDataAsArrays {
    country: string[],
    users: number[],
    roads: number[],
    buildings: number[],
    edits: number[],
    latest: string[]
}

// Purples from d3-scale-chromatic at https://observablehq.com/@d3/color-schemes
const Purples = ["#fcfbfd", "#fcfbfd", "#fbfafc", "#fbfafc", "#faf9fc", "#faf9fc", "#faf8fb", "#f9f8fb", "#f9f7fb", "#f8f7fb", "#f8f7fa", "#f7f6fa", "#f7f6fa", "#f7f5fa", "#f6f5f9", "#f6f4f9", "#f5f4f9", "#f5f3f9", "#f4f3f8", "#f4f2f8", "#f4f2f8", "#f3f2f8", "#f3f1f7", "#f2f1f7", "#f2f0f7", "#f1f0f7", "#f1eff6", "#f0eff6", "#f0eef6", "#efeef5", "#efedf5", "#eeedf5", "#eeecf5", "#edecf4", "#edebf4", "#ecebf4", "#ebeaf3", "#ebe9f3", "#eae9f3", "#eae8f3", "#e9e8f2", "#e8e7f2", "#e8e7f2", "#e7e6f1", "#e7e5f1", "#e6e5f1", "#e5e4f0", "#e5e4f0", "#e4e3f0", "#e3e2ef", "#e3e2ef", "#e2e1ef", "#e1e1ee", "#e1e0ee", "#e0dfee", "#dfdfed", "#dedeed", "#dedded", "#ddddec", "#dcdcec", "#dbdbec", "#dbdaeb", "#dadaeb", "#d9d9ea", "#d8d8ea", "#d7d7ea", "#d7d7e9", "#d6d6e9", "#d5d5e8", "#d4d4e8", "#d3d3e8", "#d2d3e7", "#d2d2e7", "#d1d1e6", "#d0d0e6", "#cfcfe5", "#cecee5", "#cdcee5", "#cccde4", "#cbcce4", "#cbcbe3", "#cacae3", "#c9c9e2", "#c8c8e2", "#c7c7e1", "#c6c6e1", "#c5c5e0", "#c4c4e0", "#c3c3df", "#c2c3df", "#c1c2de", "#c0c1de", "#bfc0dd", "#bebfdd", "#bebedc", "#bdbddc", "#bcbcdb", "#bbbbda", "#babada", "#b9b9d9", "#b8b8d9", "#b7b7d8", "#b6b5d8", "#b5b4d7", "#b4b3d6", "#b3b2d6", "#b2b1d5", "#b1b0d5", "#b0afd4", "#afaed4", "#aeadd3", "#aeacd2", "#adabd2", "#acaad1", "#aba9d1", "#aaa8d0", "#a9a7cf", "#a8a6cf", "#a7a5ce", "#a6a4ce", "#a5a3cd", "#a4a2cd", "#a3a1cc", "#a2a0cb", "#a19fcb", "#a09eca", "#9f9dca", "#9e9cc9", "#9e9ac9", "#9d9ac8", "#9c99c8", "#9b98c7", "#9a97c7", "#9996c6", "#9895c6", "#9794c5", "#9693c5", "#9592c4", "#9491c4", "#9390c3", "#928fc3", "#918ec2", "#908dc2", "#908cc1", "#8f8bc1", "#8e8ac0", "#8d89c0", "#8c88bf", "#8b87bf", "#8a86be", "#8985be", "#8884bd", "#8883bd", "#8782bc", "#8680bc", "#857fbb", "#847eba", "#837dba", "#827cb9", "#827bb9", "#817ab8", "#8079b8", "#7f77b7", "#7e76b6", "#7e75b6", "#7d74b5", "#7c73b4", "#7b71b4", "#7b70b3", "#7a6fb3", "#796eb2", "#786cb1", "#786bb1", "#776ab0", "#7668af", "#7567af", "#7566ae", "#7465ad", "#7363ad", "#7362ac", "#7261ab", "#715fab", "#705eaa", "#705ca9", "#6f5ba8", "#6e5aa8", "#6e58a7", "#6d57a6", "#6c56a6", "#6c54a5", "#6b53a4", "#6a52a4", "#6950a3", "#694fa2", "#684ea2", "#674ca1", "#674ba0", "#664aa0", "#65489f", "#65479e", "#64469e", "#63449d", "#63439c", "#62429c", "#61409b", "#613f9a", "#603e9a", "#5f3c99", "#5e3b99", "#5e3a98", "#5d3897", "#5c3797", "#5c3696", "#5b3595", "#5a3395", "#5a3294", "#593194", "#582f93", "#582e92", "#572d92", "#562b91", "#562a91", "#552990", "#54288f", "#54268f", "#53258e", "#52248e", "#52238d", "#51218c", "#50208c", "#501f8b", "#4f1e8b", "#4e1c8a", "#4e1b8a", "#4d1a89", "#4c1988", "#4c1788", "#4b1687", "#4a1587", "#4a1486", "#491286", "#481185", "#481084", "#470f84", "#460d83", "#460c83", "#450b82", "#440a82", "#440981", "#430780", "#420680", "#42057f", "#41047f", "#40027e", "#40017e", "#3f007d"]
    .reverse().map((value, index) => [index / 255, value]);
const Reds = ["#fff5f0","#fff4ef","#fff4ee","#fff3ed","#fff2ec","#fff2eb","#fff1ea","#fff0e9","#fff0e8","#ffefe7","#ffeee6","#ffeee6","#ffede5","#ffece4","#ffece3","#ffebe2","#feeae1","#fee9e0","#fee9de","#fee8dd","#fee7dc","#fee6db","#fee6da","#fee5d9","#fee4d8","#fee3d7","#fee2d6","#fee2d5","#fee1d4","#fee0d2","#fedfd1","#feded0","#feddcf","#fedccd","#fedbcc","#fedacb","#fed9ca","#fed8c8","#fed7c7","#fdd6c6","#fdd5c4","#fdd4c3","#fdd3c1","#fdd2c0","#fdd1bf","#fdd0bd","#fdcfbc","#fdceba","#fdcdb9","#fdccb7","#fdcbb6","#fdc9b4","#fdc8b3","#fdc7b2","#fdc6b0","#fdc5af","#fdc4ad","#fdc2ac","#fdc1aa","#fdc0a8","#fcbfa7","#fcbea5","#fcbca4","#fcbba2","#fcbaa1","#fcb99f","#fcb89e","#fcb69c","#fcb59b","#fcb499","#fcb398","#fcb196","#fcb095","#fcaf94","#fcae92","#fcac91","#fcab8f","#fcaa8e","#fca98c","#fca78b","#fca689","#fca588","#fca486","#fca285","#fca183","#fca082","#fc9e81","#fc9d7f","#fc9c7e","#fc9b7c","#fc997b","#fc987a","#fc9778","#fc9677","#fc9475","#fc9374","#fc9273","#fc9071","#fc8f70","#fc8e6f","#fc8d6d","#fc8b6c","#fc8a6b","#fc8969","#fc8868","#fc8667","#fc8565","#fc8464","#fb8263","#fb8162","#fb8060","#fb7f5f","#fb7d5e","#fb7c5d","#fb7b5b","#fb795a","#fb7859","#fb7758","#fb7657","#fb7455","#fa7354","#fa7253","#fa7052","#fa6f51","#fa6e50","#fa6c4e","#f96b4d","#f96a4c","#f9684b","#f9674a","#f96549","#f86448","#f86347","#f86146","#f86045","#f75e44","#f75d43","#f75c42","#f65a41","#f65940","#f6573f","#f5563e","#f5553d","#f4533c","#f4523b","#f4503a","#f34f39","#f34e38","#f24c37","#f24b37","#f14936","#f14835","#f04734","#ef4533","#ef4433","#ee4332","#ed4131","#ed4030","#ec3f2f","#eb3d2f","#eb3c2e","#ea3b2d","#e93a2d","#e8382c","#e7372b","#e6362b","#e6352a","#e5342a","#e43229","#e33128","#e23028","#e12f27","#e02e27","#df2d26","#de2c26","#dd2b25","#dc2a25","#db2924","#da2824","#d92723","#d72623","#d62522","#d52422","#d42321","#d32221","#d22121","#d12020","#d01f20","#ce1f1f","#cd1e1f","#cc1d1f","#cb1d1e","#ca1c1e","#c91b1e","#c71b1d","#c61a1d","#c5191d","#c4191c","#c3181c","#c2181c","#c0171b","#bf171b","#be161b","#bd161a","#bb151a","#ba151a","#b91419","#b81419","#b61419","#b51319","#b41318","#b21218","#b11218","#b01218","#ae1117","#ad1117","#ac1117","#aa1017","#a91016","#a71016","#a60f16","#a40f16","#a30e15","#a10e15","#a00e15","#9e0d15","#9c0d14","#9b0c14","#990c14","#970c14","#960b13","#940b13","#920a13","#900a13","#8f0a12","#8d0912","#8b0912","#890812","#870811","#860711","#840711","#820711","#800610","#7e0610","#7c0510","#7a0510","#78040f","#76040f","#75030f","#73030f","#71020e","#6f020e","#6d010e","#6b010e","#69000d","#67000d"]
    .reverse().map((value, index) => [index / 255, value]);

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class MapComponent implements OnChanges {

    @Input() data!: Array<ICountryStatsData>;
    @Input() currentStats!: StatsType;
    @ViewChild('d3Map') d3MapElement: ElementRef | undefined;

    mapView: View | undefined
    map: Map | undefined

    ngOnChanges(changes: SimpleChanges): void {
        if (this.data && this.currentStats) {
            this.initPlotlyMap({
                countryStatsArrays: this.getSortedStatsFromData(this.data, this.currentStats),
                stats: this.currentStats
            });
        }
    }

    getSortedStatsFromData(data: ICountryStatsData[], stats: StatsType): Partial<ICountryStatsDataAsArrays> {
        return data.sort((a, b) => b[stats] - a[stats])
            .reduce<Partial<ICountryStatsDataAsArrays> & { country: string[] }>((previousValue, currentValue) => {
                previousValue.country.push(currentValue.country);
                previousValue[stats]?.push(currentValue[stats]);
                return previousValue;
            }, {
                country: [],
                [stats]: []
            })
    }

    initPlotlyMap({countryStatsArrays, stats}: {
        countryStatsArrays: Partial<ICountryStatsDataAsArrays>;
        stats: StatsType
    }) {

        // some color schemes are built-in in plotly others have to be user-defined
        const colorscaleMap = {
            users: 'Greens',
            edits: Reds,
            buildings: Purples,
            roads: 'Blues'
        }

        // @ts-ignore
        const plotData: Data[] = [{
            type: 'scattergeo',
            mode: 'markers',
            // @ts-ignore
            geo: 'geo',
            locationmode: 'ISO-3',
            // locations: ['FRA', 'DEU', 'RUS', 'ESP'],
            hoverinfo: 'location+text',
            hovertext: countryStatsArrays[stats],
            locations: countryStatsArrays.country,
            customdata: countryStatsArrays[stats],
            marker: {
                size: countryStatsArrays[stats],
                color: countryStatsArrays[stats],
                // @ts-ignore
                cmin: Math.min(...countryStatsArrays[stats]),
                // @ts-ignore
                cmax: Math.max(...countryStatsArrays[stats]),
                sizemode: 'area',
                sizemin: 2,
                // sizeref formula from https://stackoverflow.com/a/57422764
                sizeref: Math.max(...countryStatsArrays[stats]) / 60 ** 2,
                colorscale: colorscaleMap[stats],//'Greens',
                reversescale: false,
                line: {
                    color: 'black'
                }
            },
            name: 'europe data'
        }];

        const layout = {
            margin: {
                t: 0, l: 0, b: 0, r: 0
            },
            autosize: true,
            geo: {
                scope: 'world',
                resolution: 110, // 50 => ca 1:50 Mio.
                showcountries: true,
                showland: true,
                landcolor: "#e5e5e5",
                showocean: true,
                oceancolor: '#f5f5f5',
                showframe: true,
                projection: {
                    type: 'robinson'
                }
            }
        };

        const config: Partial<Config> = {
            responsive: true,
            displayModeBar: false,
        };

        Plotly.newPlot('d3-map', plotData, layout, config);
    }

}
