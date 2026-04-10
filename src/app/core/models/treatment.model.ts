export type ApplicationType = 'sprayer' | 'solid';

export interface Treatment {
  id: string;
  zoneIds: string[];
  zoneNames: string[];
  productId: string;
  productName: string;
  applicationDate: string;
  amountApplied: number;
  amountUnit: string;
  gdd?: number;
  waterVolume?: number;
  applicationType?: ApplicationType;
  applicationRate?: string;
  spreaderSetting?: number;
  weatherConditions?: string;
  temperature?: number;
  notes?: string;
  photoIds?: string[];
  createdAt: string;
}
