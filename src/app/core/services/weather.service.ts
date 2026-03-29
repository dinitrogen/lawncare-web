import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeatherReading } from '../models/weather.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCurrent(): Observable<WeatherReading> {
    return this.http.get<WeatherReading>(`${this.apiUrl}/api/weather/current`);
  }

  getHistory(hours: number = 24): Observable<WeatherReading[]> {
    return this.http.get<WeatherReading[]>(`${this.apiUrl}/api/weather/history?hours=${hours}`);
  }
}
