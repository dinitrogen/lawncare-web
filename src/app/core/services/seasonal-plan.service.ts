import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { SeasonalTaskStatus, DEFAULT_SEASONAL_TASKS } from '../models/seasonal-plan.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SeasonalPlanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly defaultTasks = DEFAULT_SEASONAL_TASKS;

  getStatuses(uid: string, year: number): Observable<SeasonalTaskStatus[]> {
    return this.http.get<SeasonalTaskStatus[]>(`${this.apiUrl}/api/seasonal/${year}`);
  }

  async saveStatuses(uid: string, year: number, statuses: SeasonalTaskStatus[]): Promise<void> {
    await firstValueFrom(this.http.put(`${this.apiUrl}/api/seasonal`, { year, statuses }));
  }
}
