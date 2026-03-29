import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { GddService } from '../../core/services/gdd.service';
import { DailyGddEntry, BUILT_IN_THRESHOLDS, GddThreshold } from '../../core/models/gdd.model';

@Component({
  selector: 'app-gdd-tracker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    DecimalPipe,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">GDD Tracker</h1>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!hasZip()) {
        <mat-card>
          <mat-card-content>
            <div class="empty-state">
              <mat-icon class="empty-icon">location_off</mat-icon>
              <p>Configure your zip code in Settings to fetch GDD data.</p>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Summary Card -->
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="gdd-hero">
              <div class="gdd-value">
                <span class="gdd-number">{{ latestCumulative() | number:'1.0-0' }}</span>
                <span class="gdd-sublabel">Cumulative GDD (base {{ baseTemp() }}°F)</span>
              </div>
              <div class="gdd-actions">
                <button mat-stroked-button (click)="refresh()">
                  <mat-icon>refresh</mat-icon> Refresh
                </button>
                <a mat-stroked-button
                  [href]="msuUrl()"
                  target="_blank"
                  rel="noopener">
                  <mat-icon>open_in_new</mat-icon> MSU GDD Tracker
                </a>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Thresholds Card -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Activity Thresholds</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="threshold-list">
              @for (t of thresholds; track t.name) {
                <div class="threshold-item" [class.active]="isInRange(t)" [class.passed]="isPassed(t)">
                  <div class="threshold-info">
                    <strong>{{ t.name }}</strong>
                <span>{{ t.gddMin }} – {{ t.gddMax }} GDD</span>
                  </div>
                  <mat-icon>
                    @if (isPassed(t)) {
                      check_circle
                    } @else if (isInRange(t)) {
                      warning
                    } @else {
                      schedule
                    }
                  </mat-icon>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Daily Data -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Daily Data ({{ gddData().length }} days)</mat-panel-title>
          </mat-expansion-panel-header>
          @if (gddData().length) {
            <div class="table-container">
              <table mat-table [dataSource]="recentData()">
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let d">{{ d.date }}</td>
                </ng-container>
                <ng-container matColumnDef="high">
                  <th mat-header-cell *matHeaderCellDef>High (°F)</th>
                  <td mat-cell *matCellDef="let d">{{ d.tempMax | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="low">
                  <th mat-header-cell *matHeaderCellDef>Low (°F)</th>
                  <td mat-cell *matCellDef="let d">{{ d.tempMin | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="dailyGdd">
                  <th mat-header-cell *matHeaderCellDef>Daily GDD</th>
                  <td mat-cell *matCellDef="let d">{{ d.gdd | number:'1.1-1' }}</td>
                </ng-container>
                <ng-container matColumnDef="cumulativeGdd">
                  <th mat-header-cell *matHeaderCellDef>Cumulative</th>
                  <td mat-cell *matCellDef="let d">{{ d.cumulativeGdd | number:'1.0-0' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="dailyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: dailyColumns;"></tr>
              </table>
            </div>
          }
        </mat-expansion-panel>
      }
    </div>
  `,
  styles: `
    .loading-center {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .summary-card {
      margin-bottom: 16px;
    }
    .gdd-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .gdd-value {
      display: flex;
      flex-direction: column;
    }
    .gdd-number {
      font-size: 56px;
      font-weight: 300;
      color: var(--primary-color);
      line-height: 1;
    }
    .gdd-sublabel {
      font-size: 14px;
      opacity: 0.7;
    }
    .gdd-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .threshold-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .threshold-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e0e0e0);
    }
    .threshold-item.active {
      border-color: #ff9800;
      background: rgba(255, 152, 0, 0.08);
    }
    .threshold-item.passed {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.08);
    }
    .threshold-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .threshold-info span {
      font-size: 13px;
      opacity: 0.7;
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
export class GddTrackerComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly gddService = inject(GddService);

  protected readonly thresholds = BUILT_IN_THRESHOLDS;
  protected readonly dailyColumns = ['date', 'high', 'low', 'dailyGdd', 'cumulativeGdd'];

  protected readonly loading = signal(false);
  protected readonly gddData = signal<DailyGddEntry[]>([]);
  protected readonly hasZip = signal(false);

  protected readonly latestCumulative = computed(() => {
    const data = this.gddData();
    return data.length ? data[data.length - 1].cumulativeGdd : 0;
  });

  protected readonly baseTemp = computed(() => this.authService.user()?.gddBase ?? 50);

  protected readonly msuUrl = computed(() => {
    const zip = this.authService.user()?.zipCode ?? '';
    return zip
      ? `https://gddtracker.msu.edu/?model=7&?zipcode=${encodeURIComponent(zip)}`
      : 'https://gddtracker.msu.edu/';
  });

  protected readonly recentData = computed(() => {
    return [...this.gddData()].reverse();
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected isInRange(t: GddThreshold): boolean {
    const gdd = this.latestCumulative();
    return gdd >= t.gddMin && gdd <= t.gddMax;
  }

  protected isPassed(t: GddThreshold): boolean {
    return this.latestCumulative() > t.gddMax;
  }

  protected refresh(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    const user = this.authService.user();
    if (!user?.zipCode) {
      this.hasZip.set(false);
      return;
    }
    this.hasZip.set(true);
    this.loading.set(true);

    try {
      const coords = await this.gddService.geocodeZip(user.zipCode);
      if (!coords) {
        this.loading.set(false);
        return;
      }

      const year = new Date().getFullYear();
      const month = String(user.gddStartMonth ?? 1).padStart(2, '0');
      const day = String(user.gddStartDay ?? 1).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;
      const today = new Date().toISOString().split('T')[0];
      const data = await this.gddService.fetchGddData(
        coords.lat,
        coords.lon,
        startDate,
        today,
        user.gddBase ?? 50,
        user.tempOffset ?? 0,
      );
      this.gddData.set(data);

      // Cache the data
      await this.gddService.cacheGddData(user.uid, year, data);
    } catch {
      // Try cached data
      const year = new Date().getFullYear();
      this.gddService.getCachedGddData(user!.uid, year).subscribe((cached) => {
        if (cached) this.gddData.set(cached);
      });
    } finally {
      this.loading.set(false);
    }
  }
}
