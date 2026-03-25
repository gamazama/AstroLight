import type { AppState } from '../types/state';
import type { CelestialBodyData } from '../types/celestial';

/**
 * Calculates the Z-axis offset for each active planet based on their orbital radius.
 * This function is used to create a 3D separation effect.
 * @param s The current application state.
 * @param getCelestialBody A function to retrieve detailed planet data.
 * @returns A Map where keys are planet names and values are their calculated Z-offset.
 */
export const calculateZOffsets = (
    s: AppState,
    getCelestialBody: (name: string) => CelestialBodyData | undefined
): Map<string, number> => {
    const zOffsets = new Map<string, number>();
    
    // If zOffset is disabled or there are no connections, there are no offsets.
    if (s.targetZOffset === 0 || s.connections.length === 0) {
        return zOffsets;
    }

    // Get IDs of all planets involved in connections
    const activePlanetIds = new Set<number>();
    s.connections.forEach(conn => {
        activePlanetIds.add(conn.from);
        activePlanetIds.add(conn.to);
    });

    // Filter to get only the active planet nodes
    const activePlanetNodes = s.planetNodes.filter(node => activePlanetIds.has(node.id));
    if (activePlanetNodes.length < 2) {
        return zOffsets;
    }

    // Get the full data for the active planets and sort them by orbit radius
    const activePlanetData = activePlanetNodes
        .map(node => getCelestialBody(node.name))
        .filter((p): p is CelestialBodyData => p !== undefined)
        // Use a stable sort (adding name comparison) to prevent visual jitter
        // in systems where planets might have identical orbital radii (e.g., Cubica).
        .sort((a, b) => a.orbitRadius - b.orbitRadius || a.name.localeCompare(b.name));
    
    // Calculate and apply offsets based on the sorted list of *active* planets
    const centerIndex = (activePlanetData.length - 1) / 2;
    activePlanetData.forEach((p, i) => {
        zOffsets.set(p.name, (i - centerIndex) * s.targetZOffset);
    });

    return zOffsets;
};