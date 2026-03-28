import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MAINTENANCE_TYPES } from '../../core/models/equipment.model';

export interface MaintenanceLogDialogData {
  equipmentId: string;
  equipmentName: string;
}

@Component({
  selector: 'app-maintenance-log-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Log Maintenance – {{ data.equipmentName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="log-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date</mat-label>
          <input matInput type="date" formControlName="date" />
          @if (form.controls.date.hasError('required')) {
            <mat-error>Date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Maintenance Type</mat-label>
          <mat-select formControlName="type">
            @for (t of maintenanceTypes; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cost ($)</mat-label>
          <input matInput type="number" formControlName="cost" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .log-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 350px;
    }
    .full-width {
      width: 100%;
    }
  `,
})
export class MaintenanceLogDialogComponent {
  protected readonly data = inject<MaintenanceLogDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MaintenanceLogDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly maintenanceTypes = MAINTENANCE_TYPES;

  protected readonly form = this.fb.nonNullable.group({
    date: [new Date().toISOString().split('T')[0], Validators.required],
    type: [''],
    description: [''],
    cost: [null as number | null],
    notes: [''],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({
      equipmentId: this.data.equipmentId,
      equipmentName: this.data.equipmentName,
      ...this.form.getRawValue(),
    });
  }
}
