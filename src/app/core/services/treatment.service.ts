import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Treatment } from '../models/treatment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTreatments(uid: string): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${this.apiUrl}/api/treatments`);
  }

  async add(uid: string, treatment: Partial<Treatment>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<Treatment>(`${this.apiUrl}/api/treatments`, treatment),
    );
    return created.id;
  }

  async update(uid: string, id: string, data: Partial<Treatment>): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/treatments/${id}`, data),
    );
  }

  async delete(uid: string, id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/treatments/${id}`),
    );
  }
}
