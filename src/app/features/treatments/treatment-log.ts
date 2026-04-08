import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { Treatment } from '../../core/models/treatment.model';
import { YardZone } from '../../core/models/yard.model';
import { YardService } from '../../core/services/yard.service';
import { TreatmentFormDialogComponent } from './treatment-form-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-treatment-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, DatePipe],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Treatment Log</h1>
        <button mat-flat-button (click)="openForm()">
          <mat-icon>add</mat-icon> Log Treatment
        </button>
      </div>

      @if (treatments().length) {
        <mat-card>
          <mat-card-content class="table-container">
            <table mat-table [dataSource]="treatments()">
              <ng-container matColumnDef="applicationDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.applicationDate | date }}</td>
              </ng-container>

              <ng-container matColumnDef="productName">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let t">{{ t.productName }}</td>
              </ng-container>

              <ng-container matColumnDef="zoneNames">
                <th mat-header-cell *matHeaderCellDef>Zones</th>
                <td mat-cell *matCellDef="let t">{{ t.zoneNames.join(', ') }}</td>
              </ng-container>

              <ng-container matColumnDef="totalArea">
                <th mat-header-cell *matHeaderCellDef>Total Area (sq ft)</th>
                <td mat-cell *matCellDef="let t">{{ getTotalArea(t) }}</td>
              </ng-container>

              <ng-container matColumnDef="amountApplied">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t">{{ t.amountApplied }} {{ t.amountUnit }}</td>
              </ng-container>

              <ng-container matColumnDef="gdd">
                <th mat-header-cell *matHeaderCellDef>GDD</th>
                <td mat-cell *matCellDef="let t">{{ t.gdd ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="weatherConditions">
                <th mat-header-cell *matHeaderCellDef>Weather</th>
                <td mat-cell *matCellDef="let t">{{ t.weatherConditions }}</td>
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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
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

  protected readonly treatments = signal<Treatment[]>([]);
  protected readonly zones = signal<YardZone[]>([]);
  protected readonly displayedColumns = ['applicationDate', 'productName', 'zoneNames', 'totalArea', 'amountApplied', 'gdd', 'weatherConditions', 'actions'];

  private readonly zoneAreaMap = computed(() => {
    const map = new Map<string, number>();
    for (const zone of this.zones()) {
      map.set(zone.id, zone.area);
    }
    return map;
  });

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.treatmentService.getTreatments(this.uid).subscribe((t) => this.treatments.set(t));
    this.yardService.getZones(this.uid).subscribe((z) => this.zones.set(z));
  }

  protected getTotalArea(treatment: Treatment): number {
    const map = this.zoneAreaMap();
    return (treatment.zoneIds ?? []).reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
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
