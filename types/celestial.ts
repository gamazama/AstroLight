
import type { Vector3D } from './common';

// FIX: Re-export Vector3D type. types/simulation.ts was trying to import it from this module,
// and it is part of the public API of this module since Line and Particle use it.
export type { Vector3D };

export interface CelestialBodyData {
  name: string;
  color: string;
  radius: number; // visual radius
  realRadius?: number; // real radius in km
  orbitRadius: number; // in million km
  period: number; // in Earth days
  eccentricity: number;
  inclination: number; // in degrees
  description: string;
  phaseOffset?: number; // in degrees
  jplId?: string; // JPL HORIZONS identifier for barycenter
  jplIdPlanetCenter?: string; // JPL HORIZONS identifier for planet center
  connectionColors?: string[]; // A palette of 3 colors associated with this body for connections
}

export interface Line {
  id: number;
  from: Vector3D;
  to: Vector3D;
  baseFrom: Vector3D;
  baseTo: Vector3D;
  color: string;
  time: number;
  persistence: number;
  connectionId: number;
  isDying?: boolean;
  timeToLive?: number;
  startFadeOpacity?: number;
  fromPlanetName: string;
  toPlanetName: string;
}

export interface Star {
    x: number;
    y: number;
    z: number;
    baseSize: number;
    color: string;
    twinkleOffset: number;
    twinkleSpeed: number;
}

export interface Particle extends Vector3D {
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  connectionId: number;
  isFlashParticle: boolean;
  randomPhase: number;
}
