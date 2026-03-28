export interface Treatment {
  id: string;
  zoneId: string;
  zoneName: string;
  productId: string;
  productName: string;
  applicationDate: string;
  amountApplied: number;
  amountUnit: string;
  waterVolume?: number;
  weatherConditions?: string;
  temperature?: number;
  notes?: string;
  photoIds?: string[];
  createdAt: string;
}
