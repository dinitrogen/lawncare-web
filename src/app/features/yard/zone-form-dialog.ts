import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { YardZone, ZoneSketch, GRASS_TYPES, SunExposure } from '../../core/models/yard.model';
import { ZoneSketchCanvasComponent } from '../../shared/zone-sketch-canvas';

export interface ZoneFormDialogData {
  zone?: YardZone;
}

@Component({
  selector: 'app-zone-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    ZoneSketchCanvasComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.zone ? 'Edit Zone' : 'Add Zone' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="zone-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Zone Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Area (sq ft)</mat-label>
            <input matInput type="number" formControlName="area" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Grass Type</mat-label>
            <mat-select formControlName="grassType">
              @for (type of grassTypes; track type) {
                <mat-option [value]="type">{{ type }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sun Exposure</mat-label>
            <mat-select formControlName="sunExposure">
              @for (exp of sunExposures; track exp) {
                <mat-option [value]="exp">{{ exp }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>

        <h3>Zone Sketch</h3>
        <p class="hint">Draw your zone shape. Each cell represents a configurable area.</p>
        <app-zone-sketch-canvas
          [sketch]="currentSketch"
          (sketchChange)="onSketchChange($event)"
        ></app-zone-sketch-canvas>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="form.invalid">
        {{ data.zone ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .zone-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      padding-top: 4px;
    }
    .form-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .form-row mat-form-field {
      flex: 1;
      min-width: 140px;
    }
    .full-width {
      width: 100%;
    }
    .hint {
      font-size: 13px;
      opacity: 0.7;
      margin: 0 0 8px;
    }
  `,
})
export class ZoneFormDialogComponent implements OnInit {
  protected readonly data = inject<ZoneFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ZoneFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly grassTypes = GRASS_TYPES;
  protected readonly sunExposures: SunExposure[] = ['full-sun', 'partial-shade', 'full-shade'];
  protected currentSketch: ZoneSketch | null = null;
  private sketchData: ZoneSketch | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    area: [0],
    grassType: [''],
    sunExposure: [''],
    notes: [''],
  });

  ngOnInit(): void {
    if (this.data.zone) {
      this.form.patchValue({
        name: this.data.zone.name,
        area: this.data.zone.area,
        grassType: this.data.zone.grassType ?? '',
        sunExposure: this.data.zone.sunExposure ?? '',
        notes: this.data.zone.notes ?? '',
      });
      this.currentSketch = this.data.zone.sketchData ?? null;
      this.sketchData = this.currentSketch;
    }
  }

  protected onSketchChange(sketch: ZoneSketch): void {
    this.sketchData = sketch;
    // Auto-calculate area from filled cells
    const area = sketch.filledCells.length * sketch.cellSizeFt * sketch.cellSizeFt;
    this.form.controls.area.setValue(area);
  }

  protected save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close({
      name: val.name,
      area: val.area,
      grassType: val.grassType,
      sunExposure: val.sunExposure,
      notes: val.notes,
      sketchData: this.sketchData ?? undefined,
    });
  }
}
