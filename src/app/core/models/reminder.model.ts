export interface Reminder {
  id: string;
  title: string;
  date: string;
  time?: string;
  notes?: string;
  sendDiscordReminder: boolean;
  createdAt: string;
}
