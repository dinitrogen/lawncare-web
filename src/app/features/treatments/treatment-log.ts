import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { Treatment } from '../../core/models/treatment.model';
import { YardZone } from '../../core/models/yard.model';
import { YardService } from '../../core/services/yard.service';
import { TreatmentFormDialogComponent } from './treatment-form-dialog';
import { TreatmentNotesDialogComponent, TreatmentNotesDialogData } from './treatment-notes-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog';

interface SeasonGroup {
  label: string;
  sortKey: number;
  treatments: Treatment[];
}

function getSeason(date: Date): { label: string; sortKey: number; lawnYear: number } {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();

  if (month >= 2 && month <= 4) {
    // Spring: Mar-May → lawn year = calendar year
    return { label: `Spring ${year}`, sortKey: year * 10 + 1, lawnYear: year };
  } else if (month >= 5 && month <= 7) {
    // Summer: Jun-Aug → lawn year = calendar year
    return { label: `Summer ${year}`, sortKey: year * 10 + 2, lawnYear: year };
  } else if (month >= 8 && month <= 10) {
    // Fall: Sep-Nov → lawn year = calendar year
    return { label: `Fall ${year}`, sortKey: year * 10 + 3, lawnYear: year };
  } else {
    // Winter: Dec belongs to current year's lawn year, Jan-Feb to previous year's lawn year
    const lawnYear = month === 11 ? year : year - 1;
    const winterLabel = month === 11 ? year + 1 : year;
    return { label: `Winter ${winterLabel}`, sortKey: lawnYear * 10 + 4, lawnYear };
  }
}

