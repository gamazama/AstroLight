
import type { AppState } from '../../types/state';
import type { CelestialBodyData } from '../../types/celestial';
import type { Vector3D } from '../../types/common';
import { getPlanetPosition as getRealPlanetPositionV1 } from '../../utils/orbitalCalculations';
import { MS_PER_DAY, EPOCH_DATE } from '../../constants';
import { lerp } from '../../utils/mathUtils';

// =================================================================================================
// --- HELPER FUNCTIONS FOR PLANET POSITION CALCULATION ---
// =================================================================================================

const getJplPosition = (
    planetName: string,
    time: number, // in days from simulation start
    state: AppState
): Vector3D | null => {
    const pathInfo = state.highPrecisionPaths[planetName];
    if (!pathInfo || pathInfo.data.length < 2) return null;

    const pathStartDate = new Date(pathInfo.startDate);
    const currentSimDate = new Date(state.startDate.getTime() + time * MS_PER_DAY);

    // Ensure current date is within the path's fetched range
    if (currentSimDate < pathStartDate) return null;

    const daysSincePathStart = (currentSimDate.getTime() - pathStartDate.getTime()) / MS_PER_DAY;
    const indexFloat = daysSincePathStart / pathInfo.stepInDays;
    
    if (indexFloat >= 0 && indexFloat < pathInfo.data.length - 1) {
        const index0 = Math.floor(indexFloat);
        const index1 = index0 + 1;
        const t = indexFloat - index0;

        const p0 = pathInfo.data[index0];
        const p1 = pathInfo.data[index1];

        // Perform interpolation and return position in AU
        return {
            x: lerp(p0.x, p1.x, t),
            y: lerp(p0.y, p1.y, t),
            z: lerp(p0.z, p1.z, t),
        };
    }

    return null; // Out of range
};

/**
 * Calculates the 3D position of a celestial body using a simplified physics model.
 * This function handles interpolation between circular/elliptical orbits and flat/inclined planes.
 * It is the core building block for most non-realistic simulation modes.
 */
const calculateSimplifiedOrbit = (
    planet: CelestialBodyData,
    time: number,
    radius: number, // The pre-calculated radius (linear or log)
    state: AppState
): Vector3D => {
    const { ellipticalOrbitsT, orbitalInclinationT, startDate } = state;
    
    const daysSinceEpoch = (startDate.getTime() - EPOCH_DATE.getTime()) / MS_PER_DAY;
    const totalTime = daysSinceEpoch + time;
    
    const phaseOffsetRad = planet.phaseOffset ? (planet.phaseOffset * Math.PI / 180) : 0;
    const revolutions = totalTime / planet.period;
    const angle = (revolutions % 1.0) * 2 * Math.PI + phaseOffsetRad;

    let x, y, z;

    const x_circ = radius * Math.cos(angle);
    const y_circ = radius * Math.sin(angle);

    const a = radius;
    const e = planet.eccentricity;
    const b = a * Math.sqrt(1 - e * e);
    const x_ellip = a * Math.cos(angle) - (a * e);
    const y_ellip = b * Math.sin(angle);

    x = lerp(x_circ, x_ellip, ellipticalOrbitsT);
    const y_plane = lerp(y_circ, y_ellip, ellipticalOrbitsT);

    const inclinationRad = (planet.inclination * Math.PI) / 180;
    const cosIncl = Math.cos(inclinationRad);
    const sinIncl = Math.sin(inclinationRad);
    const y_inclined = y_plane * cosIncl;
    const z_inclined = y_plane * sinIncl;

    y = lerp(y_plane, y_inclined, orbitalInclinationT);
    z = lerp(0, z_inclined, orbitalInclinationT);
    
    return { x, y, z };
};

/**
 * Calculates planet positions for binary star systems, where all bodies orbit a common barycenter.
 * Uses the simplified physics model with logarithmic orbit scaling.
 */
export const calculateBinarySystemPosition = (
    planet: CelestialBodyData,
    time: number,
    state: AppState
): Vector3D => {
    const { logarithmicOrbitsT, sceneScale } = state;
    const rLinear = planet.orbitRadius * sceneScale;
    const rLog = (Math.log(planet.orbitRadius + 1) * 100) * sceneScale;
    const r = lerp(rLinear, rLog, logarithmicOrbitsT);

    return calculateSimplifiedOrbit(planet, time, r, state);
};


/**
 * Calculates planet positions for the Geo-centric view, where all bodies orbit a stationary Earth.
 * It uses realistic orbital data for all bodies except the Moon, which uses a simplified model relative to Earth.
 */
