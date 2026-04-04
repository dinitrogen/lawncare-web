import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Reminder } from '../models/reminder.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getReminders(uid: string): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/api/reminders`);
  }

  async add(uid: string, reminder: Partial<Reminder>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<Reminder>(`${this.apiUrl}/api/reminders`, reminder),
    );
    return created.id;
  }

  async update(uid: string, reminderId: string, data: Partial<Reminder>): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/reminders/${reminderId}`, data),
    );
  }

  async delete(uid: string, reminderId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/reminders/${reminderId}`),
    );
  }
}
