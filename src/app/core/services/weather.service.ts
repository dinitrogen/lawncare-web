import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeatherReading, WeatherForecastResponse } from '../models/weather.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCurrent(): Observable<WeatherReading> {
    return this.http.get<WeatherReading>(`${this.apiUrl}/api/weather/current`);
  }

  getHistory(from?: string, to?: string, limit = 500): Observable<WeatherReading[]> {
    let params = new HttpParams().set('limit', limit);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<WeatherReading[]>(`${this.apiUrl}/api/weather/history`, { params });
  }

  getForecast(lat: number, lon: number): Observable<WeatherForecastResponse> {
    const params = new HttpParams().set('lat', lat).set('lon', lon);
    return this.http.get<WeatherForecastResponse>(`${this.apiUrl}/api/weather/forecast`, { params });
  }
}
