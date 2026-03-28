import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { YardZone } from '../models/yard.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class YardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getZones(uid: string): Observable<YardZone[]> {
    return this.http.get<YardZone[]>(`${this.apiUrl}/api/zones`);
  }

  getZone(uid: string, zoneId: string): Observable<YardZone> {
    return this.http.get<YardZone>(`${this.apiUrl}/api/zones/${zoneId}`);
  }

  async add(uid: string, zone: Partial<YardZone>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<YardZone>(`${this.apiUrl}/api/zones`, zone),
    );
    return created.id;
  }

  async update(uid: string, zoneId: string, data: Partial<YardZone>): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/zones/${zoneId}`, data),
    );
  }

  async delete(uid: string, zoneId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/zones/${zoneId}`),
    );
  }
}
