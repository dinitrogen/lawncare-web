import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment, MaintenanceLog } from '../../core/models/equipment.model';
import { EquipmentFormDialogComponent } from './equipment-form-dialog';
import { MaintenanceLogDialogComponent } from './maintenance-log-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-equipment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatListModule,
  ],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Equipment</h1>
        <button mat-flat-button (click)="openEquipForm()">
          <mat-icon>add</mat-icon> Add Equipment
        </button>
      </div>

      <div class="card-grid">
        @for (equip of equipment(); track equip.id) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>build</mat-icon>
              <mat-card-title>{{ equip.name }}</mat-card-title>
              <mat-card-subtitle>{{ equip.type }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (equip.brand || equip.model) {
                <p class="detail">{{ equip.brand }} {{ equip.model }}</p>
              }
              @if (equip.purchaseDate) {
                <p class="detail">Purchased: {{ equip.purchaseDate }}</p>
              }
              @if (equip.notes) {
                <p class="detail notes">{{ equip.notes }}</p>
              }

              <!-- Maintenance logs for this equipment -->
              <mat-expansion-panel class="logs-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>Maintenance History</mat-panel-title>
                </mat-expansion-panel-header>
                @if (getLogsForEquipment(equip.id); as equipLogs) {
                  @if (equipLogs.length) {
                    <mat-list>
                      @for (log of equipLogs; track log.id) {
                        <mat-list-item>
                          <mat-icon matListItemIcon>handyman</mat-icon>
                          <span matListItemTitle>{{ log.type }}</span>
                          <span matListItemLine>{{ log.date }} &bull; {{ log.notes }}</span>
                        </mat-list-item>
                      }
                    </mat-list>
                  } @else {
                    <p class="no-logs">No maintenance logged yet.</p>
                  }
                }
                <button mat-button (click)="openLogForm(equip)">
                  <mat-icon>add</mat-icon> Add Log Entry
                </button>
              </mat-expansion-panel>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="openEquipForm(equip)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-button color="warn" (click)="deleteEquip(equip)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </mat-card-actions>
          </mat-card>
        } @empty {
          <mat-card>
            <mat-card-content>
              <div class="empty-state">
                <mat-icon class="empty-icon">build</mat-icon>
                <p>No equipment added yet.</p>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
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
    .detail {
      font-size: 14px;
      margin: 4px 0;
    }
    .notes {
      opacity: 0.8;
    }
    .logs-panel {
      margin-top: 8px;
    }
    .no-logs {
      font-size: 14px;
      opacity: 0.7;
      padding: 8px 0;
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
export class EquipmentComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly dialog = inject(MatDialog);

  protected readonly equipment = signal<Equipment[]>([]);
  protected readonly logs = signal<MaintenanceLog[]>([]);

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.equipmentService.getEquipment(this.uid).subscribe((e) => this.equipment.set(e));
    this.equipmentService.getLogs(this.uid).subscribe((l) => this.logs.set(l));
  }

  protected getLogsForEquipment(equipId: string): MaintenanceLog[] {
    return this.logs().filter((l) => l.equipmentId === equipId);
  }

  protected openEquipForm(equip?: Equipment): void {
    const dialogRef = this.dialog.open(EquipmentFormDialogComponent, {
      width: '500px',
      data: { equipment: equip },
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Equipment> | undefined) => {
      if (!result) return;
      if (equip) {
        await this.equipmentService.updateEquipment(this.uid, equip.id, result);
      } else {
        await this.equipmentService.addEquipment(this.uid, result);
      }
      this.equipmentService.getEquipment(this.uid).subscribe((e) => this.equipment.set(e));
    });
  }

  protected openLogForm(equip: Equipment): void {
    const dialogRef = this.dialog.open(MaintenanceLogDialogComponent, {
      width: '500px',
      data: { equipmentId: equip.id, equipmentName: equip.name },
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<MaintenanceLog> | undefined) => {
      if (!result) return;
      await this.equipmentService.addLog(this.uid, result);
      this.equipmentService.getLogs(this.uid).subscribe((l) => this.logs.set(l));
    });
  }

  protected deleteEquip(equip: Equipment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Equipment',
        message: `Delete "${equip.name}"?`,
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.equipmentService.deleteEquipment(this.uid, equip.id);
        this.equipmentService.getEquipment(this.uid).subscribe((e) => this.equipment.set(e));
      }
    });
  }
}
