import {Component, Input, OnInit} from '@angular/core';
import {Color} from '@deck.gl/core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-country-map-legend',
    templateUrl: './country-map-legend.component.html',
    styleUrls: ['./country-map-legend.component.scss'],
    imports: [
        CommonModule,
    ]
})
export class CountryMapLegendComponent<T, K extends keyof T> implements OnInit {
    @Input() minValue!: number;
    @Input() maxValue!: number;
    @Input() colorFunction!: (value: number, country: string, selectedCountries?: string) => Color;
    @Input() transformFn!: (value: number) => Pick<T, K>;
    @Input() legendTitle: string = '';
    @Input() radiusFunction!: (value: Pick<T, K>) => number;

    public positiveGradientSteps: number[] = [];
    public negativeGradientSteps: number[] = [];

    ngOnInit() {
        this.generateGradientSteps();
    }

    private generateGradientSteps() {
        const baseNumberOfSteps = 15;
        const minSteps = 0; // Minimum steps to maintain visual continuity
        const maxSteps = 25; // Maximum steps to prevent overcrowding

        // Calculate absolute distances from zero
        const negativeDistance = Math.abs(this.minValue);
        const positiveDistance = Math.abs(this.maxValue);
        const totalDistance = negativeDistance + positiveDistance;

        // Calculate proportional step counts based on relative distances
        let negativeSteps = 0;
        let positiveSteps = 0;

        if (totalDistance > 0) {
            // Calculate proportional steps
            const negativeRatio = negativeDistance / totalDistance;
            const positiveRatio = positiveDistance / totalDistance;

            // Distribute total steps proportionally
            const totalStepsToDistribute = baseNumberOfSteps * 2; // Total steps for both sides
            negativeSteps = Math.round(totalStepsToDistribute * negativeRatio);
            positiveSteps = Math.round(totalStepsToDistribute * positiveRatio);

            // Ensure minimum and maximum bounds
            negativeSteps = Math.max(minSteps, Math.min(maxSteps, negativeSteps));
            positiveSteps = Math.max(minSteps, Math.min(maxSteps, positiveSteps));
        }

        // Generate positive gradient steps
        if (this.maxValue > 0) {
            const newPositiveSteps: number[] = [];
            for (let i = 1; i <= positiveSteps; i++) {
                const value = (i / positiveSteps) * this.maxValue;
                newPositiveSteps.push(value);
            }
            this.positiveGradientSteps = newPositiveSteps;
        } else {
            this.positiveGradientSteps = [];
        }

        // Generate negative gradient steps
        if (this.minValue < 0) {
            const newNegativeSteps: number[] = [];
            for (let i = 1; i <= negativeSteps; i++) {
                const value = (i / negativeSteps) * this.minValue;
                newNegativeSteps.push(value);
            }
            newNegativeSteps.reverse();
            this.negativeGradientSteps = newNegativeSteps;
        } else {
            this.negativeGradientSteps = [];
        }
    }

    getPositiveGradientStepStyle(value: number) {

        const colorArr = this.colorFunction(value, "");
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;

        const radius = this.radiusFunction ? this.radiusFunction(this.transformFn(value)) : 10;
        const maxRadius = this.radiusFunction(this.transformFn(this.maxValue));
        const minRadius = this.radiusFunction(this.transformFn(0));

        const normalizedRadius = (radius - minRadius) / (maxRadius - minRadius);
        const height = Math.max(3, normalizedRadius * 70);

        return {
            'background-color': color,
            'height': `${height}px`,
            'border': '1px solid rgba(0,0,0,0.1)',
            'margin-right': '1px'
        };
    }

    getNegativeGradientStepStyle(value: number) {

        const colorArr = this.colorFunction(value, "");
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;

        const radius = this.radiusFunction(this.transformFn(value));
        const height = radius * 2;

        return {
            'background-color': color,
            'height': `${height}px`,
            'border': '1px solid rgba(0,0,0,0.1)',
            'margin-left': '1px'
        };
    }

    formatValue(value: number): string {
        if (Math.abs(value) >= 1_000_000) {
            return (value / 1_000_000).toFixed(1) + '\u00A0M';
        } else if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(1) + '\u00A0k';
        } else if (Math.abs(value) < 1 && Math.abs(value) > 0) {
            return value.toFixed(3);
        } else {
            return value.toFixed(1);
        }
    }

    getLegendCircleStyle(value: number) {
        const radius = this.radiusFunction(this.transformFn(value));
        const colorArr = this.colorFunction(value, "");
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;
        return {
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
            background: color,
            borderRadius: '50%',
            display: 'inline-block',
            margin: '0 16px',
            verticalAlign: 'middle',
            border: '1px solid #333'
        };
    }
}
