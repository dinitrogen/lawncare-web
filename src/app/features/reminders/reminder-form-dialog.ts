import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Reminder } from '../../core/models/reminder.model';

export interface ReminderFormDialogData {
  reminder?: Reminder;
}

@Component({
  selector: 'app-reminder-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.reminder ? 'Edit Reminder' : 'Add Reminder' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="reminder-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          @if (form.controls.title.hasError('required')) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput type="date" formControlName="date" />
            @if (form.controls.date.hasError('required')) {
              <mat-error>Date is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Time (optional)</mat-label>
            <input matInput type="time" formControlName="time" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="sendDiscordReminder">
          Send Discord reminder on event date
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="form.invalid">
        {{ data.reminder ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .reminder-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      padding-top: 4px;
    }
    .form-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .form-row mat-form-field {
      flex: 1;
      min-width: 140px;
    }
    .full-width {
      width: 100%;
    }
    mat-slide-toggle {
      margin: 8px 0;
    }
  `,
})
export class ReminderFormDialogComponent implements OnInit {
  protected readonly data = inject<ReminderFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ReminderFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    date: ['', Validators.required],
    time: [''],
    notes: [''],
    sendDiscordReminder: [false],
  });

  ngOnInit(): void {
    if (this.data.reminder) {
      this.form.patchValue(this.data.reminder);
    }
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
