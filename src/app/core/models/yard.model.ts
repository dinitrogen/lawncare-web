export interface FilledCell {
  x: number;
  y: number;
}

export interface ZoneSketch {
  gridSizeX: number;
  gridSizeY: number;
  cellSizeFt: number;
  filledCells: FilledCell[];
  labels?: ZoneLabel[];
}

export interface ZoneLabel {
  x: number;
  y: number;
  text: string;
}

export type SunExposure = 'full-sun' | 'partial-shade' | 'full-shade';

export interface YardZone {
  id: string;
  name: string;
  area: number;
  grassType?: string;
  soilType?: string;
  sunExposure?: SunExposure;
  sketchData?: ZoneSketch;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const GRASS_TYPES = [
  'Kentucky Bluegrass',
  'Tall Fescue',
  'Fine Fescue',
  'Perennial Ryegrass',
  'Bermuda',
  'Zoysia',
  'St. Augustine',
  'Centipede',
  'Buffalo Grass',
  'Mixed / Unknown',
] as const;

export const SOIL_TYPES = [
  'Clay',
  'Sandy',
  'Loam',
  'Silt',
  'Clay Loam',
  'Sandy Loam',
  'Unknown',
] as const;

export function createBlankSketch(): ZoneSketch {
  return {
    gridSizeX: 20,
    gridSizeY: 20,
    cellSizeFt: 5,
    filledCells: [],
  };
}
