import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Equipment, MaintenanceLog } from '../models/equipment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getEquipment(uid: string): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${this.apiUrl}/api/equipment`);
  }

  async addEquipment(uid: string, equip: Partial<Equipment>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<Equipment>(`${this.apiUrl}/api/equipment`, equip),
    );
    return created.id;
  }

  async updateEquipment(uid: string, id: string, data: Partial<Equipment>): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/equipment/${id}`, data),
    );
  }

  async deleteEquipment(uid: string, id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/equipment/${id}`),
    );
  }

  getLogs(uid: string): Observable<MaintenanceLog[]> {
    return this.http.get<MaintenanceLog[]>(`${this.apiUrl}/api/equipment/logs`);
  }

  async addLog(uid: string, log: Partial<MaintenanceLog>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<MaintenanceLog>(`${this.apiUrl}/api/equipment/logs`, log),
    );
    return created.id;
  }

  async deleteLog(uid: string, id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/equipment/logs/${id}`),
    );
  }
}
