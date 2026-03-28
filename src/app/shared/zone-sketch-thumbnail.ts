import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { ZoneSketch } from '../core/models/yard.model';

@Component({
  selector: 'app-zone-sketch-thumbnail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #thumbCanvas></canvas>`,
  styles: `
    :host {
      display: block;
    }
    canvas {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 4px;
    }
  `,
})
export class ZoneSketchThumbnailComponent implements AfterViewInit {
  readonly sketch = input.required<ZoneSketch>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('thumbCanvas');
  private readonly CELL_PX = 6;

  constructor() {
    effect(() => {
      this.sketch();
      this.draw();
    });
  }

  ngAfterViewInit(): void {
    this.draw();
  }

  private draw(): void {
    const canvas = this.canvasRef?.()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = this.sketch();
    const px = this.CELL_PX;
    const cols = s.gridSizeX;
    const rows = s.gridSizeY;

    canvas.width = cols * px;
    canvas.height = rows * px;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid background
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Filled cells
    ctx.fillStyle = '#4caf50';
    for (const cell of s.filledCells) {
      ctx.fillRect(cell.x * px, cell.y * px, px - 1, px - 1);
    }

    // Labels (small dots)
    if (s.labels?.length) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      for (const label of s.labels) {
        ctx.beginPath();
        ctx.arc(label.x * px + px / 2, label.y * px + px / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
