import type { CelestialBodyData, Line, Particle, Vector3D } from './celestial';

/**
 * Represents a node for a celestial body that can be used in a connection.
 */
export interface PlanetNode {
  id: number;
  name: string;
  color: string;
}

/**
 * Represents a connection between two planet nodes.
 */
export interface Connection {
  id: number;
  from: number;
  to: number;
  color: string;
  persistenceMultiplier: number;
}

/**
 * Contains all state related to the core simulation logic.
 */
export interface SimulationState {
  // --- Core State ---
  currentSystem: string;
  planetNodes: PlanetNode[];
  planetsToRender: PlanetNode[];
  connections: Connection[];
  time: number; // in simulation days
  startDate: Date;
  endDate: Date | null;
  planetDataOverrides: Record<string, Partial<CelestialBodyData>>;
  isPlaying: boolean;
  timeSpeed: number;

  // --- Physics & Simulation Settings ---
  useRealisticPhysics: boolean;
  useJplHorizons: boolean;
  ellipticalOrbits: boolean;
  logarithmicOrbits: boolean;
  orbitalInclination: boolean;
  sceneScale: number;
  logarithmicOrbitsT: number; // 0 = linear, 1 = logarithmic
  ellipticalOrbitsT: number; // 0 = circular, 1 = elliptical
  orbitalInclinationT: number; // 0 = flat, 1 = inclined
  
  // --- Data History & Cache ---
  lineHistory: Line[];
  particles: Particle[];
  highPrecisionPaths: Record<string, { data: Vector3D[]; startDate: string; stepInDays: number; rawData: string; }>;
}