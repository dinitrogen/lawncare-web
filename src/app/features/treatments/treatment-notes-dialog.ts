import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface TreatmentNotesDialogData {
  productName: string;
  date: string;
  notes: string;
}

@Component({
  selector: 'app-treatment-notes-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.productName }} — {{ data.date }}</h2>
    <mat-dialog-content>
      <p class="notes-text">{{ data.notes }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .notes-text {
      white-space: pre-wrap;
      line-height: 1.6;
      margin: 0;
    }
  `,
})
export class TreatmentNotesDialogComponent {
  protected readonly data = inject<TreatmentNotesDialogData>(MAT_DIALOG_DATA);
}
