export type ApplicationType = 'sprayer' | 'solid';

export interface TreatmentLineItem {
  productId: string;
  productName: string;
  amountApplied: number;
  amountUnit: string;
  productConcentration?: string;
}

export interface Treatment {
  id: string;
  zoneIds: string[];
  zoneNames: string[];
  applicationDate: string;
  applicationType?: ApplicationType;
  waterVolume?: number;
  spreaderSetting?: number;
  applicationRate?: string;
  lineItems: TreatmentLineItem[];
  gdd?: number;
  weatherConditions?: string;
  temperature?: number;
  notes?: string;
  photoIds?: string[];
  createdAt: string;

  // Legacy single-product fields (kept for backward-compat display of old records)
  productId?: string;
  productName?: string;
  amountApplied?: number;
  amountUnit?: string;
  productConcentration?: string;
}
