import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DailyGddEntry } from '../models/gdd.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GddService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetch GDD data from the API. The API handles Open-Meteo fetching,
   * GDD calculation, and Firestore caching based on the user's profile settings.
   * The parameters are kept for backward compatibility but are not used —
   * the API reads settings from the authenticated user's profile.
   */
  async fetchGddData(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string,
    baseTempF: number,
    tempOffset = 0,
  ): Promise<DailyGddEntry[]> {
    return firstValueFrom(
      this.http.get<DailyGddEntry[]>(`${this.apiUrl}/api/gdd`),
    );
  }

  /** Cache GDD data — now handled server-side by the API */
  async cacheGddData(uid: string, year: number, data: DailyGddEntry[]): Promise<void> {
    // Caching is handled by the API automatically
  }

  /** Get cached GDD data — now fetched from the API */
  getCachedGddData(uid: string, year: number) {
    return this.http.get<DailyGddEntry[] | null>(`${this.apiUrl}/api/gdd`);
  }

  /** Geocode a US zip code to lat/lon using Zippopotam.us */
  async geocodeZip(zip: string): Promise<{ lat: number; lon: number } | null> {
    const url = `https://api.zippopotam.us/us/${encodeURIComponent(zip)}`;
    const resp = await firstValueFrom(
      this.http.get<{ places: { latitude: string; longitude: string }[] }>(url),
    ).catch(() => null);
    if (resp?.places?.length) {
      return { lat: parseFloat(resp.places[0].latitude), lon: parseFloat(resp.places[0].longitude) };
    }
    return null;
  }
}
