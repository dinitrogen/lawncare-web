import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { YardService } from '../../core/services/yard.service';
import { YardZone } from '../../core/models/yard.model';
import { ZoneFormDialogComponent, ZoneFormDialogData } from './zone-form-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog';
import { ZoneSketchThumbnailComponent } from '../../shared/zone-sketch-thumbnail';

@Component({
  selector: 'app-my-yard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    DecimalPipe,
    ZoneSketchThumbnailComponent,
  ],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">My Yard</h1>
        <button mat-flat-button (click)="openZoneForm()">
          <mat-icon>add</mat-icon> Add Zone
        </button>
      </div>

      <div class="card-grid">
        @for (zone of zones(); track zone.id) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>park</mat-icon>
              <mat-card-title>{{ zone.name }}</mat-card-title>
              <mat-card-subtitle>{{ zone.area | number }} sq ft</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (zone.sketchData?.filledCells?.length) {
                <div class="zone-thumbnail">
                  <app-zone-sketch-thumbnail [sketch]="zone.sketchData!" />
                </div>
              }
              <div class="zone-details">
                <mat-chip>{{ zone.grassType }}</mat-chip>
                <mat-chip>{{ zone.sunExposure }}</mat-chip>
              </div>
              @if (zone.notes) {
                <p class="zone-notes">{{ zone.notes }}</p>
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="openZoneForm(zone)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-button color="warn" (click)="deleteZone(zone)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </mat-card-actions>
          </mat-card>
        } @empty {
          <mat-card>
            <mat-card-content>
              <div class="empty-state">
                <mat-icon class="empty-icon">grass</mat-icon>
                <p>No zones added yet. Click "Add Zone" to get started.</p>
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
    .zone-details {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .zone-thumbnail {
      margin-bottom: 12px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
      padding: 4px;
      max-width: 200px;
    }
    .zone-notes {
      font-size: 14px;
      opacity: 0.8;
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
export class MyYardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly yardService = inject(YardService);
  private readonly dialog = inject(MatDialog);

  protected readonly zones = signal<YardZone[]>([]);

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.yardService.getZones(this.uid).subscribe((z) => this.zones.set(z));
  }

  protected openZoneForm(zone?: YardZone): void {
    const dialogRef = this.dialog.open(ZoneFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { zone } as ZoneFormDialogData,
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<YardZone> | undefined) => {
      if (!result) return;
      if (zone) {
        await this.yardService.update(this.uid, zone.id, result);
      } else {
        await this.yardService.add(this.uid, result);
      }
      this.yardService.getZones(this.uid).subscribe((z) => this.zones.set(z));
    });
  }

  protected deleteZone(zone: YardZone): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Zone',
        message: `Are you sure you want to delete "${zone.name}"?`,
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.yardService.delete(this.uid, zone.id);
        this.yardService.getZones(this.uid).subscribe((z) => this.zones.set(z));
      }
    });
  }
}
