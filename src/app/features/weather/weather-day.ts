import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, DecimalPipe } from '@angular/common';
import { WeatherService } from '../../core/services/weather.service';
import { WeatherReading } from '../../core/models/weather.model';
import { LineChartComponent, ChartSeries } from '../../shared/line-chart';

@Component({
  selector: 'app-weather-day',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    DatePipe, DecimalPipe, RouterLink, LineChartComponent,
  ],
  template: `
    <div class="content-container">
      <div class="day-header">
        <button mat-icon-button routerLink="/weather">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="page-title">{{ dateStr() | date:'fullDate' }}</h1>
      </div>

      @if (loading()) {
        <p>Loading day data…</p>
      } @else if (readings().length) {
        <!-- Temperature chart -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>thermostat</mat-icon>
            <mat-card-title>Temperature</mat-card-title>
            <mat-card-subtitle>
              High: {{ highF() | number:'1.0-0' }}°F · Low: {{ lowF() | number:'1.0-0' }}°F
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <app-line-chart [series]="tempSeries()" />
          </mat-card-content>
        </mat-card>

        <!-- Humidity chart -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>water_drop</mat-icon>
            <mat-card-title>Humidity</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-line-chart [series]="humiditySeries()" />
          </mat-card-content>
        </mat-card>

        <!-- Soil Moisture chart (if available) -->
        @if (hasSoilData()) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>opacity</mat-icon>
              <mat-card-title>Soil Moisture</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-line-chart [series]="soilSeries()" />
            </mat-card-content>
          </mat-card>
        }

        <!-- Wind chart -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>air</mat-icon>
            <mat-card-title>Wind Speed</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-line-chart [series]="windSeries()" />
          </mat-card-content>
        </mat-card>

        <!-- Pressure chart -->
        @if (hasPressureData()) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>speed</mat-icon>
              <mat-card-title>Barometric Pressure</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-line-chart [series]="pressureSeries()" />
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <mat-card>
          <mat-card-content>
            <p>No data available for this date.</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .day-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .day-header .page-title {
      margin: 0;
    }
    mat-card {
      margin-bottom: 16px;
    }
  `,
})
export class WeatherDayComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly weatherService = inject(WeatherService);

  protected readonly dateStr = signal('');
  protected readonly loading = signal(false);
  protected readonly readings = signal<WeatherReading[]>([]);

  protected readonly highF = computed(() => {
    const temps = this.readings()
      .filter(r => r.outdoorTempC !== null)
      .map(r => r.outdoorTempC! * 9 / 5 + 32);
    return temps.length ? Math.max(...temps) : 0;
  });

  protected readonly lowF = computed(() => {
    const temps = this.readings()
      .filter(r => r.outdoorTempC !== null)
      .map(r => r.outdoorTempC! * 9 / 5 + 32);
    return temps.length ? Math.min(...temps) : 0;
  });

  protected readonly tempSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedReadings();
    return [{
      label: 'Temperature',
      unit: '°F',
      color: '#e53935',
      data: recs
        .filter(r => r.outdoorTempC !== null)
        .map(r => ({ time: r.timestamp, value: r.outdoorTempC! * 9 / 5 + 32 })),
    }];
  });

  protected readonly humiditySeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedReadings();
    return [{
      label: 'Humidity',
      unit: '%',
      color: '#1e88e5',
      data: recs
        .filter(r => r.outdoorHumidityPct !== null)
        .map(r => ({ time: r.timestamp, value: r.outdoorHumidityPct! })),
    }];
  });

  protected readonly hasSoilData = computed(() =>
    this.readings().some(r => r.soilMoisturePct?.length));

  protected readonly soilSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedReadings();
    const colors = ['#43a047', '#fb8c00', '#8e24aa', '#00acc1'];
    // Determine max channels across readings
    const maxChannels = Math.max(...recs.map(r => r.soilMoisturePct?.length ?? 0), 0);
    const series: ChartSeries[] = [];
    for (let ch = 0; ch < maxChannels; ch++) {
      series.push({
        label: `Channel ${ch + 1}`,
        unit: '%',
        color: colors[ch % colors.length],
        data: recs
          .filter(r => r.soilMoisturePct && r.soilMoisturePct.length > ch)
          .map(r => ({ time: r.timestamp, value: r.soilMoisturePct![ch] })),
      });
    }
    return series;
  });

  protected readonly windSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedReadings();
    const series: ChartSeries[] = [{
      label: 'Wind Speed',
      unit: 'mph',
      color: '#5e35b1',
      data: recs
        .filter(r => r.windSpeedKmh !== null)
        .map(r => ({ time: r.timestamp, value: r.windSpeedKmh! * 0.621371 })),
    }];
    if (recs.some(r => r.windGustKmh !== null)) {
      series.push({
        label: 'Gusts',
        unit: 'mph',
        color: '#ab47bc',
        data: recs
          .filter(r => r.windGustKmh !== null)
          .map(r => ({ time: r.timestamp, value: r.windGustKmh! * 0.621371 })),
      });
    }
    return series;
  });

  protected readonly hasPressureData = computed(() =>
    this.readings().some(r => r.pressureRelHpa !== null));

  protected readonly pressureSeries = computed<ChartSeries[]>(() => {
    const recs = this.sortedReadings();
    return [{
      label: 'Pressure',
      unit: 'inHg',
      color: '#6d4c41',
      data: recs
        .filter(r => r.pressureRelHpa !== null)
        .map(r => ({ time: r.timestamp, value: r.pressureRelHpa! * 0.02953 })),
    }];
  });

  private readonly sortedReadings = computed(() =>
    [...this.readings()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));

  ngOnInit(): void {
    const date = this.route.snapshot.paramMap.get('date') ?? '';
    this.dateStr.set(date);
    this.loadDay(date);
  }

  private loadDay(date: string): void {
    this.loading.set(true);
    const from = new Date(`${date}T00:00:00`).toISOString();
    const to = new Date(`${date}T23:59:59`).toISOString();
    this.weatherService.getHistory(from, to, 500).subscribe({
      next: (readings) => {
        this.readings.set(readings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
