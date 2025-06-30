import {AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Color} from '@deck.gl/core';
import {HexDataType} from '../../types';

@Component({
    selector: 'app-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    standalone: false
})
export class LegendComponent implements OnChanges, AfterViewInit {
    @Input() minValue!: number;
    @Input() maxValue!: number;
    @Input() colorFunction!: (value: HexDataType) => Color;
    @Input() unit: string = '';
    @ViewChild('legendCanvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;

    private isCanvasReady = false;

    get showZeroLabel(): boolean {
        return this.minValue < 0 && this.maxValue > 0;
    }

    get zeroPosition(): number {
        // Returns a value between 0 and 1
        if (!this.showZeroLabel) return 0;
        return (-this.minValue) / (this.maxValue - this.minValue);
    }

    ngAfterViewInit() {
        this.isCanvasReady = true;
        this.drawLegend();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes['minValue'] || changes['maxValue'] || changes['colorFunction'])
            && this.isCanvasReady) {
            this.drawLegend();
        }
    }

    private drawLegend() {
        if (!this.canvasRef?.nativeElement || !this.colorFunction) {
            return;
        }

        const canvas = this.canvasRef.nativeElement;
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

        // Create gradient by drawing vertical lines
        for (let x = 0; x < width; x++) {
            // Map x position to value range
            const normalizedX = x / (width - 1);
            const value = this.minValue + normalizedX * (this.maxValue - this.minValue);

            // Create mock HexDataType object for color function
            const tempHexData: HexDataType = {
                result: value,
                hex_cell: '' // This won't be used by the color function
            };

            const color = this.colorFunction(tempHexData);

            // Convert RGBA to CSS color string
            const rgbaColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]! / 255})`;

            // Draw vertical line
            ctx.fillStyle = rgbaColor;
            ctx.fillRect(x, 0, 1, height);
        }
    }

    formatValue(value: number): string {
        if (Math.abs(value) >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else if (Math.abs(value) < 1 && Math.abs(value) > 0) {
            return value.toFixed(3);
        } else {
            return value.toFixed(1);
        }
    }
}