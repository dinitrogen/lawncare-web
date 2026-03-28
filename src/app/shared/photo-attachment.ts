import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Photo, PhotoContextType } from '../core/models/photo.model';
import { PhotoService } from '../core/services/photo.service';

@Component({
  selector: 'app-photo-attachment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="photo-attachment">
      <div class="photo-grid">
        @for (photo of photos(); track photo.id) {
          <div class="photo-card">
            <img [src]="photo.storageUrl" [alt]="photo.caption || 'Photo'" loading="lazy" />
            <button
              mat-icon-button
              class="delete-btn"
              (click)="removePhoto(photo)"
              aria-label="Remove photo"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
      </div>

      @if (uploadProgress() > 0 && uploadProgress() < 100) {
        <mat-progress-bar mode="determinate" [value]="uploadProgress()"></mat-progress-bar>
      }

      <button mat-stroked-button (click)="fileInput.click()">
        <mat-icon>add_a_photo</mat-icon>
        Add Photo
      </button>
      <input
        #fileInput
        type="file"
        accept="image/*"
        hidden
        (change)="onFileSelected($event)"
      />
    </div>
  `,
  styles: `
    .photo-attachment {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .photo-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .photo-card {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
    }
    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .delete-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      --mdc-icon-button-icon-size: 18px;
    }
  `,
})
export class PhotoAttachmentComponent {
  private readonly storage = inject(Storage);
  private readonly photoService = inject(PhotoService);

  readonly contextType = input.required<PhotoContextType>();
  readonly contextId = input<string>('');
  readonly userId = input.required<string>();
  readonly photos = input<Photo[]>([]);
  readonly photoAdded = output<Photo>();
  readonly photoRemoved = output<string>();

  protected readonly uploadProgress = signal(0);

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const path = `users/${this.userId()}/photos/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on('state_changed', (snap) => {
      this.uploadProgress.set(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
    });

    await task;
    const url = await getDownloadURL(storageRef);
    this.uploadProgress.set(0);

    const photo = await this.photoService.add(this.userId(), {
      storageUrl: url,
      storagePath: path,
      contextType: this.contextType(),
      linkedZoneId: this.contextType() === 'zone' ? this.contextId() : undefined,
      linkedTreatmentId: this.contextType() === 'treatment' ? this.contextId() : undefined,
    });
    this.photoAdded.emit(photo);

    // Reset file input
    (event.target as HTMLInputElement).value = '';
  }

  async removePhoto(photo: Photo): Promise<void> {
    try {
      const storageRef = ref(this.storage, photo.storagePath);
      await deleteObject(storageRef);
    } catch {
      // File may already be deleted
    }
    await this.photoService.delete(this.userId(), photo.id);
    this.photoRemoved.emit(photo.id);
  }
}
