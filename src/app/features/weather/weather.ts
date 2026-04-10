import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WeatherService } from '../../core/services/weather.service';
import { WeatherReading, DailySummary } from '../../core/models/weather.model';
import { LineChartComponent, ChartSeries } from '../../shared/line-chart';

interface HistoryRow {
  date: string;
  highF: number;
  lowF: number;
  avgHumidity: number;
  avgSoilMoisture: number | null;
  avgSoilTempF: number | null;
  dailyGdd: number;
  cumulativeGdd: number;
}

@Component({
  selector: 'app-weather',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatDividerModule, MatTabsModule,
    MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatButtonModule, MatNativeDateModule,
    DecimalPipe, DatePipe, FormsModule, RouterLink, LineChartComponent,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Weather Station</h1>

      <mat-tab-group>
        <!-- Current Tab -->
        <mat-tab label="Current">
          @if (weather(); as w) {
            <p class="last-updated">Last reading: {{ w.timestamp | date:'medium' }}</p>
            <div class="card-grid">
              <!-- Outdoor -->
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>wb_sunny</mat-icon>
                  <mat-card-title>Outdoor</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="reading-grid">
                    <div class="reading">
                      <span class="reading-value large">{{ cToF(w.outdoorTempC) }}&deg;F</span>
                      <span class="reading-label">Temperature</span>
                    </div>
                    @if (w.feelsLikeC !== null && w.feelsLikeC !== w.outdoorTempC) {
                      <div class="reading">
                        <span class="reading-value">{{ cToF(w.feelsLikeC) }}&deg;F</span>
                        <span class="reading-label">Feels Like</span>
                      </div>
                    }
                    @if (w.outdoorHumidityPct !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ w.outdoorHumidityPct }}%</span>
                        <span class="reading-label">Humidity</span>
                      </div>
                    }
                    @if (w.uvIndex !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ w.uvIndex }}</span>
                        <span class="reading-label">UV Index</span>
                      </div>
                    }
                    @if (w.solarRadiationWm2 !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ w.solarRadiationWm2 | number:'1.0-0' }}</span>
                        <span class="reading-label">Solar (W/m&sup2;)</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Wind -->
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>air</mat-icon>
                  <mat-card-title>Wind</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="reading-grid">
                    <div class="reading">
                      <span class="reading-value large">{{ kmhToMph(w.windSpeedKmh) }} mph</span>
                      <span class="reading-label">Speed</span>
                    </div>
                    @if (w.windGustKmh !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ kmhToMph(w.windGustKmh) }} mph</span>
                        <span class="reading-label">Gust</span>
                      </div>
                    }
                    @if (w.windDirectionDeg !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ windDirection(w.windDirectionDeg) }}</span>
                        <span class="reading-label">Direction</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Rain -->
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>water_drop</mat-icon>
                  <mat-card-title>Rain</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="reading-grid">
                    @if (w.rainRateMmh !== null) {
                      <div class="reading">
                        <span class="reading-value large">{{ mmToIn(w.rainRateMmh) }} in/hr</span>
                        <span class="reading-label">Rain Rate</span>
                      </div>
                    }
                    @if (w.dailyRainMm !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ mmToIn(w.dailyRainMm) }} in</span>
                        <span class="reading-label">Today</span>
                      </div>
                    }
                    @if (w.weeklyRainMm !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ mmToIn(w.weeklyRainMm) }} in</span>
                        <span class="reading-label">This Week</span>
                      </div>
                    }
                    @if (w.monthlyRainMm !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ mmToIn(w.monthlyRainMm) }} in</span>
                        <span class="reading-label">This Month</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Soil Moisture -->
              @if (w.soilMoisturePct?.length) {
                <mat-card>
                  <mat-card-header>
                    <mat-icon mat-card-avatar>opacity</mat-icon>
                    <mat-card-title>Soil Moisture</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="reading-grid">
                      @for (pct of w.soilMoisturePct; track $index) {
                        <div class="reading">
                          <span class="reading-value large">{{ pct }}%</span>
                          <span class="reading-label">Channel {{ $index + 1 }}</span>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Soil Temperature -->
              @if (w.soilTempC?.length) {
                <mat-card>
                  <mat-card-header>
                    <mat-icon mat-card-avatar>thermostat</mat-icon>
                    <mat-card-title>Soil Temperature</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="reading-grid">
                      @for (temp of w.soilTempC; track $index) {
                        <div class="reading">
                          <span class="reading-value large">{{ cToF(temp) }}&deg;F</span>
                          <span class="reading-label">Channel {{ $index + 1 }}</span>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Pressure -->
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>speed</mat-icon>
                  <mat-card-title>Pressure</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="reading-grid">
                    @if (w.pressureRelHpa !== null) {
                      <div class="reading">
                        <span class="reading-value large">{{ hpaToInHg(w.pressureRelHpa) }} inHg</span>
                        <span class="reading-label">Relative</span>
                      </div>
                    }
                    @if (w.pressureAbsHpa !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ hpaToInHg(w.pressureAbsHpa) }} inHg</span>
                        <span class="reading-label">Absolute</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Indoor -->
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>home</mat-icon>
                  <mat-card-title>Indoor</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="reading-grid">
                    @if (w.indoorTempC !== null) {
                      <div class="reading">
                        <span class="reading-value large">{{ cToF(w.indoorTempC) }}&deg;F</span>
                        <span class="reading-label">Temperature</span>
                      </div>
                    }
                    @if (w.indoorHumidityPct !== null) {
                      <div class="reading">
                        <span class="reading-value">{{ w.indoorHumidityPct }}%</span>
                        <span class="reading-label">Humidity</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          } @else if (error()) {
            <mat-card>
              <mat-card-content>
                <p>No weather station data available. Make sure your Ecowitt gateway is configured and uploading data.</p>
              </mat-card-content>
            </mat-card>
          } @else {
            <p>Loading weather data…</p>
          }
        </mat-tab>

        <!-- History Tab -->
        <mat-tab label="History">
          <div class="history-controls">
            <mat-form-field appearance="outline">
              <mat-label>From</mat-label>
              <input matInput [matDatepicker]="fromPicker" [(ngModel)]="historyFrom">
              <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>To</mat-label>
              <input matInput [matDatepicker]="toPicker" [(ngModel)]="historyTo">
              <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="gdd-base-field">
              <mat-label>GDD Base (°F)</mat-label>
              <input matInput type="number" [(ngModel)]="gddBase">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>GDD Start Date</mat-label>
              <input matInput [matDatepicker]="gddStartPicker" [(ngModel)]="gddStartDate">
              <mat-datepicker-toggle matIconSuffix [for]="gddStartPicker"></mat-datepicker-toggle>
              <mat-datepicker #gddStartPicker></mat-datepicker>
            </mat-form-field>
            <button mat-flat-button (click)="loadHistory()">
              <mat-icon>search</mat-icon> Load
            </button>
          </div>

          @if (historyLoading()) {
            <p>Loading history…</p>
          } @else if (dailySummaries().length) {
            <div class="table-container">
              <table mat-table [dataSource]="sortedSummaries()" matSort
                     (matSortChange)="onSortChange($event)">
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                  <td mat-cell *matCellDef="let row">
                    <a [routerLink]="['/weather/day', row.date]" class="date-link">{{ row.date }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="highF">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>High (°F)</th>
                  <td mat-cell *matCellDef="let row">{{ row.highF | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="lowF">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Low (°F)</th>
                  <td mat-cell *matCellDef="let row">{{ row.lowF | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="avgHumidity">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Humidity (%)</th>
                  <td mat-cell *matCellDef="let row">{{ row.avgHumidity | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="avgSoilMoisture">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Soil (%)</th>
                  <td mat-cell *matCellDef="let row">
                    {{ row.avgSoilMoisture !== null ? (row.avgSoilMoisture | number:'1.0-0') : '--' }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="avgSoilTempF">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Soil (°F)</th>
                  <td mat-cell *matCellDef="let row">
                    {{ row.avgSoilTempF !== null ? (row.avgSoilTempF | number:'1.0-0') : '--' }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="dailyGdd">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Daily GDD</th>
                  <td mat-cell *matCellDef="let row">{{ row.dailyGdd | number:'1.1-1' }}</td>
                </ng-container>
                <ng-container matColumnDef="cumulativeGdd">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Cumulative GDD</th>
                  <td mat-cell *matCellDef="let row">{{ row.cumulativeGdd | number:'1.0-0' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="historyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: historyColumns;"></tr>
              </table>
            </div>
          } @else {
            <p class="empty-hint">Select a date range and click Load to view weather history.</p>
          }
        </mat-tab>

        <!-- Day Detail Tab -->
        <mat-tab label="Day Detail">
          <div class="history-controls">
            <div class="preset-buttons">
              <button mat-stroked-button (click)="setDetailRange('today')">Today</button>
              <button mat-stroked-button (click)="setDetailRange('week')">Past Week</button>
              <button mat-stroked-button (click)="setDetailRange('month')">Past Month</button>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>From</mat-label>
              <input matInput [matDatepicker]="detailFromPicker" [(ngModel)]="detailFrom">
              <mat-datepicker-toggle matIconSuffix [for]="detailFromPicker"></mat-datepicker-toggle>
              <mat-datepicker #detailFromPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>To</mat-label>
              <input matInput [matDatepicker]="detailToPicker" [(ngModel)]="detailTo">
              <mat-datepicker-toggle matIconSuffix [for]="detailToPicker"></mat-datepicker-toggle>
              <mat-datepicker #detailToPicker></mat-datepicker>
            </mat-form-field>
            <button mat-flat-button (click)="loadDayDetail()">
              <mat-icon>search</mat-icon> Load
            </button>
          </div>

          @if (dayDetailLoading()) {
            <p>Loading day data…</p>
          } @else if (dayReadings().length) {
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>thermostat</mat-icon>
                <mat-card-title>Temperature</mat-card-title>
                <mat-card-subtitle>
                  High: {{ dayHighF() | number:'1.0-0' }}°F · Low: {{ dayLowF() | number:'1.0-0' }}°F
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <app-line-chart [series]="dayTempSeries()" />
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>water_drop</mat-icon>
                <mat-card-title>Humidity</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <app-line-chart [series]="dayHumiditySeries()" />
              </mat-card-content>
            </mat-card>

            @if (daySoilData()) {
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>opacity</mat-icon>
                  <mat-card-title>Soil Moisture</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <app-line-chart [series]="daySoilSeries()" />
                </mat-card-content>
              </mat-card>
            }

            @if (daySoilTempData()) {
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>thermostat</mat-icon>
                  <mat-card-title>Soil Temperature</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <app-line-chart [series]="daySoilTempSeries()" />
                </mat-card-content>
              </mat-card>
            }

            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>air</mat-icon>
                <mat-card-title>Wind</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <app-line-chart [series]="dayWindSeries()" />
              </mat-card-content>
            </mat-card>
          } @else {
            <p class="empty-hint">Select a date and click View Day to see detailed hourly data.</p>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .reading-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 8px 0;
    }
    .reading {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
    }
    .reading-value {
      font-size: 20px;
      font-weight: 500;
    }
    .reading-value.large {
      font-size: 36px;
      font-weight: 300;
      color: var(--primary-color);
    }
    .reading-label {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }
    .last-updated {
      padding: 16px 0 8px;
      font-size: 14px;
      opacity: 0.7;
    }
    .history-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding: 16px 0;
    }
    .preset-buttons {
      display: flex;
      gap: 8px;
    }
    .gdd-base-field {
      max-width: 120px;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    .empty-hint {
      padding: 32px 0;
      text-align: center;
      opacity: 0.7;
    }
    .date-link {
      color: var(--primary-color);
      text-decoration: none;
    }
    .date-link:hover {
      text-decoration: underline;
    }
    mat-card {
      margin-bottom: 16px;
    }
  `,
})
export class WeatherComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);

  protected readonly weather = signal<WeatherReading | null>(null);
  protected readonly error = signal(false);

  // History tab state
  protected historyFrom = new Date(new Date().getFullYear(), 0, 1);
  protected historyTo = new Date();
  protected gddBase = 50;
  protected gddStartDate = new Date(new Date().getFullYear(), 1, 15);
  protected readonly historyLoading = signal(false);
  protected readonly dailySummaries = signal<HistoryRow[]>([]);
  protected readonly sortDirection = signal<'asc' | 'desc'>('desc');
  protected readonly sortActive = signal('date');
  protected readonly historyColumns = ['date', 'highF', 'lowF', 'avgHumidity', 'avgSoilMoisture', 'avgSoilTempF', 'dailyGdd', 'cumulativeGdd'];

  // Day Detail tab state
  protected detailFrom = new Date();
  protected detailTo = new Date();
  protected readonly dayDetailLoading = signal(false);
  protected readonly dayReadings = signal<WeatherReading[]>([]);

  private readonly sortedDayReadings = computed(() =>
    [...this.dayReadings()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));

  protected readonly dayHighF = computed(() => {
    const temps = this.dayReadings().filter(r => r.outdoorTempC !== null).map(r => r.outdoorTempC! * 9 / 5 + 32);
    return temps.length ? Math.max(...temps) : 0;
  });

  protected readonly dayLowF = computed(() => {
    const temps = this.dayReadings().filter(r => r.outdoorTempC !== null).map(r => r.outdoorTempC! * 9 / 5 + 32);
    return temps.length ? Math.min(...temps) : 0;
  });

  protected readonly dayTempSeries = computed<ChartSeries[]>(() => [{
    label: 'Temperature', unit: '°F', color: '#e53935',
    data: this.sortedDayReadings().filter(r => r.outdoorTempC !== null)
      .map(r => ({ time: r.timestamp, value: r.outdoorTempC! * 9 / 5 + 32 })),
  }]);

  protected readonly dayHumiditySeries = computed<ChartSeries[]>(() => [{
    label: 'Humidity', unit: '%', color: '#1e88e5',
    data: this.sortedDayReadings().filter(r => r.outdoorHumidityPct !== null)
      .map(r => ({ time: r.timestamp, value: r.outdoorHumidityPct! })),
  }]);

  protected readonly daySoilData = computed(() =>
    this.dayReadings().some(r => r.soilMoisturePct?.length));

  protected readonly daySoilTempData = computed(() =>
    this.dayReadings().some(r => r.soilTempC?.length));

  protected readonly daySoilSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedDayReadings();
    const colors = ['#43a047', '#fb8c00', '#8e24aa', '#00acc1'];
    const maxCh = Math.max(...recs.map(r => r.soilMoisturePct?.length ?? 0), 0);
    const result: ChartSeries[] = [];
    for (let ch = 0; ch < maxCh; ch++) {
      result.push({
        label: `Ch ${ch + 1}`, unit: '%', color: colors[ch % colors.length],
        data: recs.filter(r => r.soilMoisturePct && r.soilMoisturePct.length > ch)
          .map(r => ({ time: r.timestamp, value: r.soilMoisturePct![ch] })),
      });
    }
    return result;
  });

  protected readonly daySoilTempSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedDayReadings();
    const colors = ['#e53935', '#fb8c00', '#8e24aa', '#00acc1'];
    const maxCh = Math.max(...recs.map(r => r.soilTempC?.length ?? 0), 0);
    const result: ChartSeries[] = [];
    for (let ch = 0; ch < maxCh; ch++) {
      result.push({
        label: `Ch ${ch + 1}`, unit: '°F', color: colors[ch % colors.length],
        data: recs.filter(r => r.soilTempC && r.soilTempC.length > ch)
          .map(r => ({ time: r.timestamp, value: r.soilTempC![ch] * 9 / 5 + 32 })),
      });
    }
    return result;
  });

  protected readonly dayWindSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedDayReadings();
    const series: ChartSeries[] = [{
      label: 'Wind Speed', unit: 'mph', color: '#5e35b1',
      data: recs.filter(r => r.windSpeedKmh !== null)
        .map(r => ({ time: r.timestamp, value: r.windSpeedKmh! * 0.621371 })),
    }];
    if (recs.some(r => r.windGustKmh !== null)) {
      series.push({
        label: 'Gusts', unit: 'mph', color: '#ab47bc',
        data: recs.filter(r => r.windGustKmh !== null)
          .map(r => ({ time: r.timestamp, value: r.windGustKmh! * 0.621371 })),
      });
    }
    return series;
  });

  protected readonly sortedSummaries = computed(() => {
    const data = [...this.dailySummaries()];
    const dir = this.sortDirection();
    const col = this.sortActive() as keyof HistoryRow;
    data.sort((a, b) => {
      const aVal = a[col] ?? 0;
      const bVal = b[col] ?? 0;
      return dir === 'asc'
        ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
        : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    });
    return data;
  });

  ngOnInit(): void {
    this.weatherService.getCurrent().subscribe({
      next: (w) => this.weather.set(w),
      error: () => this.error.set(true),
    });
  }

  protected loadHistory(): void {
    this.historyLoading.set(true);
    const from = this.historyFrom.toISOString();
    const to = new Date(this.historyTo.getTime() + 86400000).toISOString(); // include full day
    this.weatherService.getDailySummaries(from, to).subscribe({
      next: (summaries) => {
        this.dailySummaries.set(this.toHistoryRows(summaries));
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  protected onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active || 'date');
    this.sortDirection.set((sort.direction || 'desc') as 'asc' | 'desc');
  }

  protected loadDayDetail(): void {
    this.dayDetailLoading.set(true);
    const from = new Date(this.detailFrom.getFullYear(), this.detailFrom.getMonth(), this.detailFrom.getDate()).toISOString();
    const to = new Date(this.detailTo.getFullYear(), this.detailTo.getMonth(), this.detailTo.getDate(), 23, 59, 59).toISOString();
    this.weatherService.getHistory(from, to, 50000).subscribe({
      next: (readings) => {
        this.dayReadings.set(readings);
        this.dayDetailLoading.set(false);
      },
      error: () => this.dayDetailLoading.set(false),
    });
  }

  protected setDetailRange(preset: 'today' | 'week' | 'month'): void {
    const now = new Date();
    this.detailTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (preset) {
      case 'today':
        this.detailFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        this.detailFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        this.detailFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
    }
    this.loadDayDetail();
  }

  private toHistoryRows(summaries: DailySummary[]): HistoryRow[] {
    const gddStartStr = this.gddStartDate.toISOString().split('T')[0];
    const sorted = [...summaries].sort((a, b) => a.date.localeCompare(b.date));
    let cumGdd = 0;

    return sorted.map((s) => {
      const highF = s.highTempC * 9 / 5 + 32;
      const lowF = s.lowTempC * 9 / 5 + 32;
      const avgTemp = (highF + lowF) / 2;
      const dailyGdd = s.date >= gddStartStr ? Math.max(0, avgTemp - this.gddBase) : 0;
      cumGdd += dailyGdd;

      return {
        date: s.date,
        highF,
        lowF,
        avgHumidity: s.avgHumidityPct,
        avgSoilMoisture: s.avgSoilMoisturePct,
        avgSoilTempF: s.avgSoilTempC !== null ? s.avgSoilTempC * 9 / 5 + 32 : null,
        dailyGdd,
        cumulativeGdd: cumGdd,
      };
    });
  }

  protected cToF(c: number | null): string {
    if (c === null) return '--';
    return Math.round(c * 9 / 5 + 32).toString();
  }

  protected kmhToMph(kmh: number | null): string {
    if (kmh === null) return '--';
    return (kmh * 0.621371).toFixed(1);
  }

  protected mmToIn(mm: number | null): string {
    if (mm === null) return '--';
    return (mm / 25.4).toFixed(2);
  }

  protected hpaToInHg(hpa: number | null): string {
    if (hpa === null) return '--';
    return (hpa * 0.02953).toFixed(2);
  }

  protected windDirection(deg: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
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
