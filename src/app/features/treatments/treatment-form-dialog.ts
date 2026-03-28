import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Treatment } from '../../core/models/treatment.model';
import { YardZone } from '../../core/models/yard.model';
import { Product } from '../../core/models/product.model';
import { YardService } from '../../core/services/yard.service';
import { ProductService } from '../../core/services/product.service';

export interface TreatmentFormDialogData {
  treatment?: Treatment;
  uid: string;
}

@Component({
  selector: 'app-treatment-form-dialog',
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
    <h2 mat-dialog-title>{{ data.treatment ? 'Edit Treatment' : 'Log Treatment' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="treatment-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date Applied</mat-label>
          <input matInput type="date" formControlName="dateApplied" />
          @if (form.controls.dateApplied.hasError('required')) {
            <mat-error>Date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Zone</mat-label>
          <mat-select formControlName="zoneId" (selectionChange)="onZoneSelect($event.value)">
            @for (zone of zones(); track zone.id) {
              <mat-option [value]="zone.id">{{ zone.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Product</mat-label>
          <mat-select formControlName="productId" (selectionChange)="onProductSelect($event.value)">
            @for (product of products(); track product.id) {
              <mat-option [value]="product.id">{{ product.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Amount Used (oz)</mat-label>
            <input matInput type="number" formControlName="amountUsed" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Temperature (°F)</mat-label>
            <input matInput type="number" formControlName="temperatureF" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Weather Condition</mat-label>
          <mat-select formControlName="weatherCondition">
            <mat-option value="Sunny">Sunny</mat-option>
            <mat-option value="Partly Cloudy">Partly Cloudy</mat-option>
            <mat-option value="Overcast">Overcast</mat-option>
            <mat-option value="Light Rain">Light Rain</mat-option>
            <mat-option value="Rain">Rain</mat-option>
            <mat-option value="Windy">Windy</mat-option>
          </mat-select>
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
        {{ data.treatment ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .treatment-form {
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
export class TreatmentFormDialogComponent implements OnInit {
  protected readonly data = inject<TreatmentFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TreatmentFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly yardService = inject(YardService);
  private readonly productService = inject(ProductService);

  protected readonly zones = signal<YardZone[]>([]);
  protected readonly products = signal<Product[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    dateApplied: ['', Validators.required],
    zoneId: [''],
    zoneName: [''],
    productId: [''],
    productName: [''],
    amountUsed: [0],
    temperatureF: [null as number | null],
    weatherCondition: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.yardService.getZones(this.data.uid).subscribe((z) => this.zones.set(z));
    this.productService.getProducts(this.data.uid).subscribe((p) => this.products.set(p));

    if (this.data.treatment) {
      const t = this.data.treatment;
      this.form.patchValue({
        dateApplied: t.applicationDate ? new Date(t.applicationDate).toISOString().split('T')[0] : '',
        zoneId: t.zoneId,
        zoneName: t.zoneName,
        productId: t.productId,
        productName: t.productName,
        amountUsed: t.amountApplied,
        temperatureF: t.temperature ?? null,
        weatherCondition: t.weatherConditions ?? '',
        notes: t.notes ?? '',
      });
    } else {
      this.form.controls.dateApplied.setValue(new Date().toISOString().split('T')[0]);
    }
  }

  protected onZoneSelect(zoneId: string): void {
    const zone = this.zones().find((z) => z.id === zoneId);
    if (zone) this.form.controls.zoneName.setValue(zone.name);
  }

  protected onProductSelect(productId: string): void {
    const product = this.products().find((p) => p.id === productId);
    if (product) this.form.controls.productName.setValue(product.name);
  }

  protected save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close({
      zoneId: val.zoneId,
      zoneName: val.zoneName,
      productId: val.productId,
      productName: val.productName,
      applicationDate: new Date(val.dateApplied).toISOString(),
      amountApplied: val.amountUsed,
      amountUnit: 'oz',
      temperature: val.temperatureF ?? undefined,
      weatherConditions: val.weatherCondition,
      notes: val.notes,
    });
  }
}