@Component({
  selector: 'app-treatment-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule, MatSelectModule, MatFormFieldModule, DatePipe, DecimalPipe],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Treatment Log</h1>
        <div class="header-controls">
          <mat-form-field appearance="outline" class="year-filter">
            <mat-label>Year</mat-label>
            <mat-select [value]="selectedYear()" (selectionChange)="selectedYear.set($event.value)">
              @for (year of availableYears(); track year) {
                <mat-option [value]="year">{{ year }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-flat-button (click)="openForm()">
            <mat-icon>add</mat-icon> Log Treatment
          </button>
        </div>
      </div>

      @if (filteredSeasonGroups().length) {
        @for (group of filteredSeasonGroups(); track group.label) {
          <h2 class="season-header">{{ group.label }}</h2>
          <mat-card>
            <mat-card-content class="table-container">
              <table mat-table [dataSource]="group.treatments">
                <ng-container matColumnDef="applicationDate">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let t">{{ t.applicationDate | date: 'mediumDate' : 'UTC' }}</td>
                </ng-container>

                <ng-container matColumnDef="products">
                  <th mat-header-cell *matHeaderCellDef>Product(s)</th>
                  <td mat-cell *matCellDef="let t">{{ getProductNames(t) }}</td>
                </ng-container>

                <ng-container matColumnDef="zoneNames">
                  <th mat-header-cell *matHeaderCellDef>Zones</th>
                  <td mat-cell *matCellDef="let t">{{ t.zoneNames?.join(', ') }}</td>
                </ng-container>

                <ng-container matColumnDef="totalArea">
                  <th mat-header-cell *matHeaderCellDef>Area (sq ft)</th>
                  <td mat-cell *matCellDef="let t">{{ getTotalArea(t) | number }}</td>
                </ng-container>

                <ng-container matColumnDef="applicationType">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let t">{{ t.applicationType ?? '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="amountApplied">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let t">
                    @if (getLineItems(t).length) {
                      @for (li of getLineItems(t); track li.productId) {
                        <div>{{ li.amountApplied }} {{ li.amountUnit }}</div>
                      }
                    } @else {
                      {{ t.amountApplied }} {{ t.amountUnit }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="waterVolume">
                  <th mat-header-cell *matHeaderCellDef>Water (gal)</th>
                  <td mat-cell *matCellDef="let t">{{ t.waterVolume ?? '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="productConcentration">
                  <th mat-header-cell *matHeaderCellDef>Concentration</th>
                  <td mat-cell *matCellDef="let t">
                    @if (getLineItems(t).length) {
                      @for (li of getLineItems(t); track li.productId) {
                        <div>{{ li.productConcentration ?? '—' }}</div>
                      }
                    } @else {
                      {{ t.productConcentration ?? '—' }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="applicationRate">
                  <th mat-header-cell *matHeaderCellDef>Rate</th>
                  <td mat-cell *matCellDef="let t">{{ t.applicationRate ?? '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="spreaderSetting">
                  <th mat-header-cell *matHeaderCellDef>Spreader</th>
                  <td mat-cell *matCellDef="let t">{{ t.spreaderSetting ?? '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="gdd">
                  <th mat-header-cell *matHeaderCellDef>GDD</th>
                  <td mat-cell *matCellDef="let t">{{ t.gdd ?? '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="weatherConditions">
                  <th mat-header-cell *matHeaderCellDef>Weather</th>
                  <td mat-cell *matCellDef="let t">{{ t.weatherConditions }}</td>
                </ng-container>

                <ng-container matColumnDef="temperature">
                  <th mat-header-cell *matHeaderCellDef>Temp (°F)</th>
                  <td mat-cell *matCellDef="let t">{{ t.temperature ?? '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="notes">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let t">
                    @if (t.notes) {
                      <button
                        mat-icon-button
                        (click)="viewNotes(t)"
                        aria-label="View notes"
                        matTooltip="View notes"
                      >
                        <mat-icon>sticky_note_2</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let t">
                    <button mat-icon-button (click)="openForm(t)" aria-label="Edit treatment">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteTreatment(t)" aria-label="Delete treatment">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <mat-card>
          <mat-card-content>
            <div class="empty-state">
              <mat-icon class="empty-icon">history</mat-icon>
              <p>No treatments logged yet.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    :host ::ng-deep .content-container {
      max-width: 1400px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .year-filter {
      width: 120px;
    }
    .season-header {
      margin: 24px 0 8px;
      font-size: 1.2rem;
      font-weight: 500;
    }
    .season-header:first-of-type {
      margin-top: 16px;
    }
    .table-container {
      overflow-x: auto;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      opacity: 0.7;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `,
})
export class TreatmentLogComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly treatmentService = inject(TreatmentService);
  private readonly yardService = inject(YardService);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = new DatePipe('en-US');

  protected readonly treatments = signal<Treatment[]>([]);
  protected readonly zones = signal<YardZone[]>([]);
  protected readonly selectedYear = signal(new Date().getFullYear());

  protected readonly displayedColumns = [
    'applicationDate', 'products', 'zoneNames', 'totalArea',
    'applicationType', 'amountApplied', 'waterVolume', 'productConcentration',
    'applicationRate', 'spreaderSetting', 'gdd', 'temperature', 'weatherConditions',
    'notes', 'actions',
  ];

  private readonly zoneAreaMap = computed(() => {
    const map = new Map<string, number>();
    for (const zone of this.zones()) {
      map.set(zone.id, zone.area);
    }
    return map;
  });

  /** All treatments grouped by season. */
  private readonly allSeasonGroups = computed<(SeasonGroup & { lawnYear: number })[]>(() => {
    const map = new Map<string, SeasonGroup & { lawnYear: number }>();
    for (const t of this.treatments()) {
      // Parse date parts to avoid UTC-to-local timezone shift
      const parts = t.applicationDate?.split('T')[0]?.split('-');
      const date = parts
        ? new Date(+parts[0], +parts[1] - 1, +parts[2])
        : new Date(t.applicationDate);
      const { label, sortKey, lawnYear } = getSeason(date);
      let group = map.get(label);
      if (!group) {
        group = { label, sortKey, lawnYear, treatments: [] };
        map.set(label, group);
      }
      group.treatments.push(t);
    }
    return Array.from(map.values()).sort((a, b) => b.sortKey - a.sortKey);
  });

  /** Unique lawn years present in the data, plus the current year. */
  protected readonly availableYears = computed<number[]>(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    for (const g of this.allSeasonGroups()) {
      years.add(g.lawnYear);
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  /** Season groups filtered by the selected lawn year. */
  protected readonly filteredSeasonGroups = computed<SeasonGroup[]>(() => {
    const year = this.selectedYear();
    return this.allSeasonGroups().filter((g) => g.lawnYear === year);
  });

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.treatmentService.getTreatments(this.uid).subscribe((t) => this.treatments.set(t));
    this.yardService.getZones(this.uid).subscribe((z) => this.zones.set(z));
  }

  protected getLineItems(t: Treatment): typeof t.lineItems {
    return t.lineItems ?? [];
  }

  protected getProductNames(t: Treatment): string {
    if (t.lineItems?.length) {
      return t.lineItems.map((li) => li.productName).join(', ');
    }
    return t.productName ?? '—';
  }

  protected getTotalArea(treatment: Treatment): number {
    const map = this.zoneAreaMap();
    return (treatment.zoneIds ?? []).reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
  }

  protected viewNotes(treatment: Treatment): void {
    const dateStr = this.datePipe.transform(treatment.applicationDate, 'mediumDate') ?? '';
    const productNames = treatment.lineItems?.map((li) => li.productName).join(', ')
      ?? treatment.productName
      ?? 'Treatment';
    this.dialog.open(TreatmentNotesDialogComponent, {
      width: '450px',
      data: {
        productName: productNames,
        date: dateStr,
        notes: treatment.notes,
      } as TreatmentNotesDialogData,
    });
  }

  protected openForm(treatment?: Treatment): void {
    const dialogRef = this.dialog.open(TreatmentFormDialogComponent, {
      width: '500px',
      data: { treatment, uid: this.uid },
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Treatment> | undefined) => {
      if (!result) return;
      if (treatment) {
        await this.treatmentService.update(this.uid, treatment.id, result);
      } else {
        await this.treatmentService.add(this.uid, result);
      }
      this.treatmentService.getTreatments(this.uid).subscribe((t) => this.treatments.set(t));
    });
  }

  protected deleteTreatment(treatment: Treatment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Treatment',
        message: 'Delete this treatment record?',
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.treatmentService.delete(this.uid, treatment.id);
        this.treatmentService.getTreatments(this.uid).subscribe((t) => this.treatments.set(t));
      }
    });
  }
}
