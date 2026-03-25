import type { AppState, Line, Particle, CelestialBodyData, Vector3D } from '../../types/index';
import { project2D } from './calculations';
import { hexToRgb, lerpRGB } from '../../utils/colorUtils';
import { lerp } from '../../utils/mathUtils';

// --- Color Utilities ---
const whiteRgb = { r: 255, g: 255, b: 255 };

// --- Particle Logic ---

export interface EmissionQuad {
    fromPrev: Vector3D;
    toPrev: Vector3D;
    fromCurr: Vector3D;
    toCurr: Vector3D;
    color: string;
    connectionId: number;
}

export const generateParticlesForQuad = (quad: EmissionQuad, state: AppState): Particle[] => {
    const newParticles: Particle[] = [];
    const PARTICLE_COUNT = state.particleQuantity;
    const BASE_PARTICLE_SPEED = 120; // Units per second
    const PARTICLE_LIFESPAN = state.particleLifespan; // Seconds
    const FLASH_CHANCE = 0.05; // 5% chance to be a white flash particle

    const { fromPrev, toPrev, fromCurr, toCurr, color, connectionId } = quad;

    const lineVec = { x: toCurr.x - fromCurr.x, y: toCurr.y - fromCurr.y, z: toCurr.z - fromCurr.z };
    const lineLength = Math.sqrt(lineVec.x ** 2 + lineVec.y ** 2 + lineVec.z ** 2);
    const lineDir = lineLength > 0 ? { x: lineVec.x / lineLength, y: lineVec.y / lineLength, z: lineVec.z / lineLength } : { x: 0, y: 0, z: 0 };

    // New size calculation based on line length, with a minimum size to ensure visibility on short lines.
    const baseParticleSize = Math.max(0.5, lineLength * 0.0025) * state.particleSize;

    for (let p = 0; p < PARTICLE_COUNT; p++) {
        const u = Math.random(); // along the line segment
        const v = Math.random(); // between previous and current frame

        // Bilinear interpolation to find a random point in the quad
        // P(u,v) = (1-v) * [(1-u)p_from_prev + u*p_to_prev] + v * [(1-u)p_from_curr + u*p_to_curr]
        const prevX = fromPrev.x * (1 - u) + toPrev.x * u;
        const prevY = fromPrev.y * (1 - u) + toPrev.y * u;
        const prevZ = fromPrev.z * (1 - u) + toPrev.z * u;
        
        const currX = fromCurr.x * (1 - u) + toCurr.x * u;
        const currY = fromCurr.y * (1 - u) + toCurr.y * u;
        const currZ = fromCurr.z * (1 - u) + toCurr.z * u;

        const x = prevX * (1 - v) + currX * v;
        const y = prevY * (1 - v) + currY * v;
        const z = prevZ * (1 - v) + currZ * v;

        const randomVec = { x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 };
        const randomLength = Math.sqrt(randomVec.x ** 2 + randomVec.y ** 2 + randomVec.z ** 2);
        const randomDir = randomLength > 0 ? { x: randomVec.x / randomLength, y: randomVec.y / randomLength, z: randomVec.z / randomLength } : { x: 1, y: 0, z: 0 };
        
        const maxSpeed = BASE_PARTICLE_SPEED * state.particleSpeed;
        // The new speed calculation ensures a minimum speed of 50% of the max, adding a 50% variance.
        const speed = (0.5 + Math.random() * 0.5) * maxSpeed;
        
        newParticles.push({
            x, y, z,
            vx: (lineDir.x * 0.3 + randomDir.x * 0.7) * speed,
            vy: (lineDir.y * 0.3 + randomDir.y * 0.7) * speed,
            vz: (lineDir.z * 0.3 + randomDir.z * 0.7) * speed,
            life: PARTICLE_LIFESPAN,
            maxLife: PARTICLE_LIFESPAN,
            color: color,
            size: baseParticleSize * (Math.random() * 0.5 + 0.75), // Randomize size by +/- 25%
            connectionId: connectionId,
            isFlashParticle: Math.random() < FLASH_CHANCE,
            randomPhase: Math.random(),
        });
    }
    return newParticles;
};

export const updateParticles = (particles: Particle[], driftAmount: number, driftAxis: 'x' | 'z', deltaTime: number, drag: number, isPlaying: boolean): Particle[] => {
    const dragFactor = Math.max(0, 1 - drag * deltaTime);
    
    // Performance: Mutate particle objects in-place to avoid creating thousands of new objects per frame,
    // which reduces pressure on the garbage collector.
    for (const p of particles) {
        if (isPlaying) {
            p.vx *= dragFactor;
            p.vy *= dragFactor;
            p.vz *= dragFactor;

            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.z += p.vz * deltaTime;
            p.life -= deltaTime;
        }
        
        if (driftAmount !== 0) {
            p[driftAxis] -= driftAmount;
        }
    }
    
    // After mutation, filter out the dead particles to return a new array of survivors.
    return particles.filter(p => p.life > 0);
};