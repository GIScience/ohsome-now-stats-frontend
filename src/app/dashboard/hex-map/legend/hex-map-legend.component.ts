import {AfterViewInit, Component, computed, ElementRef, input, viewChild} from '@angular/core';
import {Color} from '@deck.gl/core';

@Component({
    selector: 'app-legend',
    templateUrl: './hex-map-legend.component.html',
    styleUrls: ['./hex-map-legend.component.scss'],
    imports: []
})
export class HexMapLegendComponent<T, K extends keyof T> implements AfterViewInit {
    minValue = input.required<number>();
    maxValue = input.required<number>();
    colorFunction = input.required<(value: Pick<T, K>) => Color>();
    transformFn = input.required<(value: number) => Pick<T, K>>();
    unit = input<string>('');

    canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('legendCanvas');

    showZeroLabel = computed(() =>
        this.minValue() < 0 && this.maxValue() > 0
    );

    zeroPosition = computed(() => {
        if (!this.showZeroLabel()) return 0;
        return (-this.minValue()) / (this.maxValue() - this.minValue());
    });


    ngAfterViewInit() {
        this.drawLegend();
    }

    private drawLegend() {
        const canvas = this.canvasRef()?.nativeElement;
        const colorFn = this.colorFunction();
        const transformFn = this.transformFn();

        if (!canvas || !colorFn || !transformFn) {
            return;
        }

        const parent = canvas.parentElement;
        if (!parent) return;

        // Set canvas size to parent size
        const width = parent.clientWidth;
        const height = parent.clientHeight || 20;

        // Set both the canvas element's width/height and its style
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const min = this.minValue();
        const max = this.maxValue();
        // Create gradient by drawing vertical lines
        for (let x = 0; x < width; x++) {
            const normalizedX = x / (width - 1);
            const value = min + normalizedX * (max - min);

            const tempTData = transformFn(value);
            const color = colorFn(tempTData);

            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] ?? 255) / 255})`;
            ctx.fillRect(x, 0, 1, height);
        }
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
}
