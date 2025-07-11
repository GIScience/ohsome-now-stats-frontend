import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
    ViewChild
} from '@angular/core';
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
export class CountryMapLegendComponent<T, K extends keyof T> implements OnInit, OnChanges, AfterViewInit {
    @Input() minValue!: number;
    @Input() maxValue!: number;
    @Input() colorFunction!: (value: Pick<T, K>) => Color;
    @Input() transformFn!: (value: number) => Pick<T, K>;
    @Input() unit: string = '';
    @Input() radiusFunction!: (value: number) => number;
    @ViewChild('legendCanvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;

    private isCanvasReady = false;
    private _positiveGradientSteps: number[] = [];
    private _negativeGradientSteps: number[] = [];

    // Use getters to return cached arrays
    get positiveGradientSteps(): number[] {
        return this._positiveGradientSteps;
    }

    get negativeGradientSteps(): number[] {
        return this._negativeGradientSteps;
    }

    ngOnInit() {
        this.generateGradientSteps();
    }

    ngAfterViewInit() {
        this.isCanvasReady = true;
        this.drawLegend();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['minValue'] || changes['maxValue'] || changes['colorFunction']) {
            setTimeout(() => {
                this.generateGradientSteps();
                if (this.isCanvasReady) {
                    this.drawLegend();
                }
            }, 0);
        }
    }

    private generateGradientSteps() {
        const baseNumberOfSteps = 15;
        const minSteps = 3; // Minimum steps to maintain visual continuity
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
            this._positiveGradientSteps = newPositiveSteps;
        } else {
            this._positiveGradientSteps = [];
        }

        // Generate negative gradient steps
        if (this.minValue < 0) {
            const newNegativeSteps: number[] = [];
            for (let i = 1; i <= negativeSteps; i++) {
                const value = (i / negativeSteps) * this.minValue;
                newNegativeSteps.push(value);
            }
            newNegativeSteps.reverse();
            this._negativeGradientSteps = newNegativeSteps;
        } else {
            this._negativeGradientSteps = [];
        }

        // console.log(`Negative distance: ${negativeDistance}, Positive distance: ${positiveDistance}`);
        // console.log(`Negative steps: ${negativeSteps}, Positive steps: ${positiveSteps}`);
        // console.log(`Generated negative gradient steps:`, this._negativeGradientSteps.length);
        // console.log(`Generated positive gradient steps:`, this._positiveGradientSteps.length);
    }

    // Create a memoized version of the style calculation
    private styleCache = new Map<string, any>();

    getPositiveGradientStepStyle(value: number, index: number) {
        const cacheKey = `pos_${value}_${index}_${this.maxValue}`;
        if (this.styleCache.has(cacheKey)) {
            return this.styleCache.get(cacheKey);
        }

        const colorArr = this.colorFunction(this.transformFn(value));
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;

        const radius = this.radiusFunction ? this.radiusFunction(value) : 10;
        const maxRadius = this.radiusFunction ? this.radiusFunction(this.maxValue) : 40;
        const minRadius = this.radiusFunction ? this.radiusFunction(0) : 3;

        const normalizedRadius = (radius - minRadius) / (maxRadius - minRadius);
        const height = Math.max(3, normalizedRadius * 70);

        const style = {
            'background-color': color,
            'height': `${height}px`,
            'border': '1px solid rgba(0,0,0,0.1)',
            'margin-right': '1px'
        };

        this.styleCache.set(cacheKey, style);
        return style;
    }

    getNegativeGradientStepStyle(value: number, index: number) {
        const cacheKey = `neg_${value}_${index}_${this.minValue}`;
        if (this.styleCache.has(cacheKey)) {
            return this.styleCache.get(cacheKey);
        }

        const colorArr = this.colorFunction(this.transformFn(value));
        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]! / 255})`;

        const radius = this.radiusFunction ? this.radiusFunction(Math.abs(value)) : 10;

        // Get the radius ranges - use absolute values for comparison
        const maxNegativeRadius = this.radiusFunction ? this.radiusFunction(Math.abs(this.maxValue)) : 40;
        const minRadius = this.radiusFunction ? this.radiusFunction(0) : 3;

        // Normalize the radius properly
        const normalizedRadius = (radius - minRadius) / (maxNegativeRadius - minRadius);
        const height = Math.max(3, normalizedRadius * 70);

        const style = {
            'background-color': color,
            'height': `${height}px`,
            'border': '1px solid rgba(0,0,0,0.1)',
            'margin-left': '1px'
        };

        this.styleCache.set(cacheKey, style);
        return style;
    }

    private drawLegend() {
        if (!this.canvasRef?.nativeElement || !this.colorFunction) {
            return;
        }

        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight || 20;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        for (let x = 0; x < width; x++) {
            const normalizedX = x / (width - 1);
            const value = this.minValue + normalizedX * (this.maxValue - this.minValue);
            const tempTData = this.transformFn(value);
            const color = this.colorFunction(tempTData);

            const rgbaColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]! / 255})`;

            ctx.fillStyle = rgbaColor;
            ctx.fillRect(x, 0, 1, height);
        }
    }

    formatValue(value: number): string {
        if (Math.abs(value) >= 10000) {
            return (value / 10000).toFixed(1) + 'M';
        } else if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else if (Math.abs(value) < 1 && Math.abs(value) > 0) {
            return value.toFixed(3);
        } else {
            return value.toFixed(1);
        }
    }

    getLegendCircleStyle(value: number) {
        const radius = value === 0 ? 2 : (this.radiusFunction ? this.radiusFunction(Math.abs(value)) : 10);
        const colorArr = this.colorFunction(this.transformFn(value));
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