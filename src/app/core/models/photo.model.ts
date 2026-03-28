export type PhotoContextType = 'zone' | 'treatment' | 'soil-test' | 'general';

export interface Photo {
  id: string;
  storageUrl: string;
  storagePath: string;
  contextType?: PhotoContextType;
  caption?: string;
  tags?: string[];
  linkedZoneId?: string;
  linkedTreatmentId?: string;
  takenAt?: string;
  createdAt: string;
}
