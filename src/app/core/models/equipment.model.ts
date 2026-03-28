export type EquipmentType = 'mower' | 'snowblower' | 'trimmer' | 'spreader' | 'sprayer' | 'other';

export type MaintenanceType =
  | 'blade-sharpening'
  | 'oil-change'
  | 'filter-change'
  | 'height-change'
  | 'winterize'
  | 'repair'
  | 'other';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  type: MaintenanceType;
  description: string;
  cost?: number;
  notes?: string;
  createdAt: string;
}

export const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: 'mower', label: 'Mower' },
  { value: 'snowblower', label: 'Snowblower' },
  { value: 'trimmer', label: 'Trimmer' },
  { value: 'spreader', label: 'Spreader' },
  { value: 'sprayer', label: 'Sprayer' },
  { value: 'other', label: 'Other' },
];

export const MAINTENANCE_TYPES: { value: MaintenanceType; label: string }[] = [
  { value: 'blade-sharpening', label: 'Blade Sharpening' },
  { value: 'oil-change', label: 'Oil Change' },
  { value: 'filter-change', label: 'Filter Change' },
  { value: 'height-change', label: 'Height Change' },
  { value: 'winterize', label: 'Winterize' },
  { value: 'repair', label: 'Repair' },
  { value: 'other', label: 'Other' },
];
