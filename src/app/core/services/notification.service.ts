import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface DiscordMessage {
  content: string;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title: string;
  description: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  async sendDiscordNotification(webhookUrl: string, message: DiscordMessage): Promise<void> {
    if (!webhookUrl) return;
    await firstValueFrom(this.http.post(webhookUrl, message));
  }
}
