import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ReminderService } from '../../core/services/reminder.service';
import { Reminder } from '../../core/models/reminder.model';
import { ReminderFormDialogComponent } from './reminder-form-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-reminders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Reminders</h1>
        <button mat-flat-button (click)="openForm()">
          <mat-icon>add</mat-icon> Add Reminder
        </button>
      </div>

      <div class="card-grid">
        @for (reminder of reminders(); track reminder.id) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>event</mat-icon>
              <mat-card-title>{{ reminder.title }}</mat-card-title>
              <mat-card-subtitle>
                {{ reminder.date }}{{ reminder.time ? ' at ' + reminder.time : '' }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (reminder.notes) {
                <p class="detail notes">{{ reminder.notes }}</p>
              }
              <mat-chip-set>
                @if (reminder.sendDiscordReminder) {
                  <mat-chip>
                    <mat-icon matChipAvatar>notifications_active</mat-icon>
                    Discord reminder on
                  </mat-chip>
                }
              </mat-chip-set>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="openForm(reminder)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-button color="warn" (click)="deleteReminder(reminder)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </mat-card-actions>
          </mat-card>
        } @empty {
          <mat-card>
            <mat-card-content>
              <div class="empty-state">
                <mat-icon class="empty-icon">event</mat-icon>
                <p>No reminders added yet.</p>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .detail {
      font-size: 14px;
      margin: 4px 0;
    }
    .notes {
      opacity: 0.8;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      opacity: 0.7;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `,
})
export class RemindersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly reminderService = inject(ReminderService);
  private readonly dialog = inject(MatDialog);

  protected readonly reminders = signal<Reminder[]>([]);

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.reminderService.getReminders(this.uid).subscribe((r) => this.reminders.set(r));
  }

  protected openForm(reminder?: Reminder): void {
    const dialogRef = this.dialog.open(ReminderFormDialogComponent, {
      width: '500px',
      data: { reminder },
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Reminder> | undefined) => {
      if (!result) return;
      if (reminder) {
        await this.reminderService.update(this.uid, reminder.id, result);
      } else {
        await this.reminderService.add(this.uid, result);
      }
      this.reminderService.getReminders(this.uid).subscribe((r) => this.reminders.set(r));
    });
  }

  protected deleteReminder(reminder: Reminder): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Reminder',
        message: `Delete "${reminder.title}"?`,
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.reminderService.delete(this.uid, reminder.id);
        this.reminderService.getReminders(this.uid).subscribe((r) => this.reminders.set(r));
      }
    });
  }
}
