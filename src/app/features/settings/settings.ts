import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { THEME_OPTIONS } from '../../core/models/theme.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Settings</h1>

      <!-- Profile Settings -->
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>person</mat-icon>
          <mat-card-title>Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="profileForm" class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Display Name</mat-label>
              <input matInput formControlName="displayName" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Zip Code</mat-label>
              <input matInput formControlName="zipCode" placeholder="e.g. 48823" />
              <mat-hint>Used for GDD weather data</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>GDD Base Temperature (°F)</mat-label>
              <input matInput type="number" formControlName="gddBase" />
              <mat-hint>Default: 50°F (standard for cool-season turf)</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>High Temp Offset (°F)</mat-label>
              <input matInput type="number" formControlName="tempOffset" />
              <mat-hint>Correction for local microclimate. Try -5 for lakefront locations. Default: 0</mat-hint>
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button (click)="saveProfile()" [disabled]="saving()">
            <mat-icon>save</mat-icon> Save Profile
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Theme Settings -->
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>palette</mat-icon>
          <mat-card-title>Appearance</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Theme</mat-label>
              <mat-select
                [value]="themeService.theme()"
                (selectionChange)="themeService.setTheme($event.value)"
              >
                @for (theme of themeOptions; track theme.name) {
                  <mat-option [value]="theme.name">{{ theme.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Notification Settings -->
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>notifications</mat-icon>
          <mat-card-title>Notifications</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="notifForm" class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Discord Webhook URL</mat-label>
              <input matInput formControlName="discordWebhookUrl" type="url" />
              <mat-hint>Paste your Discord webhook URL to receive notifications</mat-hint>
            </mat-form-field>

            <mat-slide-toggle formControlName="gddAlerts">GDD Threshold Alerts</mat-slide-toggle>
            <mat-slide-toggle formControlName="treatmentReminders">Treatment Reminders</mat-slide-toggle>
            <mat-slide-toggle formControlName="weeklyDigest">Weekly Digest</mat-slide-toggle>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button (click)="saveNotifications()" [disabled]="saving()">
            <mat-icon>save</mat-icon> Save Notifications
          </button>
          <button mat-stroked-button (click)="testWebhook()">
            <mat-icon>send</mat-icon> Test Webhook
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Password Change -->
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>lock</mat-icon>
          <mat-card-title>Change Password</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current Password</mat-label>
              <input matInput type="password" formControlName="currentPassword" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput type="password" formControlName="newPassword" />
              @if (passwordForm.controls.newPassword.hasError('minlength')) {
                <mat-error>At least 6 characters</mat-error>
              }
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button (click)="changePassword()" [disabled]="saving() || passwordForm.invalid">
            <mat-icon>lock_reset</mat-icon> Change Password
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 500px;
    }
    .full-width {
      width: 100%;
    }
    mat-card {
      margin-bottom: 16px;
    }
  `,
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly themeOptions = THEME_OPTIONS;
  protected readonly saving = signal(false);

  protected readonly profileForm = this.fb.nonNullable.group({
    displayName: [''],
    zipCode: [''],
    gddBase: [50],
    tempOffset: [0],
  });

  protected readonly notifForm = this.fb.nonNullable.group({
    discordWebhookUrl: [''],
    gddAlerts: [true],
    treatmentReminders: [true],
    weeklyDigest: [false],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName,
        zipCode: user.zipCode ?? '',
        gddBase: user.gddBase ?? 50,
        tempOffset: user.tempOffset ?? 0,
      });
      this.notifForm.patchValue({
        discordWebhookUrl: user.discordWebhookUrl ?? '',
        gddAlerts: user.notificationPrefs?.gddAlerts ?? true,
        treatmentReminders: user.notificationPrefs?.treatmentReminders ?? true,
        weeklyDigest: user.notificationPrefs?.weeklyDigest ?? false,
      });
    }
  }

  protected async saveProfile(): Promise<void> {
    this.saving.set(true);
    try {
      await this.authService.updateProfile(this.profileForm.getRawValue());
      this.snackBar.open('Profile saved', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to save profile', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveNotifications(): Promise<void> {
    this.saving.set(true);
    try {
      const val = this.notifForm.getRawValue();
      await this.authService.updateProfile({
        discordWebhookUrl: val.discordWebhookUrl,
        notificationPrefs: {
          gddAlerts: val.gddAlerts,
          treatmentReminders: val.treatmentReminders,
          weeklyDigest: val.weeklyDigest,
        },
      });
      this.snackBar.open('Notification settings saved', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to save settings', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected async testWebhook(): Promise<void> {
    const url = this.notifForm.controls.discordWebhookUrl.value;
    if (!url) {
      this.snackBar.open('Enter a webhook URL first', 'OK', { duration: 3000 });
      return;
    }
    try {
      await this.notificationService.sendDiscordNotification(url, {
        content: '✅ LawnCare webhook test successful!',
      });
      this.snackBar.open('Test message sent!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to send test message', 'OK', { duration: 3000 });
    }
  }

  protected async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    this.saving.set(true);
    const { newPassword } = this.passwordForm.getRawValue();
    try {
      await this.authService.changePassword(newPassword);
      this.passwordForm.reset();
      this.snackBar.open('Password changed', 'OK', { duration: 3000 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      this.snackBar.open(msg, 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }
}
