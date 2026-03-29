import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { WeatherService } from '../../core/services/weather.service';
import { WeatherReading } from '../../core/models/weather.model';

@Component({
  selector: 'app-weather',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatDividerModule, DecimalPipe],
  template: `
    <div class="content-container">
      <h1 class="page-title">Weather Station</h1>

      @if (weather(); as w) {
        <div class="card-grid">
          <!-- Outdoor -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>wb_sunny</mat-icon>
              <mat-card-title>Outdoor</mat-card-title>
              <mat-card-subtitle>Updated {{ formatTimestamp(w.timestamp) }}</mat-card-subtitle>
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
  `,
})
export class WeatherComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);

  protected readonly weather = signal<WeatherReading | null>(null);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.weatherService.getCurrent().subscribe({
      next: (w) => this.weather.set(w),
      error: () => this.error.set(true),
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
