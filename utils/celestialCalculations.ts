
import type { CelestialBodyData } from '../types/celestial';

// The orbital period of Earth, used as a reference for geocentric calculations
// involving a body with a period of 0 (like the Sun).
const EARTH_PERIOD = 365.25;

/**
 * Calculates the synodic period between two orbiting bodies.
 * Handles the special case where one body has a period of 0 by substituting Earth's period.
 * @param period1 The orbital period of the first body.
 * @param period2 The orbital period of the second body.
 * @returns The synodic period.
 */
export const calculateSynodicPeriod = (period1: number, period2: number) => {
    const p1 = period1 === 0 ? EARTH_PERIOD : period1;
    const p2 = period2 === 0 ? EARTH_PERIOD : period2;

    if (p1 === p2) return p1;
    return 1 / Math.abs((1 / p1) - (1 / p2));
};

/**
 * Calculates a simple, clean harmonic multiplier for line persistence based on the ratio of two orbital periods.
 * Handles the special case where one body has a period of 0 by substituting Earth's period.
 * @param period1 The orbital period of the first body.
 * @param period2 The orbital period of the second body.
 * @param limit Optional cap for the multiplier. Defaults to Infinity.
 * @returns A small integer multiplier for creating aesthetically pleasing patterns.
 */
export const calculateHarmonicMultiplier = (period1: number, period2: number, limit: number = Infinity): number => {
    const p1 = period1 === 0 ? EARTH_PERIOD : period1;
    const p2 = period2 === 0 ? EARTH_PERIOD : period2;
    
    const ratio = Math.max(p1, p2) / Math.min(p1, p2);

    if (Math.abs(ratio - 1) < 0.01) {
        return 1;
    }

    let best_n = Math.floor(ratio);
    let best_d = 1;
    
    const max_denominator = 30;

    for (let d = 1; d <= max_denominator; d++) {
        const n = Math.round(d * ratio);
        if (n === 0) continue;

        if (Math.abs(ratio - n / d) < Math.abs(ratio - best_n / best_d)) {
            best_n = n;
            best_d = d;
        }
    }
    
    const multiplier = Math.abs(best_n - best_d) || 1;
    
    // Apply the limit if provided
    return Math.min(multiplier, limit);
};
