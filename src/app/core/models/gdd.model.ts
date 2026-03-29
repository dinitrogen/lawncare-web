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
    name: 'Forsythia bloom (first)',
    gddMin: 1,
    gddMax: 107,
    action: 'Visual indicator — pre-emergent timing approaching',
    category: 'general',
  },
  {
    name: 'Crabgrass pre-emergent window',
    gddMin: 107,
    gddMax: 500,
    action: 'Apply pre-emergent herbicide before crabgrass germination (at forsythia full bloom)',
    category: 'weed',
  },
  {
    name: 'Dandelion bloom (post-emergent timing)',
    gddMin: 245,
    gddMax: 625,
    action: 'Dandelions actively blooming — optimal broadleaf herbicide window',
    category: 'weed',
  },
  {
    name: 'Crabgrass germination begins',
    gddMin: 500,
    gddMax: 750,
    action: 'Crabgrass actively germinating — pre-emergent should already be down',
    category: 'weed',
  },
  {
    name: 'Grub preventive (Japanese beetle egg-lay)',
    gddMin: 1000,
    gddMax: 1300,
    action: 'Apply preventive grub control (e.g., chlorantraniliprole or imidacloprid)',
    category: 'pest',
  },
  {
    name: 'Chinch bug activity',
    gddMin: 1300,
    gddMax: 2000,
    action: 'Monitor for chinch bug damage in sunny, dry turf areas',
    category: 'pest',
  },
  {
    name: 'Fall pre-emergent (Poa annua)',
    gddMin: 3500,
    gddMax: 4000,
    action: 'Apply fall pre-emergent to prevent Poa annua germination (soil temps dropping below 70°F)',
    category: 'weed',
  },
];

export function getGddStatus(currentGdd: number, threshold: { gddMin: number; gddMax: number }): GddStatus {
  if (currentGdd < threshold.gddMin - 50) return 'not-yet';
  if (currentGdd < threshold.gddMin) return 'approaching';
  if (currentGdd <= threshold.gddMax) return 'active';
  return 'passed';
}
