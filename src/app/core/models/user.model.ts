export interface NotificationPrefs {
  treatmentReminders: boolean;
  gddAlerts: boolean;
  weeklyDigest: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  gddBase: number;
  gddStartMonth: number;
  gddStartDay: number;
  gddSource: 'meteo' | 'ecowitt';
  tempOffset: number;
  discordWebhookUrl?: string;
  notificationPrefs: NotificationPrefs;
  createdAt: string;
}

export function createDefaultUser(uid: string, email: string): AppUser {
  return {
    uid,
    email,
    displayName: '',
    zipCode: '',
    gddBase: 50,
    gddStartMonth: 1,
    gddStartDay: 1,
    gddSource: 'meteo',
    tempOffset: 0,
    notificationPrefs: {
      treatmentReminders: true,
      gddAlerts: true,
      weeklyDigest: true,
    },
    createdAt: new Date().toISOString(),
  };
}
