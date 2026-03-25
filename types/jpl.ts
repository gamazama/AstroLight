import type { Vector3D } from './common';

// A series of 3D coordinates representing a path, in AU.
export type PlanetaryData = Vector3D[];

export interface FetchResult {
  parsedData: PlanetaryData;
  rawData: string;
  stepInDays: number;
}
