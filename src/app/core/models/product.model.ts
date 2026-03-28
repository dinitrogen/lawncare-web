export type ProductType =
  | 'pre-emergent'
  | 'post-emergent'
  | 'fertilizer'
  | 'fungicide'
  | 'insecticide'
  | 'other';

export type ApplicationRateUnit = 'oz' | 'lbs' | 'ml' | 'g';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  activeIngredient?: string;
  applicationRatePerKSqFt?: number;
  applicationRateUnit?: ApplicationRateUnit;
  gddWindowMin?: number;
  gddWindowMax?: number;
  reapplyIntervalDays?: number;
  notes?: string;
  createdAt: string;
}

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'pre-emergent', label: 'Pre-Emergent' },
  { value: 'post-emergent', label: 'Post-Emergent' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'fungicide', label: 'Fungicide' },
  { value: 'insecticide', label: 'Insecticide' },
  { value: 'other', label: 'Other' },
];
