import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { YardService } from '../../core/services/yard.service';
import { TreatmentService } from '../../core/services/treatment.service';
import { GddService } from '../../core/services/gdd.service';
import { SeasonalPlanService } from '../../core/services/seasonal-plan.service';
import { WeatherService } from '../../core/services/weather.service';
import { YardZone } from '../../core/models/yard.model';
import { Treatment } from '../../core/models/treatment.model';
import { DailyGddEntry, BUILT_IN_THRESHOLDS, GddThreshold } from '../../core/models/gdd.model';
import { SeasonalTaskStatus, DEFAULT_SEASONAL_TASKS, SeasonalTask } from '../../core/models/seasonal-plan.model';
import { WeatherReading } from '../../core/models/weather.model';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    DecimalPipe,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Dashboard</h1>

      <div class="card-grid">
        <!-- Weather Card -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>cloud</mat-icon>
            <mat-card-title>Weather Station</mat-card-title>
            @if (weather(); as w) {
              <mat-card-subtitle>Updated {{ formatTimestamp(w.timestamp) }}</mat-card-subtitle>
            }
          </mat-card-header>
          <mat-card-content>
            @if (weather(); as w) {
              <div class="weather-summary">
                <div class="weather-main">
                  <span class="weather-temp">{{ cToF(w.outdoorTempC) }}&deg;F</span>
                  @if (w.feelsLikeC !== null && w.feelsLikeC !== w.outdoorTempC) {
                    <span class="weather-feels-like">Feels like {{ cToF(w.feelsLikeC) }}&deg;F</span>
                  }
                </div>
                <div class="weather-details">
                  @if (w.outdoorHumidityPct !== null) {
                    <span><mat-icon inline>water_drop</mat-icon> {{ w.outdoorHumidityPct }}%</span>
                  }
                  @if (w.soilMoisturePct?.length) {
                    <span><mat-icon inline>opacity</mat-icon> Soil {{ w.soilMoisturePct![0] }}%</span>
                  }
                </div>
              </div>
            } @else if (weatherError()) {
              <p>No weather station data available.</p>
            } @else {
              <p>Loading weather data…</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="navigate('/weather')">
              <mat-icon>open_in_new</mat-icon> View Details
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- GDD Summary Card -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>thermostat</mat-icon>
            <mat-card-title>GDD Tracker</mat-card-title>
            <mat-card-subtitle>{{ currentYear }} Season</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (gddData(); as data) {
              <div class="gdd-summary">
                <div class="gdd-value">
                  <span class="gdd-number">{{ latestCumulativeGdd() }}</span>
                  <span class="gdd-label">Cumulative GDD</span>
                </div>
                <div class="gdd-thresholds">
                  @for (t of activeThresholds(); track t.name) {
                    <mat-chip [highlighted]="latestCumulativeGdd() >= t.gddMin && latestCumulativeGdd() <= t.gddMax">
                      {{ t.name }}: {{ t.gddMin }}-{{ t.gddMax }}
                    </mat-chip>
                  }
                </div>
              </div>
            } @else {
              <p>Configure your zip code in Settings to see GDD data.</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="navigate('/gdd')">
              <mat-icon>open_in_new</mat-icon> View Details
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Zones Summary -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>grass</mat-icon>
            <mat-card-title>My Yard</mat-card-title>
            <mat-card-subtitle>{{ zones()?.length || 0 }} zones</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (zones(); as z) {
              <mat-list>
                @for (zone of z.slice(0, 3); track zone.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>park</mat-icon>
                    <span matListItemTitle>{{ zone.name }}</span>
                    <span matListItemLine>{{ zone.area | number }} sq ft &bull; {{ zone.grassType }}</span>
                  </mat-list-item>
                }
              </mat-list>
              @if (z.length > 3) {
                <p class="more-text">+ {{ z.length - 3 }} more zones</p>
              }
            } @else {
              <p>No zones configured yet.</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="navigate('/yard')">
              <mat-icon>open_in_new</mat-icon> Manage Yard
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Recent Treatments -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>history</mat-icon>
            <mat-card-title>Recent Treatments</mat-card-title>
            <mat-card-subtitle>{{ treatments()?.length || 0 }} total</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (treatments(); as t) {
              <mat-list>
                @for (treat of t.slice(0, 4); track treat.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>eco</mat-icon>
                    <span matListItemTitle>{{ treat.productName }}</span>
                    <span matListItemLine>{{ treat.zoneName }}</span>
                  </mat-list-item>
                }
              </mat-list>
            } @else {
              <p>No treatments recorded yet.</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="navigate('/treatments')">
              <mat-icon>open_in_new</mat-icon> View All
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Seasonal Plan Summary -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>checklist</mat-icon>
            <mat-card-title>Seasonal Plan</mat-card-title>
            <mat-card-subtitle>{{ completedTasks() }}/{{ totalTasks() }} completed</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (upcomingTasks(); as upcoming) {
              <mat-list>
                @for (task of upcoming.slice(0, 3); track task.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>radio_button_unchecked</mat-icon>
                    <span matListItemTitle>{{ task.name }}</span>
                    <span matListItemLine>{{ task.season }}
                      @if (task.gddTriggerMin) {
                        &bull; GDD {{ task.gddTriggerMin }}–{{ task.gddTriggerMax }}
                      }
                    </span>
                  </mat-list-item>
                }
              </mat-list>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="navigate('/seasonal')">
              <mat-icon>open_in_new</mat-icon> View Plan
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .gdd-summary {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .gdd-value {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .gdd-number {
      font-size: 48px;
      font-weight: 300;
      color: var(--primary-color);
    }
    .gdd-label {
      font-size: 14px;
      opacity: 0.7;
    }
    .gdd-thresholds {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .more-text {
      padding-left: 16px;
      opacity: 0.7;
      font-size: 14px;
    }
    .weather-summary {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .weather-main {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .weather-temp {
      font-size: 48px;
      font-weight: 300;
      color: var(--primary-color);
    }
    .weather-feels-like {
      font-size: 14px;
      opacity: 0.7;
    }
    .weather-details {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 14px;
    }
    .weather-details mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      vertical-align: text-bottom;
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly yardService = inject(YardService);
  private readonly treatmentService = inject(TreatmentService);
  private readonly gddService = inject(GddService);
  private readonly seasonalPlanService = inject(SeasonalPlanService);
  private readonly weatherService = inject(WeatherService);
  private readonly router = inject(Router);

  protected readonly currentYear = new Date().getFullYear();

  private readonly uid = computed(() => this.authService.user()?.uid ?? '');

  protected readonly zones = signal<YardZone[] | null>(null);
  protected readonly treatments = signal<Treatment[] | null>(null);
  protected readonly gddData = signal<DailyGddEntry[] | null>(null);
  protected readonly seasonalStatuses = signal<SeasonalTaskStatus[]>([]);
  protected readonly weather = signal<WeatherReading | null>(null);
  protected readonly weatherError = signal(false);

  protected readonly latestCumulativeGdd = computed(() => {
    const data = this.gddData();
    if (!data?.length) return 0;
    return data[data.length - 1].cumulativeGdd;
  });

  protected readonly activeThresholds = computed(() => {
    const gdd = this.latestCumulativeGdd();
    return BUILT_IN_THRESHOLDS.filter((t: GddThreshold) => gdd >= t.gddMin - 100 && gdd <= t.gddMax + 100);
  });

  protected readonly completedTasks = computed(() => this.seasonalStatuses().filter((s) => !!s.completedAt).length);
  protected readonly totalTasks = computed(() => DEFAULT_SEASONAL_TASKS.length);
  protected readonly upcomingTasks = computed(() => {
    const completedIds = new Set(this.seasonalStatuses().filter((s) => !!s.completedAt).map((s) => s.taskId));
    return DEFAULT_SEASONAL_TASKS.filter((t: SeasonalTask) => !completedIds.has(t.id));
  });

  ngOnInit(): void {
    const uid = this.uid();
    if (!uid) return;

    this.yardService.getZones(uid).subscribe((z) => this.zones.set(z));
    this.treatmentService.getTreatments(uid).subscribe((t) => this.treatments.set(t));
    this.seasonalPlanService.getStatuses(uid, this.currentYear).subscribe((s) => this.seasonalStatuses.set(s));
    this.weatherService.getCurrent().subscribe({
      next: (w) => this.weather.set(w),
      error: () => this.weatherError.set(true),
    });

    this.loadGddData(uid);
  }

  private async loadGddData(uid: string): Promise<void> {
    const user = this.authService.user();
    if (!user?.zipCode) return;

    const coords = await this.gddService.geocodeZip(user.zipCode);
    if (!coords) return;

    const startDate = `${this.currentYear}-02-15`;
    const today = new Date().toISOString().split('T')[0];

    try {
      const data = await this.gddService.fetchGddData(
        coords.lat,
        coords.lon,
        startDate,
        today,
        user.gddBase ?? 50,
        user.tempOffset ?? 0,
      );
      this.gddData.set(data);
    } catch {
      // Use cached data if API fails
      this.gddService.getCachedGddData(uid, this.currentYear).subscribe(
        (cached) => { if (cached) this.gddData.set(cached); },
      );
    }
  }

  protected navigate(path: string): void {
    this.router.navigate([path]);
  }

  protected cToF(c: number | null): string {
    if (c === null) return '--';
    return Math.round(c * 9 / 5 + 32).toString();
  }

  protected formatTimestamp(ts: string): string {
    const date = new Date(ts);
    const now = Date.now();
    const diffMin = Math.round((now - date.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
    return date.toLocaleDateString();
  }
}
