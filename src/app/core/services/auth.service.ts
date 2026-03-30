import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { AppUser, createDefaultUser } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly currentUser = signal<AppUser | null>(null);
  private readonly loading = signal(true);

  readonly user = this.currentUser.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await this.loadUserProfile(firebaseUser);
        } else {
          this.currentUser.set(null);
        }
      } finally {
        this.loading.set(false);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    await this.loadUserProfile(credential.user);
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const defaults = createDefaultUser(credential.user.uid, email);
    defaults.displayName = displayName;

    const profile = await firstValueFrom(
      this.http.post<Record<string, unknown>>(`${this.apiUrl}/api/user`, {
        email: defaults.email,
        displayName: defaults.displayName,
        zipCode: defaults.zipCode,
        gddBase: defaults.gddBase,
        gddStartMonth: defaults.gddStartMonth,
        gddStartDay: defaults.gddStartDay,
        tempOffset: defaults.tempOffset,
      }),
    );
    this.currentUser.set({ ...defaults, uid: credential.user.uid });
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser.set(null);
  }

  async updateProfile(updates: Partial<AppUser>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('Not authenticated');
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/user`, updates),
    );
    this.currentUser.update((u) => (u ? { ...u, ...updates } : u));
  }

  async changePassword(newPassword: string): Promise<void> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) throw new Error('Not authenticated');
    await updatePassword(firebaseUser, newPassword);
  }

  private async loadUserProfile(firebaseUser: User): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<Record<string, unknown>>(`${this.apiUrl}/api/user`),
      );
      this.currentUser.set({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: (data['displayName'] as string) ?? '',
        zipCode: (data['zipCode'] as string) ?? '',
        latitude: data['latitude'] as number | undefined,
        longitude: data['longitude'] as number | undefined,
        gddBase: (data['gddBase'] as number) ?? 50,
        gddStartMonth: (data['gddStartMonth'] as number) ?? 2,
        gddStartDay: (data['gddStartDay'] as number) ?? 15,
        gddSource: (data['gddSource'] as AppUser['gddSource']) ?? 'meteo',
        tempOffset: (data['tempOffset'] as number) ?? 0,
        discordWebhookUrl: data['discordWebhookUrl'] as string | undefined,
        notificationPrefs: (data['notificationPrefs'] as AppUser['notificationPrefs']) ?? {
          treatmentReminders: true,
          gddAlerts: true,
          weeklyDigest: true,
        },
        createdAt: data['createdAt'] as string,
      });
    } catch {
      // Profile doesn't exist yet — create a default one via the API
      const defaults = createDefaultUser(firebaseUser.uid, firebaseUser.email ?? '');
      defaults.displayName = firebaseUser.displayName ?? '';
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/api/user`, {
          email: defaults.email,
          displayName: defaults.displayName,
          zipCode: defaults.zipCode,
          gddBase: defaults.gddBase,
          gddStartMonth: defaults.gddStartMonth,
          gddStartDay: defaults.gddStartDay,
          tempOffset: defaults.tempOffset,
        }),
      );
      this.currentUser.set(defaults);
    }
  }
}
