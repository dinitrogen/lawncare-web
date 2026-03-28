import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Photo, PhotoContextType } from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly firestore = inject(Firestore);

  private photosCol(uid: string) {
    return collection(this.firestore, `users/${uid}/photos`);
  }

  getPhotos(uid: string): Observable<Photo[]> {
    return collectionData(this.photosCol(uid), { idField: 'id' }).pipe(
      map((docs) => docs as Photo[]),
    );
  }

  getPhotosByContext(uid: string, contextType: PhotoContextType, contextId: string): Observable<Photo[]> {
    const field = contextType === 'zone' ? 'linkedZoneId' : 'linkedTreatmentId';
    const q = query(this.photosCol(uid), where('contextType', '==', contextType), where(field, '==', contextId));
    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) => docs as Photo[]),
    );
  }

  async add(uid: string, photo: Partial<Photo>): Promise<Photo> {
    const ref = await addDoc(this.photosCol(uid), {
      ...photo,
      uploadedAt: serverTimestamp(),
    });
    return { ...photo, id: ref.id } as Photo;
  }

  async delete(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `users/${uid}/photos/${id}`));
  }
}
