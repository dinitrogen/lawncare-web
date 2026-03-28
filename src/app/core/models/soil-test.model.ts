export interface SoilTest {
  id: string;
  zoneId: string;
  zoneName: string;
  testDate: string;
  ph?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organicMatter?: number;
  recommendations?: string;
  labName?: string;
  photoIds?: string[];
  notes?: string;
  createdAt: string;
}

export function getPhColor(ph: number | undefined): string {
  if (ph === undefined) return '#9e9e9e';
  if (ph < 5.5) return '#c62828';
  if (ph < 6.0) return '#ef6c00';
  if (ph <= 7.0) return '#2e7d32';
  if (ph <= 7.5) return '#ef6c00';
  return '#1565c0';
}

export function getPhLabel(ph: number | undefined): string {
  if (ph === undefined) return 'Unknown';
  if (ph < 5.5) return 'Very Acidic';
  if (ph < 6.0) return 'Acidic';
  if (ph <= 7.0) return 'Ideal';
  if (ph <= 7.5) return 'Alkaline';
  return 'Very Alkaline';
}
