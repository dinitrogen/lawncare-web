import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { SoilTest } from '../models/soil-test.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SoilTestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSoilTests(uid: string): Observable<SoilTest[]> {
    return this.http.get<SoilTest[]>(`${this.apiUrl}/api/soiltests`);
  }

  async add(uid: string, test: Partial<SoilTest>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<SoilTest>(`${this.apiUrl}/api/soiltests`, test),
    );
    return created.id;
  }

  async update(uid: string, id: string, data: Partial<SoilTest>): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/soiltests/${id}`, data),
    );
  }

  async delete(uid: string, id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/soiltests/${id}`),
    );
  }
}
