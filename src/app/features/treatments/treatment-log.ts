import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { Treatment } from '../../core/models/treatment.model';
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

              <ng-container matColumnDef="zoneName">
                <th mat-header-cell *matHeaderCellDef>Zone</th>
                <td mat-cell *matCellDef="let t">{{ t.zoneName }}</td>
              </ng-container>

              <ng-container matColumnDef="amountApplied">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t">{{ t.amountApplied }} {{ t.amountUnit }}</td>
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
  private readonly dialog = inject(MatDialog);

  protected readonly treatments = signal<Treatment[]>([]);
  protected readonly displayedColumns = ['applicationDate', 'productName', 'zoneName', 'amountApplied', 'weatherConditions', 'actions'];

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.treatmentService.getTreatments(this.uid).subscribe((t) => this.treatments.set(t));
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
