import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Product, PRODUCT_TYPES, ApplicationRateUnit } from '../../core/models/product.model';

export interface ProductFormDialogData {
  product?: Product;
}

@Component({
  selector: 'app-product-form-dialog',
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
    <h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'Add Product' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="product-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Product Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Active Ingredient</mat-label>
          <input matInput formControlName="activeIngredient" />
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select formControlName="type">
              @for (t of productTypes; track t.value) {
                <mat-option [value]="t.value">{{ t.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Reapply Interval (days)</mat-label>
            <input matInput type="number" formControlName="reapplyIntervalDays" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Application Rate (per 1,000 sq ft)</mat-label>
            <input matInput type="number" formControlName="applicationRatePerKSqFt" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Unit</mat-label>
            <mat-select formControlName="applicationRateUnit">
              @for (u of rateUnits; track u) {
                <mat-option [value]="u">{{ u }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>GDD Window Min</mat-label>
            <input matInput type="number" formControlName="gddWindowMin" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>GDD Window Max</mat-label>
            <input matInput type="number" formControlName="gddWindowMax" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="form.invalid">
        {{ data.product ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .product-form {
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
export class ProductFormDialogComponent implements OnInit {
  protected readonly data = inject<ProductFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly productTypes = PRODUCT_TYPES;
  protected readonly rateUnits: ApplicationRateUnit[] = ['oz', 'lbs', 'ml', 'g'];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    activeIngredient: [''],
    type: [''],
    applicationRatePerKSqFt: [0],
    applicationRateUnit: ['oz' as string],
    reapplyIntervalDays: [null as number | null],
    gddWindowMin: [null as number | null],
    gddWindowMax: [null as number | null],
    notes: [''],
  });

  ngOnInit(): void {
    if (this.data.product) {
      this.form.patchValue(this.data.product);
    }
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
