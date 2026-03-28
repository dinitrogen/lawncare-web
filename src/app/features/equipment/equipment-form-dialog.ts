import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Equipment, EQUIPMENT_TYPES } from '../../core/models/equipment.model';

export interface EquipmentFormDialogData {
  equipment?: Equipment;
}

@Component({
  selector: 'app-equipment-form-dialog',
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
    <h2 mat-dialog-title>{{ data.equipment ? 'Edit Equipment' : 'Add Equipment' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="equip-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            @for (t of equipTypes; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Brand</mat-label>
            <input matInput formControlName="brand" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Model</mat-label>
            <input matInput formControlName="model" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Purchase Date</mat-label>
          <input matInput type="date" formControlName="purchaseDate" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="form.invalid">
        {{ data.equipment ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .equip-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 350px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    .full-width {
      width: 100%;
    }
  `,
})
export class EquipmentFormDialogComponent implements OnInit {
  protected readonly data = inject<EquipmentFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EquipmentFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly equipTypes = EQUIPMENT_TYPES;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: [''],
    brand: [''],
    model: [''],
    purchaseDate: [''],
    notes: [''],
  });

  ngOnInit(): void {
    if (this.data.equipment) {
      const e = this.data.equipment;
      this.form.patchValue({
        name: e.name,
        type: e.type,
        brand: e.brand ?? '',
        model: e.model ?? '',
        purchaseDate: e.purchaseDate ? new Date(e.purchaseDate).toISOString().split('T')[0] : '',
        notes: e.notes ?? '',
      });
    }
  }

  protected save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close({
      name: val.name,
      type: val.type,
      brand: val.brand,
      model: val.model,
      purchaseDate: val.purchaseDate ? new Date(val.purchaseDate).toISOString() : undefined,
      notes: val.notes,
    });
  }
}
