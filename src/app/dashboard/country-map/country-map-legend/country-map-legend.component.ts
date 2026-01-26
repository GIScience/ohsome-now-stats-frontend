import {Component, computed, input} from '@angular/core';
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
export class CountryMapLegendComponent<T, K extends keyof T> {
    minValue = input.required<number>();
    maxValue = input.required<number>();
    colorFunction = input.required<
        (value: number, country: string, selectedCountries?: string) => Color
    >();
    transformFn = input.required<(value: number) => Pick<T, K>>();
    radiusFunction = input.required<(value: Pick<T, K>) => number>();

    unit = input<string>('');
    legendTitle = input<string>('');

    private gradientSteps = computed(() => {
        const min = this.minValue();
        const max = this.maxValue();

        const baseNumberOfSteps = 15;
        const minSteps = 0;
        const maxSteps = 25;

        const negativeDistance = Math.abs(min);
        const positiveDistance = Math.abs(max);
        const totalDistance = negativeDistance + positiveDistance;

        let negativeSteps = 0;
        let positiveSteps = 0;

        if (totalDistance > 0) {
            const totalStepsToDistribute = baseNumberOfSteps * 2;

            negativeSteps = Math.round(
                totalStepsToDistribute * (negativeDistance / totalDistance)
            );
            positiveSteps = Math.round(
                totalStepsToDistribute * (positiveDistance / totalDistance)
            );

            negativeSteps = Math.max(minSteps, Math.min(maxSteps, negativeSteps));
            positiveSteps = Math.max(minSteps, Math.min(maxSteps, positiveSteps));
        }

        const positive: number[] = [];
        const negative: number[] = [];

        if (max > 0 && positiveSteps > 0) {
            for (let i = 1; i <= positiveSteps; i++) {
                positive.push((i / positiveSteps) * max);
            }
        }

        if (min < 0 && negativeSteps > 0) {
            for (let i = 1; i <= negativeSteps; i++) {
                negative.push((i / negativeSteps) * min);
            }
            negative.reverse();
        }

        return {positive, negative};
    });

    positiveGradientSteps = computed(
        () => this.gradientSteps().positive
    );

    negativeGradientSteps = computed(
        () => this.gradientSteps().negative
    );

    getPositiveGradientStepStyle(value: number) {

        const colorArr = this.colorFunction()(value, "");
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;

        const radius = this.radiusFunction() ? this.radiusFunction()(this.transformFn()(value)) : 10;
        const maxRadius = this.radiusFunction()(this.transformFn()(this.maxValue()));
        const minRadius = this.radiusFunction()(this.transformFn()(0));

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

        const colorArr = this.colorFunction()(value, "");
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;

        const radius = this.radiusFunction()(this.transformFn()(value));
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
        const radius = this.radiusFunction()(this.transformFn()(value));
        const colorArr = this.colorFunction()(value, "");
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
