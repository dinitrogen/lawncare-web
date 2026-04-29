import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApplicationType, Treatment, TreatmentLineItem } from '../../core/models/treatment.model';
import { YardZone } from '../../core/models/yard.model';
import { Product } from '../../core/models/product.model';
import { YardService } from '../../core/services/yard.service';
import { ProductService } from '../../core/services/product.service';

export interface TreatmentFormDialogData {
  treatment?: Treatment;
  uid: string;
}

const MAX_LINE_ITEMS = 5;

@Component({
  selector: 'app-treatment-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.treatment ? 'Edit Treatment' : 'Log Treatment' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="treatment-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date Applied</mat-label>
          <input matInput [matDatepicker]="datePicker" formControlName="dateApplied" />
          <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
          <mat-datepicker #datePicker></mat-datepicker>
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
          <mat-label>Application Type</mat-label>
          <mat-select formControlName="applicationType">
            <mat-option value="sprayer">Sprayer (liquid)</mat-option>
            <mat-option value="solid">Solid (granular)</mat-option>
          </mat-select>
        </mat-form-field>

        @if (form.controls.applicationType.value === 'sprayer') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Total Water Volume (gallons)</mat-label>
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
          <input matInput formControlName="applicationRate" readonly />
          <mat-hint>{{ rateHint() }}</mat-hint>
        </mat-form-field>

        <mat-divider class="section-divider"></mat-divider>
        <div class="section-label">Products</div>

        <div formArrayName="lineItems" class="line-items">
          @for (item of lineItemsArray.controls; track $index) {
            <div [formGroupName]="$index" class="line-item-card">
              <div class="line-item-header">
                <span class="line-item-title">Product {{ $index + 1 }}</span>
                @if (lineItemsArray.length > 1) {
                  <button
                    mat-icon-button
                    type="button"
                    aria-label="Remove product"
                    (click)="removeLineItem($index)"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Product</mat-label>
                <mat-select formControlName="productId" (selectionChange)="onProductSelect($event.value, $index)">
                  @for (product of products(); track product.id) {
                    <mat-option [value]="product.id">{{ product.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-2">
                  <mat-label>Amount</mat-label>
                  <input matInput type="number" formControlName="amountApplied" />
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
                  <mat-label>Concentration</mat-label>
                  <input matInput formControlName="productConcentration" readonly />
                  <mat-hint>{{ concentrationHints()[$index] }}</mat-hint>
                </mat-form-field>
              }
            </div>

            @if (!$last) {
              <mat-divider></mat-divider>
            }
          }
        </div>

        @if (lineItemsArray.length < maxLineItems) {
          <button mat-stroked-button type="button" class="add-product-btn" (click)="addLineItem()">
            <mat-icon>add</mat-icon> Add Another Product
          </button>
        }

        <mat-divider class="section-divider"></mat-divider>

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
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .full-width { width: 100%; }
    .section-divider { margin: 8px 0; }
    .section-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .line-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .line-item-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
    }
    .line-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .line-item-title {
      font-size: 0.9rem;
      font-weight: 500;
    }
    .add-product-btn {
      align-self: flex-start;
      margin: 4px 0 8px;
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
  protected readonly concentrationHints = signal<string[]>(['']);
  protected readonly maxLineItems = MAX_LINE_ITEMS;

  protected readonly form = this.fb.nonNullable.group({
    dateApplied: [null as Date | null, Validators.required],
    zoneIds: [[] as string[]],
    applicationType: ['' as string],
    waterVolume: [null as number | null],
    spreaderSetting: [null as number | null],
    applicationRate: [''],
    lineItems: this.fb.array([this.buildLineItemGroup()]),
    gdd: [null as number | null],
    temperatureF: [null as number | null],
    weatherCondition: [''],
    notes: [''],
  });

  get lineItemsArray(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  private buildLineItemGroup(item?: Partial<TreatmentLineItem>) {
    return this.fb.nonNullable.group({
      productId: [item?.productId ?? ''],
      productName: [item?.productName ?? ''],
      amountApplied: [item?.amountApplied ?? 0],
      amountUnit: [item?.amountUnit ?? 'oz'],
      productConcentration: [item?.productConcentration ?? ''],
    });
  }

  ngOnInit(): void {
    this.yardService.getZones(this.data.uid).subscribe((z) => this.zones.set(z));
    this.productService.getProducts(this.data.uid).subscribe((p) => this.products.set(p));

    if (this.data.treatment) {
      const t = this.data.treatment;
      const dateParts = t.applicationDate?.split('T')[0]?.split('-');
      const localDate = dateParts
        ? new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2])
        : null;

      // Support legacy single-product records
      const lineItems: TreatmentLineItem[] =
        t.lineItems?.length
          ? t.lineItems
          : t.productId
            ? [{
                productId: t.productId,
                productName: t.productName ?? '',
                amountApplied: t.amountApplied ?? 0,
                amountUnit: t.amountUnit ?? 'oz',
                productConcentration: t.productConcentration,
              }]
            : [];

      while (this.lineItemsArray.length > 0) this.lineItemsArray.removeAt(0);
      for (const li of lineItems.length ? lineItems : [{}]) {
        this.lineItemsArray.push(this.buildLineItemGroup(li));
      }
      this.concentrationHints.set(new Array(this.lineItemsArray.length).fill(''));

      this.form.patchValue({
        dateApplied: localDate,
        zoneIds: t.zoneIds,
        applicationType: t.applicationType ?? '',
        waterVolume: t.waterVolume ?? null,
        spreaderSetting: t.spreaderSetting ?? null,
        applicationRate: t.applicationRate ?? '',
        gdd: t.gdd ?? null,
        temperatureF: t.temperature ?? null,
        weatherCondition: t.weatherConditions ?? '',
        notes: t.notes ?? '',
      });
    } else {
      this.form.controls.dateApplied.setValue(new Date());
      this.concentrationHints.set(['']);
    }

    this.form.controls.zoneIds.valueChanges.subscribe(() => this.calculateRate());
    this.form.controls.waterVolume.valueChanges.subscribe(() => {
      this.calculateRate();
      this.recalculateAllConcentrations();
    });
    this.form.controls.applicationType.valueChanges.subscribe((type) => {
      const defaultUnit = type === 'solid' ? 'lbs' : 'oz';
      for (let i = 0; i < this.lineItemsArray.length; i++) {
        this.lineItemsArray.at(i).get('amountUnit')?.setValue(defaultUnit);
      }
      this.calculateRate();
      this.recalculateAllConcentrations();
    });
    this.lineItemsArray.valueChanges.subscribe(() => {
      this.calculateRate();
      this.recalculateAllConcentrations();
    });
  }

  protected onProductSelect(productId: string, index: number): void {
    const product = this.products().find((p) => p.id === productId);
    if (product) {
      this.lineItemsArray.at(index).get('productName')?.setValue(product.name);
    }
  }

  protected addLineItem(): void {
    if (this.lineItemsArray.length >= MAX_LINE_ITEMS) return;
    const type = this.form.controls.applicationType.value;
    this.lineItemsArray.push(this.buildLineItemGroup({ amountUnit: type === 'solid' ? 'lbs' : 'oz' }));
    this.concentrationHints.update((h) => [...h, '']);
  }

  protected removeLineItem(index: number): void {
    if (this.lineItemsArray.length <= 1) return;
    this.lineItemsArray.removeAt(index);
    this.concentrationHints.update((h) => h.filter((_, i) => i !== index));
  }

  private getTotalArea(): number {
    const zoneIds = this.form.controls.zoneIds.value;
    return this.zones()
      .filter((z) => zoneIds.includes(z.id))
      .reduce((sum, z) => sum + z.area, 0);
  }

  private calculateRate(): void {
    const totalArea = this.getTotalArea();
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
        this.form.controls.applicationRate.setValue(`${ratePerK} gal/1,000 sq ft`, { emitEvent: false });
        this.rateHint.set(`${waterVol} gal ÷ ${kSqFt.toFixed(1)}k sq ft`);
      }
    } else if (type === 'solid') {
      const items = this.lineItemsArray.getRawValue() as Array<{ amountApplied: number; amountUnit: string }>;
      const totalAmount = items.reduce((s, i) => s + (i.amountApplied || 0), 0);
      const unit = items[0]?.amountUnit ?? 'lbs';
      if (totalAmount > 0) {
        const ratePerK = (totalAmount / kSqFt).toFixed(2);
        this.form.controls.applicationRate.setValue(`${ratePerK} ${unit}/1,000 sq ft`, { emitEvent: false });
        this.rateHint.set(`${totalAmount} ${unit} ÷ ${kSqFt.toFixed(1)}k sq ft`);
      }
    }
  }

  private recalculateAllConcentrations(): void {
    const type = this.form.controls.applicationType.value;
    if (type !== 'sprayer') return;
    const waterVol = this.form.controls.waterVolume.value;
    const hints: string[] = [];

    for (let i = 0; i < this.lineItemsArray.length; i++) {
      const ctrl = this.lineItemsArray.at(i);
      const amount = ctrl.get('amountApplied')?.value as number;
      const unit = ctrl.get('amountUnit')?.value as string;

      if (amount && amount > 0 && waterVol && waterVol > 0) {
        const ratio = (amount / waterVol).toFixed(2);
        ctrl.get('productConcentration')?.setValue(`${ratio} ${unit}/gal`, { emitEvent: false });
        hints.push(`${amount} ${unit} ÷ ${waterVol} gal`);
      } else {
        hints.push('');
      }
    }
    this.concentrationHints.set(hints);
  }

  protected save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const selectedZones = this.zones().filter((z) => val.zoneIds.includes(z.id));
    const applicationType = val.applicationType as ApplicationType | undefined;
    const d = val.dateApplied!;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;

    const lineItems: TreatmentLineItem[] = val.lineItems.map((li) => ({
      productId: li.productId,
      productName: li.productName,
      amountApplied: li.amountApplied,
      amountUnit: li.amountUnit,
      productConcentration: applicationType === 'sprayer' ? (li.productConcentration || undefined) : undefined,
    }));

    this.dialogRef.close({
      zoneIds: val.zoneIds,
      zoneNames: selectedZones.map((z) => z.name),
      applicationDate: dateStr,
      applicationType: applicationType || undefined,
      waterVolume: applicationType === 'sprayer' ? (val.waterVolume ?? undefined) : undefined,
      spreaderSetting: applicationType === 'solid' ? (val.spreaderSetting ?? undefined) : undefined,
      applicationRate: val.applicationRate || undefined,
      lineItems,
      gdd: val.gdd ?? undefined,
      temperature: val.temperatureF ?? undefined,
      weatherConditions: val.weatherCondition,
      notes: val.notes,
    } as Partial<Treatment>);
  }
}