export const calculateGeoCentricPosition = (
    planet: CelestialBodyData,
    time: number,
    state: AppState
): Vector3D => {
    const { sceneScale, startDate } = state;
    const date = new Date(startDate.getTime() + time * MS_PER_DAY);
    const AU_IN_MILLION_KM = 149.6;

    // The Moon orbits Earth (the origin), so we can use the simplified model directly.
    if (planet.name === 'Moon') {
        const { logarithmicOrbitsT } = state;
        const rLinear = planet.orbitRadius * sceneScale;
        const rLog = (Math.log(planet.orbitRadius + 1) * 100) * sceneScale;
        const r = lerp(rLinear, rLog, logarithmicOrbitsT);
        return calculateSimplifiedOrbit(planet, time, r, state);
    }

    const earthPosAU = state.useJplHorizons ? getJplPosition('Earth', time, state) : (
        getRealPlanetPositionV1('Earth', date)
    );
        
    if (!earthPosAU) return { x: 0, y: 0, z: 0 };

    let bodyPosAU: { x: number; y: number; z: number } | null;
    if (planet.name === 'Sun') {
        bodyPosAU = { x: 0, y: 0, z: 0 };
    } else {
        bodyPosAU = state.useJplHorizons ? getJplPosition(planet.name, time, state) : (
            getRealPlanetPositionV1(planet.name, date)
        );
    }

    if (!bodyPosAU) return { x: 0, y: 0, z: 0 };

    // Calculate position relative to Earth in million km
    const geoPosUnscaled = {
        x: (bodyPosAU.x - earthPosAU.x) * AU_IN_MILLION_KM,
        y: (bodyPosAU.y - earthPosAU.y) * AU_IN_MILLION_KM,
        z: (bodyPosAU.z - earthPosAU.z) * AU_IN_MILLION_KM,
    };

    const distance = Math.sqrt(geoPosUnscaled.x**2 + geoPosUnscaled.y**2 + geoPosUnscaled.z**2);
    let finalPosLog = geoPosUnscaled;
    if (distance > 0) {
        const logDistance = Math.log(distance + 1) * 100;
        const scaleFactor = logDistance / distance;
        finalPosLog = {
            x: geoPosUnscaled.x * scaleFactor,
            y: geoPosUnscaled.y * scaleFactor,
            z: geoPosUnscaled.z * scaleFactor
        };
    }
    
    // Interpolate between linear and log scales for the final geocentric position
    const finalPos = {
        x: lerp(geoPosUnscaled.x, finalPosLog.x, state.logarithmicOrbitsT),
        y: lerp(geoPosUnscaled.y, finalPosLog.y, state.logarithmicOrbitsT),
        z: lerp(geoPosUnscaled.z, finalPosLog.z, state.logarithmicOrbitsT),
    };
    
    return {
        x: finalPos.x * sceneScale,
        y: finalPos.y * sceneScale,
        z: finalPos.z * sceneScale,
    };
};

/**
 * Calculates planet positions for the fictional 'Cubica' system, which uses simple circular orbits
 * and a static Z-offset defined by the 'inclination' property.
 */
export const calculateCubicaPosition = (
    planet: CelestialBodyData,
    time: number,
    state: AppState
): Vector3D => {
    const { sceneScale, startDate } = state;
    const r = planet.orbitRadius * sceneScale;
    const phaseOffsetRad = planet.phaseOffset ? (planet.phaseOffset * Math.PI / 180) : 0;
    const daysSinceEpoch = (startDate.getTime() - EPOCH_DATE.getTime()) / MS_PER_DAY;
    const totalTime = daysSinceEpoch + time;
    const revolutions = totalTime / planet.period;
    const angle = (revolutions % 1.0) * 2 * Math.PI + phaseOffsetRad;

    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    // 'inclination' property is repurposed as a static Z offset for this system.
    const z = planet.inclination * sceneScale;
    return { x, y, z };
};

/**
 * Calculates planet positions for the Sol and Sol (Extended) systems.
 * This function smoothly interpolates between a simplified, customizable physics model and a
 * time-accurate, realistic physics model based on the state of the UI toggles.
 */
export const calculateSolSystemPosition = (
    planet: CelestialBodyData,
    time: number,
    state: AppState
): Vector3D => {
    const { sceneScale, useRealisticPhysics, useJplHorizons, ellipticalOrbitsT, orbitalInclinationT, logarithmicOrbitsT, startDate } = state;
    const AU_IN_MILLION_KM = 149.6;
    
    // --- Position A: "Fitted Scale" (simplified physics, logarithmic radius) ---
    const rLog = (Math.log(planet.orbitRadius + 1) * 100) * sceneScale;
    const pos_fitted = calculateSimplifiedOrbit(planet, time, rLog, state);

    // --- Position B: "Realistic Scale" ---
    let pos_realistic: Vector3D;
    const rLinear = planet.orbitRadius * sceneScale;
    const pos_simplified_realistic_scale = calculateSimplifiedOrbit(planet, time, rLinear, state);
    
    const date = new Date(startDate.getTime() + time * MS_PER_DAY);
    
    let posAU: Vector3D | null = null;
    if (useJplHorizons) {
        posAU = getJplPosition(planet.name, time, state);
    }
    // Fallback if JPL is disabled or data is missing for this planet
    if (!posAU && useRealisticPhysics) {
        posAU = getRealPlanetPositionV1(planet.name, date);
    }
    
    if (posAU) {
        const scale = sceneScale * AU_IN_MILLION_KM;
        const pos_true_physics = { x: posAU.x * scale, y: posAU.y * scale, z: posAU.z * scale };
        // Blend from simplified to true physics as shape toggles are enabled for a smooth hand-off.
        const blendFactor = Math.max(ellipticalOrbitsT, orbitalInclinationT);
        pos_realistic = {
            x: lerp(pos_simplified_realistic_scale.x, pos_true_physics.x, blendFactor),
            y: lerp(pos_simplified_realistic_scale.y, pos_true_physics.y, blendFactor),
            z: lerp(pos_simplified_realistic_scale.z, pos_true_physics.z, blendFactor),
        };
    } else {
        pos_realistic = pos_simplified_realistic_scale;
    }
    
    // --- Final Interpolation between "Fitted" and "Realistic" scales ---
    return {
        x: lerp(pos_realistic.x, pos_fitted.x, logarithmicOrbitsT),
        y: lerp(pos_realistic.y, pos_fitted.y, logarithmicOrbitsT),
        z: lerp(pos_realistic.z, pos_fitted.z, logarithmicOrbitsT),
    };
};
