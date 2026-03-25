
import React from 'react';
import type { AppState, Vector3D, PlanetNode, CelestialBodyData } from '../../types';
import { calculatePlanetPosition, project2D } from './calculations';

export type OrbitPaths = {
    path3D: Vector3D[];
    path2D: { x: number; y: number; scale: number; behind?: boolean }[];
};

/**
 * Helper to determine how many segments and what duration to render for Geocentric orbits.
 * Exported for use in drawing.ts to ensure visual consistency.
 */
export const getGeocentricOrbitParams = (planetName: string, period: number): { durationInDays: number, segmentCount: number } => {
    const EARTH_YEAR = 365.25;
    
    // Moon: 1 orbit (27.3 days)
    if (planetName === 'Moon') return { durationInDays: 27.3, segmentCount: 120 };
    
    // Sun: 1 Earth year
    if (planetName === 'Sun') return { durationInDays: EARTH_YEAR, segmentCount: 120 };
    
    // Mercury: 1 Earth year
    if (planetName === 'Mercury') return { durationInDays: EARTH_YEAR, segmentCount: 200 };
    
    // Venus: 8 Earth years (The Pentagram of Venus = 5 synodic cycles ~ 8 years)
    if (planetName === 'Venus') return { durationInDays: 8 * EARTH_YEAR, segmentCount: 1000 };
    
    // Mars: 2.135 Earth years (1 Synodic period / 1 Retrograde loop)
    if (planetName === 'Mars') return { durationInDays: 2.135 * EARTH_YEAR, segmentCount: 600 };
    
    // Jupiter: 1 full orbital period (~12 years). 
    if (planetName === 'Jupiter') return { durationInDays: 11.86 * EARTH_YEAR, segmentCount: 1500 };

    // Saturn: 1 full orbital period (~29.5 years).
    if (planetName === 'Saturn') return { durationInDays: 29.45 * EARTH_YEAR, segmentCount: 2500 };

    // Outer planets: Show shorter trails (15 years) instead of full orbits (84+ years) 
    // to keep the view clean, but use very high resolution for smooth retrograde loops.
    if (planetName === 'Uranus') return { durationInDays: 15 * EARTH_YEAR, segmentCount: 3000 };
    if (planetName === 'Neptune') return { durationInDays: 15 * EARTH_YEAR, segmentCount: 3000 };
    
    // Fallback for others
    return { durationInDays: period, segmentCount: 1000 };
};

/**
 * Calculates or retrieves the cached 3D path of an orbit.
 * The 3D path is constant regardless of camera angle, so it is heavily cached.
 */
const getOrUpdate3DBaseOrbit = (
    node: PlanetNode,
    state: AppState,
    actions: { getCelestialBody: (name: string) => CelestialBodyData | undefined },
    cache: React.MutableRefObject<Map<number, Vector3D[]>>
): Vector3D[] => {
    if (cache.current.has(node.id)) {
        return cache.current.get(node.id)!;
    }

    const planet = actions.getCelestialBody(node.name);
    if (!planet) return [];

    const path3D: Vector3D[] = [];
    
    let segments = 120; 
    let duration = planet.period;
    let startTime = 0;
    
    if (state.currentSystem === 'Geo-centric') {
        const params = getGeocentricOrbitParams(planet.name, planet.period);
        duration = params.durationInDays;
        segments = params.segmentCount;
        // In Geocentric mode, the orbit is a "Trail" that follows the planet.
        // We render from [CurrentTime - Duration] to [CurrentTime].
        startTime = state.time - duration;
    }

    const segmentCount = segments + 1;
    
    for (let i = 0; i <= segmentCount; i++) {
        // Calculate time for this segment
        const timeAtAngle = startTime + duration * (i / segments);
        const pos = calculatePlanetPosition(planet, timeAtAngle, state);
        path3D.push(pos);
    }
    cache.current.set(node.id, path3D);
    return path3D;
};

/**
 * Checks if any relevant simulation parameters have changed, requiring a clear of the 3D orbit cache.
 */
export const checkOrbitCache = (
    state: AppState,
    planetNodesToDraw: PlanetNode[],
    cacheKeyRef: React.MutableRefObject<string>,
    cacheRef: React.MutableRefObject<Map<number, Vector3D[]>>
) => {
    const { currentSystem, sceneScale, useRealisticPhysics, ellipticalOrbits, orbitalInclination, showOrbits, planetDataOverrides, logarithmicOrbits, isPlanetModificationMode, logarithmicOrbitsT, ellipticalOrbitsT, orbitalInclinationT } = state;
    
    const overridesKey = Object.keys(planetDataOverrides)
      .sort()
      .map(planetName => {
        const overrides = planetDataOverrides[planetName];
        if (!overrides) return '';
        const overrideParts = Object.keys(overrides) as (keyof typeof overrides)[];
        return `${planetName}:${overrideParts.sort().map(prop => `${String(prop)}=${overrides[prop as keyof typeof overrides]}`).join(',')}`;
      })
      .join(';');

    let newCacheKey = [
        currentSystem, sceneScale, useRealisticPhysics, ellipticalOrbits, orbitalInclination,
        planetNodesToDraw.map(p => p.name).join(','),
        overridesKey,
        logarithmicOrbits, isPlanetModificationMode, logarithmicOrbitsT, ellipticalOrbitsT, orbitalInclinationT,
        showOrbits, isPlanetModificationMode
    ].join('-');

    // For Geocentric mode, the geometry is time-dependent (trails), so we must
    // include time in the cache key to force updates. We floor it to allow slight caching
    // between sub-frame renders if necessary, but generally this busts cache every frame.
    if (currentSystem === 'Geo-centric') {
        newCacheKey += `-${state.time}`;
    }

    if (newCacheKey !== cacheKeyRef.current) {
        cacheKeyRef.current = newCacheKey;
        cacheRef.current.clear();
    }
};

/**
 * Retrieves the 3D orbit path and projects it to 2D screen space based on the current camera state.
 */
export const getProjectedOrbitPaths = (
    node: PlanetNode,
    state: AppState,
    actions: { getCelestialBody: (name: string) => CelestialBodyData | undefined },
    baseCacheRef: React.MutableRefObject<Map<number, Vector3D[]>>,
    canvas: HTMLCanvasElement
): OrbitPaths | null => {
    if (!state.showOrbits && !state.isPlanetModificationMode) {
        return null;
    }

    const basePath3D = getOrUpdate3DBaseOrbit(node, state, actions, baseCacheRef);
    if (basePath3D.length < 2) return null;
    
    const offset = state.actualZOffsets[node.name] ?? 0;
    
    // Apply Z-offset (visual stacking)
    const finalPath3D = basePath3D.map(p => ({ ...p, z: p.z + offset }));
    
    // Project to 2D
    const path2D = finalPath3D.map(pos => project2D(pos, canvas, state));

    return { path3D: finalPath3D, path2D };
};
