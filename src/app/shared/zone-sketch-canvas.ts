import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ZoneSketch, ZoneLabel, FilledCell } from '../core/models/yard.model';

type Tool = 'draw' | 'erase' | 'label';

@Component({
  selector: 'app-zone-sketch-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="sketch-toolbar">
      <mat-button-toggle-group
        [value]="activeTool()"
        (change)="activeTool.set($event.value)"
        aria-label="Drawing tool"
      >
        <mat-button-toggle value="draw" matTooltip="Draw cells">
          <mat-icon>brush</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="erase" matTooltip="Erase cells">
          <mat-icon>auto_fix_off</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="label" matTooltip="Add label">
          <mat-icon>label</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>

      <div class="grid-controls">
        <mat-form-field appearance="outline" class="compact-field">
          <mat-label>Cols</mat-label>
          <input
            matInput
            type="number"
            [ngModel]="gridSizeX()"
            (ngModelChange)="onGridSizeXChange($event)"
            min="5"
            max="50"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" class="compact-field">
          <mat-label>Rows</mat-label>
          <input
            matInput
            type="number"
            [ngModel]="gridSizeY()"
            (ngModelChange)="onGridSizeYChange($event)"
            min="5"
            max="50"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" class="compact-field">
          <mat-label>Ft/cell</mat-label>
          <input
            matInput
            type="number"
            [ngModel]="cellSizeFt()"
            (ngModelChange)="onCellSizeFtChange($event)"
            min="1"
            max="20"
          />
        </mat-form-field>
      </div>

      <div class="area-display">
        <strong>Area: {{ totalArea() }} sq ft</strong>
      </div>

      <button mat-icon-button matTooltip="Clear canvas" (click)="clearCanvas()">
        <mat-icon>delete_sweep</mat-icon>
      </button>
    </div>

    <div class="canvas-container">
      <canvas
        #sketchCanvas
        [width]="canvasWidth()"
        [height]="canvasHeight()"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointerleave)="onPointerUp()"
      ></canvas>

      @if (activeTool() === 'label' && showLabelInput()) {
        <div class="label-input-overlay" [style.left.px]="labelInputX()" [style.top.px]="labelInputY()">
          <mat-form-field appearance="outline" class="label-field">
            <mat-label>Label</mat-label>
            <input
              matInput
              [(ngModel)]="pendingLabelText"
              (keydown.enter)="confirmLabel()"
              (keydown.escape)="cancelLabel()"
              #labelInput
            />
          </mat-form-field>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .sketch-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .grid-controls {
      display: flex;
      gap: 8px;
    }
    .compact-field {
      width: 72px;
    }
    .area-display {
      font-size: 14px;
    }
    .canvas-container {
      position: relative;
      border: 1px solid var(--border-color, #ccc);
      border-radius: 4px;
      overflow: auto;
      max-height: 400px;
      width: 100%;
    }
    canvas {
      display: block;
      cursor: crosshair;
      touch-action: none;
    }
    .label-input-overlay {
      position: absolute;
      z-index: 10;
    }
    .label-field {
      width: 120px;
    }
  `,
})
export class ZoneSketchCanvasComponent implements AfterViewInit {
  readonly sketch = input<ZoneSketch | null>(null);
  readonly sketchChange = output<ZoneSketch>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('sketchCanvas');

  protected readonly activeTool = signal<Tool>('draw');
  protected readonly gridSizeX = signal(20);
  protected readonly gridSizeY = signal(15);
  protected readonly cellSizeFt = signal(5);
  protected readonly filledCells = signal<Set<string>>(new Set());
  protected readonly labels = signal<ZoneLabel[]>([]);

  protected readonly showLabelInput = signal(false);
  protected readonly labelInputX = signal(0);
  protected readonly labelInputY = signal(0);
  protected pendingLabelText = '';
  private pendingLabelCell: { x: number; y: number } | null = null;

  private isDrawing = false;
  private readonly CELL_PX = 24;

  protected readonly canvasWidth = computed(() => this.gridSizeX() * this.CELL_PX);
  protected readonly canvasHeight = computed(() => this.gridSizeY() * this.CELL_PX);
  protected readonly totalArea = computed(() => this.filledCells().size * this.cellSizeFt() * this.cellSizeFt());

  constructor() {
    effect(() => {
      const s = this.sketch();
      if (s) {
        this.gridSizeX.set(s.gridSizeX);
        this.gridSizeY.set(s.gridSizeY);
        this.cellSizeFt.set(s.cellSizeFt);
        this.filledCells.set(new Set(s.filledCells.map((c) => `${c.x},${c.y}`)));
        this.labels.set([...(s.labels ?? [])]);
      }
    });

    effect(() => {
      // Redraw whenever dependencies change
      this.filledCells();
      this.labels();
      this.gridSizeX();
      this.gridSizeY();
      this.draw();
    });
  }

  ngAfterViewInit(): void {
    this.draw();
  }

  protected onGridSizeXChange(val: number): void {
    if (val >= 5 && val <= 50) {
      this.gridSizeX.set(val);
      this.emitSketch();
    }
  }

  protected onGridSizeYChange(val: number): void {
    if (val >= 5 && val <= 50) {
      this.gridSizeY.set(val);
      this.emitSketch();
    }
  }

  protected onCellSizeFtChange(val: number): void {
    if (val >= 1 && val <= 20) {
      this.cellSizeFt.set(val);
      this.emitSketch();
    }
  }

  protected onPointerDown(e: PointerEvent): void {
    this.isDrawing = true;
    this.handlePointer(e);
  }

  protected onPointerMove(e: PointerEvent): void {
    if (!this.isDrawing) return;
    this.handlePointer(e);
  }

  protected onPointerUp(): void {
    this.isDrawing = false;
  }

  private handlePointer(e: PointerEvent): void {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.CELL_PX);
    const y = Math.floor((e.clientY - rect.top) / this.CELL_PX);

    if (x < 0 || x >= this.gridSizeX() || y < 0 || y >= this.gridSizeY()) return;

    const tool = this.activeTool();
    if (tool === 'label') {
      if (!this.isDrawing) return;
      this.isDrawing = false; // only one click
      this.pendingLabelCell = { x, y };
      this.labelInputX.set(e.clientX - rect.left + 4);
      this.labelInputY.set(e.clientY - rect.top + 4);
      this.pendingLabelText = '';
      this.showLabelInput.set(true);
      return;
    }

    const key = `${x},${y}`;
    this.filledCells.update((cells) => {
      const next = new Set(cells);
      if (tool === 'draw') {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
    this.emitSketch();
  }

  protected confirmLabel(): void {
    if (this.pendingLabelText.trim() && this.pendingLabelCell) {
      this.labels.update((l) => [
        ...l,
        { x: this.pendingLabelCell!.x, y: this.pendingLabelCell!.y, text: this.pendingLabelText.trim() },
      ]);
      this.emitSketch();
    }
    this.cancelLabel();
  }

  protected cancelLabel(): void {
    this.showLabelInput.set(false);
    this.pendingLabelCell = null;
    this.pendingLabelText = '';
  }

  protected clearCanvas(): void {
    this.filledCells.set(new Set());
    this.labels.set([]);
    this.emitSketch();
  }

  private draw(): void {
    const canvas = this.canvasRef?.()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = this.gridSizeX();
    const rows = this.gridSizeY();
    const px = this.CELL_PX;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'var(--border-color, #ddd)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * px, 0);
      ctx.lineTo(x * px, rows * px);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * px);
      ctx.lineTo(cols * px, y * px);
      ctx.stroke();
    }

    // Draw filled cells
    ctx.fillStyle = '#4caf50';
    for (const key of this.filledCells()) {
      const [cx, cy] = key.split(',').map(Number);
      ctx.fillRect(cx * px + 1, cy * px + 1, px - 2, px - 2);
    }

    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = '11px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const label of this.labels()) {
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const textWidth = ctx.measureText(label.text).width;
      ctx.fillRect(
        label.x * px + px / 2 - textWidth / 2 - 3,
        label.y * px + px / 2 - 8,
        textWidth + 6,
        16,
      );
      ctx.fillStyle = '#fff';
      ctx.fillText(label.text, label.x * px + px / 2, label.y * px + px / 2);
    }
  }

  private emitSketch(): void {
    const cells: FilledCell[] = [...this.filledCells()].map((k) => {
      const [x, y] = k.split(',').map(Number);
      return { x, y };
    });
    this.sketchChange.emit({
      gridSizeX: this.gridSizeX(),
      gridSizeY: this.gridSizeY(),
      cellSizeFt: this.cellSizeFt(),
      filledCells: cells,
      labels: [...this.labels()],
    });
  }
}
