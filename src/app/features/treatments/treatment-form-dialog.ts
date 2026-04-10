import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ApplicationType, Treatment } from '../../core/models/treatment.model';
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
          <mat-label>Zones</mat-label>
          <mat-select formControlName="zoneIds" multiple>
            @for (zone of zones(); track zone.id) {
              <mat-option [value]="zone.id">{{ zone.name }} ({{ zone.area }} sq ft)</mat-option>
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

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Application Type</mat-label>
          <mat-select formControlName="applicationType">
            <mat-option value="sprayer">Sprayer (liquid)</mat-option>
            <mat-option value="solid">Solid (granular)</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-2">
            <mat-label>Product Amount</mat-label>
            <input matInput type="number" formControlName="amountUsed" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Unit</mat-label>
            <mat-select formControlName="amountUnit">
              @if (form.controls.applicationType.value === 'solid') {
                <mat-option value="lbs">lbs</mat-option>
                <mat-option value="bags">bags</mat-option>
              } @else {
                <mat-option value="oz">oz</mat-option>
                <mat-option value="grams">grams</mat-option>
                <mat-option value="ml">ml</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (form.controls.applicationType.value === 'sprayer') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Water Volume (gallons)</mat-label>
            <input matInput type="number" formControlName="waterVolume" />
          </mat-form-field>
        }

        @if (form.controls.applicationType.value === 'solid') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Spreader Setting</mat-label>
            <input matInput type="number" formControlName="spreaderSetting" />
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Application Rate (per 1,000 sq ft)</mat-label>
          <input matInput formControlName="applicationRate" />
          <mat-hint>{{ rateHint() }}</mat-hint>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>GDD</mat-label>
            <input matInput type="number" formControlName="gdd" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Temperature (°F)</mat-label>
            <input matInput type="number" formControlName="temperatureF" />
          </mat-form-field>

          <mat-form-field appearance="outline">
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
        {{ data.treatment ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .treatment-form {
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
    .flex-1 {
      flex: 1;
    }
    .flex-2 {
      flex: 2;
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
  protected readonly rateHint = signal('');

  protected readonly form = this.fb.nonNullable.group({
    dateApplied: ['', Validators.required],
    zoneIds: [[] as string[]],
    productId: [''],
    productName: [''],
    applicationType: ['' as string],
    amountUsed: [0],
    amountUnit: ['oz'],
    waterVolume: [null as number | null],
    spreaderSetting: [null as number | null],
    applicationRate: [''],
    gdd: [null as number | null],
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
        zoneIds: t.zoneIds,
        productId: t.productId,
        productName: t.productName,
        applicationType: t.applicationType ?? '',
        amountUsed: t.amountApplied,
        amountUnit: t.amountUnit || 'oz',
        waterVolume: t.waterVolume ?? null,
        spreaderSetting: t.spreaderSetting ?? null,
        applicationRate: t.applicationRate ?? '',
        gdd: t.gdd ?? null,
        temperatureF: t.temperature ?? null,
        weatherCondition: t.weatherConditions ?? '',
        notes: t.notes ?? '',
      });
    } else {
      this.form.controls.dateApplied.setValue(new Date().toISOString().split('T')[0]);
    }

    // Auto-calculate application rate when relevant fields change
    this.form.controls.zoneIds.valueChanges.subscribe(() => this.calculateRate());
    this.form.controls.waterVolume.valueChanges.subscribe(() => this.calculateRate());
    this.form.controls.amountUsed.valueChanges.subscribe(() => this.calculateRate());
    this.form.controls.applicationType.valueChanges.subscribe((type) => {
      if (type === 'sprayer') {
        this.form.controls.amountUnit.setValue('oz');
      } else if (type === 'solid') {
        this.form.controls.amountUnit.setValue('lbs');
      }
      this.calculateRate();
    });
  }

  protected onProductSelect(productId: string): void {
    const product = this.products().find((p) => p.id === productId);
    if (product) this.form.controls.productName.setValue(product.name);
  }

  private calculateRate(): void {
    const zoneIds = this.form.controls.zoneIds.value;
    const totalArea = this.zones()
      .filter((z) => zoneIds.includes(z.id))
      .reduce((sum, z) => sum + z.area, 0);

    if (!totalArea) {
      this.rateHint.set('Select a zone to auto-calculate');
      return;
    }

    const type = this.form.controls.applicationType.value;
    const kSqFt = totalArea / 1000;

    if (type === 'sprayer') {
      const waterVol = this.form.controls.waterVolume.value;
      if (waterVol && waterVol > 0) {
        const ratePerK = (waterVol / kSqFt).toFixed(2);
        const rateStr = `${ratePerK} gal/1,000 sq ft`;
        this.form.controls.applicationRate.setValue(rateStr);
        this.rateHint.set(`${waterVol} gal ÷ ${kSqFt.toFixed(1)}k sq ft`);
      }
    } else if (type === 'solid') {
      const amount = this.form.controls.amountUsed.value;
      const unit = this.form.controls.amountUnit.value;
      if (amount && amount > 0) {
        const ratePerK = (amount / kSqFt).toFixed(2);
        const rateStr = `${ratePerK} ${unit}/1,000 sq ft`;
        this.form.controls.applicationRate.setValue(rateStr);
        this.rateHint.set(`${amount} ${unit} ÷ ${kSqFt.toFixed(1)}k sq ft`);
      }
    }
  }

  protected save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const selectedZones = this.zones().filter((z) => val.zoneIds.includes(z.id));
    const applicationType = val.applicationType as ApplicationType | undefined;
    this.dialogRef.close({
      zoneIds: val.zoneIds,
      zoneNames: selectedZones.map((z) => z.name),
      productId: val.productId,
      productName: val.productName,
      applicationDate: new Date(val.dateApplied).toISOString(),
      amountApplied: val.amountUsed,
      amountUnit: val.amountUnit,
      applicationType: applicationType || undefined,
      waterVolume: val.applicationType === 'sprayer' ? (val.waterVolume ?? undefined) : undefined,
      spreaderSetting: val.applicationType === 'solid' ? (val.spreaderSetting ?? undefined) : undefined,
      applicationRate: val.applicationRate || undefined,
      gdd: val.gdd ?? undefined,
      temperature: val.temperatureF ?? undefined,
      weatherConditions: val.weatherCondition,
      notes: val.notes,
    });
  }
}
