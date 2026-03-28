export type SeasonalTaskCategory =
  | 'pre-emergent'
  | 'fertilizer'
  | 'weed-control'
  | 'overseeding'
  | 'aeration'
  | 'mowing'
  | 'cleanup'
  | 'other';

export type Season =
  | 'early-spring'
  | 'spring'
  | 'early-summer'
  | 'summer'
  | 'fall'
  | 'late-fall'
  | 'winter';

export interface SeasonalTask {
  id: string;
  name: string;
  category: SeasonalTaskCategory;
  season: Season;
  gddTriggerMin?: number;
  gddTriggerMax?: number;
  calendarWindowStart?: string;
  calendarWindowEnd?: string;
  description?: string;
  linkedProductIds?: string[];
  sortOrder: number;
  isCustom?: boolean;
}

export interface SeasonalTaskStatus {
  taskId: string;
  year: number;
  completedAt?: string;
  treatmentId?: string;
  skipped?: boolean;
  notes?: string;
}

export const SEASON_LABELS: Record<Season, string> = {
  'early-spring': 'Early Spring',
  'spring': 'Spring',
  'early-summer': 'Early Summer',
  'summer': 'Summer',
  'fall': 'Fall',
  'late-fall': 'Late Fall',
  'winter': 'Winter',
};

export const DEFAULT_SEASONAL_TASKS: SeasonalTask[] = [
  {
    id: 'cleanup',
    name: 'Spring cleanup',
    category: 'cleanup',
    season: 'early-spring',
    calendarWindowStart: '03-01',
    calendarWindowEnd: '03-31',
    description: 'Rake debris, remove leaves, clear beds',
    sortOrder: 1,
  },
  {
    id: 'first-mow',
    name: 'First mow (low height)',
    category: 'mowing',
    season: 'early-spring',
    calendarWindowStart: '03-15',
    calendarWindowEnd: '04-15',
    description: 'First mow of season — lower than normal to remove dead growth',
    sortOrder: 2,
  },
  {
    id: 'soil-test',
    name: 'Soil test',
    category: 'other',
    season: 'early-spring',
    calendarWindowStart: '03-01',
    calendarWindowEnd: '04-30',
    description: 'Test soil pH and nutrient levels',
    sortOrder: 3,
  },
  {
    id: 'pre-emergent',
    name: 'Apply crabgrass pre-emergent',
    category: 'pre-emergent',
    season: 'spring',
    gddTriggerMin: 100,
    gddTriggerMax: 200,
    description: 'Apply before crabgrass germination (ideal: GDD 150–175)',
    sortOrder: 4,
  },
  {
    id: 'spring-fertilizer',
    name: 'Spring fertilizer application',
    category: 'fertilizer',
    season: 'spring',
    gddTriggerMin: 200,
    gddTriggerMax: 500,
    description: 'Apply balanced fertilizer to promote green-up',
    sortOrder: 5,
  },
  {
    id: 'broadleaf-weed',
    name: 'Post-emergent broadleaf weed control',
    category: 'weed-control',
    season: 'early-summer',
    gddTriggerMin: 500,
    gddTriggerMax: 750,
    description: 'Target dandelions, clover, and other broadleaf weeds',
    sortOrder: 6,
  },
  {
    id: 'raise-mower',
    name: 'Raise mower height for summer',
    category: 'mowing',
    season: 'summer',
    calendarWindowStart: '06-01',
    calendarWindowEnd: '06-30',
    description: 'Raise mower height to 3.5–4 inches to help grass tolerate heat',
    sortOrder: 7,
  },
  {
    id: 'grub-preventive',
    name: 'Grub preventive application',
    category: 'other',
    season: 'summer',
    gddTriggerMin: 750,
    gddTriggerMax: 1000,
    description: 'Apply preventive grub control (e.g., Imidacloprid)',
    sortOrder: 8,
  },
  {
    id: 'aerate-overseed',
    name: 'Aerate + overseed',
    category: 'aeration',
    season: 'fall',
    calendarWindowStart: '08-15',
    calendarWindowEnd: '09-30',
    description: 'Core aerate and overseed thin areas',
    sortOrder: 9,
  },
  {
    id: 'fall-fertilizer',
    name: 'Fall fertilizer',
    category: 'fertilizer',
    season: 'fall',
    calendarWindowStart: '09-01',
    calendarWindowEnd: '10-15',
    description: 'Apply fall fertilizer to promote root growth',
    sortOrder: 10,
  },
  {
    id: 'fall-pre-emergent',
    name: 'Fall pre-emergent (Poa annua)',
    category: 'pre-emergent',
    season: 'late-fall',
    gddTriggerMin: 1200,
    gddTriggerMax: 1500,
    description: 'Prevent annual bluegrass germination',
    sortOrder: 11,
  },
  {
    id: 'lower-mower',
    name: 'Lower mower height for winter',
    category: 'mowing',
    season: 'late-fall',
    calendarWindowStart: '10-15',
    calendarWindowEnd: '11-15',
    description: 'Gradually lower mowing height for last few cuts',
    sortOrder: 12,
  },
  {
    id: 'winterizer',
    name: 'Winterizer fertilizer',
    category: 'fertilizer',
    season: 'late-fall',
    calendarWindowStart: '10-15',
    calendarWindowEnd: '11-30',
    description: 'Apply winterizer fertilizer for root storage',
    sortOrder: 13,
  },
  {
    id: 'equipment-maintenance',
    name: 'Equipment maintenance',
    category: 'other',
    season: 'winter',
    calendarWindowStart: '12-01',
    calendarWindowEnd: '02-28',
    description: 'Sharpen blades, change oil, winterize equipment',
    sortOrder: 14,
  },
];
