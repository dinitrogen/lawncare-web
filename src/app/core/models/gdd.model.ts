export interface GddThreshold {
  name: string;
  gddMin: number;
  gddMax: number;
  action: string;
  category: 'weed' | 'pest' | 'disease' | 'general';
}

export interface DailyGddEntry {
  date: string;
  tempMax: number;
  tempMin: number;
  gdd: number;
  cumulativeGdd: number;
}

export type GddStatus = 'not-yet' | 'approaching' | 'active' | 'passed';

export const BUILT_IN_THRESHOLDS: GddThreshold[] = [
  {
    name: 'Forsythia bloom',
    gddMin: 1,
    gddMax: 150,
    action: 'Visual indicator — pre-emergent timing approaching',
    category: 'general',
  },
  {
    name: 'Crabgrass pre-emergent window',
    gddMin: 100,
    gddMax: 200,
    action: 'Apply pre-emergent herbicide (ideal: GDD 150–175)',
    category: 'weed',
  },
  {
    name: 'Crabgrass germination',
    gddMin: 200,
    gddMax: 600,
    action: 'Crabgrass actively germinating — pre-emergent should already be down',
    category: 'weed',
  },
  {
    name: 'Broadleaf weed control',
    gddMin: 500,
    gddMax: 750,
    action: 'Optimal window for post-emergent broadleaf herbicide',
    category: 'weed',
  },
  {
    name: 'Grub preventive',
    gddMin: 750,
    gddMax: 1000,
    action: 'Apply preventive grub control (e.g., Imidacloprid)',
    category: 'pest',
  },
  {
    name: 'Fall pre-emergent (Poa annua)',
    gddMin: 1200,
    gddMax: 1500,
    action: 'Apply fall pre-emergent to prevent Poa annua',
    category: 'weed',
  },
];

export function getGddStatus(currentGdd: number, threshold: { gddMin: number; gddMax: number }): GddStatus {
  if (currentGdd < threshold.gddMin - 50) return 'not-yet';
  if (currentGdd < threshold.gddMin) return 'approaching';
  if (currentGdd <= threshold.gddMax) return 'active';
  return 'passed';
}
