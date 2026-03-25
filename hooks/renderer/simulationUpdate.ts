
import type { AppState, CelestialBodyData, Line, Particle, Connection } from '../../types';
import { calculatePlanetPosition } from './calculations';
import { generateParticlesForQuad, updateParticles } from './particleSystem';
import { calculateSynodicPeriod } from '../../utils/celestialCalculations';
import { calculateZOffsets } from '../../utils/zOffsetCalculations';
import { sampleGradient } from '../../utils/colorUtils';
import { lerp } from '../../utils/mathUtils';


const lastLinePositions = new Map<number, { time: number }>();

/**
 * Clears the internal cache that tracks the last drawn time for each connection.
 * This should be called whenever the scene is completely reset (e.g., changing systems, loading presets)
 * to prevent state from one set of connections from leaking to another.
 */
export const clearLastLinePositions = () => {
    lastLinePositions.clear();
};

// =================================================================================================
// --- HELPER FUNCTIONS (Refactored from _updateLineHistory) ---
// =================================================================================================

const FADE_SECONDS = 2.0;

/**
 * Applies the global scene drift to a line's position.
 * Mutates the line object in place.
 */
const applyDrift = (line: Line, driftAmount: number, axis: 'x' | 'z') => {
    if (driftAmount === 0) return;
    
    line.from[axis] -= driftAmount;
    line.to[axis] -= driftAmount;
    
    // For dying lines, we don't track base positions anymore as they are noise-driven.
    // For active lines, we must shift the base to keep the reference frame consistent.
    if (!line.isDying) {
        line.baseFrom[axis] -= driftAmount;
        line.baseTo[axis] -= driftAmount;
    }
};

/**
 * Garbage collection for the draw-time cache.
 * Removes entries for connections that no longer have any visible lines on screen.
 */
const cleanupConnectionCache = (
    activeConnectionIdsInFrame: Set<number>, 
    allCurrentConnectionIds: Set<number>
) => {
    for (const connectionId of lastLinePositions.keys()) {
        // If a connection has no visible lines AND is not in the current active list (e.g. was deleted), remove it.
        // We keep it if it's in 'allCurrentConnectionIds' even if no lines are drawn yet (e.g. paused at start),
        // to preserve the 'last drawn time' state.
        if (!activeConnectionIdsInFrame.has(connectionId) && !allCurrentConnectionIds.has(connectionId)) {
            lastLinePositions.delete(connectionId);
        }
    }
};


// =================================================================================================
// --- MAIN LOGIC ---
// =================================================================================================

const _updateTime = (s: AppState, deltaTime: number) => {
    let newTime = s.time + s.timeSpeed * 60 * deltaTime;
    let shouldStop = false;

    if (s.endDate) {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const currentTime = new Date(s.startDate.getTime() + newTime * MS_PER_DAY);
        if (currentTime >= s.endDate) {
            newTime = (s.endDate.getTime() - s.startDate.getTime()) / MS_PER_DAY;
            shouldStop = true;
        }
    }
    
    // Guard against NaN/Infinity
    if (!isFinite(newTime) || isNaN(newTime)) {
        newTime = s.time; // Keep old time
        shouldStop = true;
    }
    
    return { newTime, shouldStop };
};

const _calculateDrift = (s: AppState, deltaTime: number) => {
    let driftAmount = 0;
    if (s.enableLineZDrift && s.lineZDriftSpeed !== 0 && s.isPlaying) {
        driftAmount = s.lineZDriftSpeed * s.timeSpeed * deltaTime;
    }
    return { driftAmount };
};

const _updateLineHistory = (
    s: AppState,
    deltaTime: number,
    newTime: number,
    driftAmount: number,
    getCelestialBody: (name: string) => CelestialBodyData | undefined
): Line[] => {
    const nextHistory: Line[] = [];
    const activeConnectionIdsInFrame = new Set<number>();
    const driftAxis = s.lineDriftAxis || 'z';

    // Performance: We iterate and mutate in-place where possible to reduce GC pressure.
    for (const line of s.lineHistory) {
        if (line.isDying) {
            // --- Handle Dying Lines ---
            const newTimeToLive = (line.timeToLive ?? FADE_SECONDS) - deltaTime;
            
            if (newTimeToLive > 0) {
                line.timeToLive = newTimeToLive;
                
                // Wobble/Displacement is now handled entirely in the Vertex Shader (historyLine.vert.ts)
                // based on the 'dyingParams' attribute. We only handle physical drift here.
                applyDrift(line, driftAmount, driftAxis);
                
                nextHistory.push(line);
                activeConnectionIdsInFrame.add(line.connectionId);
            }
        } else if ((newTime - line.time) < line.persistence) {
            // --- Handle Active Lines ---
            applyDrift(line, driftAmount, driftAxis);
            
            nextHistory.push(line);
            activeConnectionIdsInFrame.add(line.connectionId);
        }
    }

    const currentConnectionIds = new Set<number>(s.connections.map(c => c.id));
    cleanupConnectionCache(activeConnectionIdsInFrame, currentConnectionIds);

    return nextHistory;
};

/**
 * Helper to calculate the time steps at which new lines should be generated in a given frame.
 * This encapsulates the complex logic of handling time steps, start offsets, and persistence culling.
 */
const _calculateNewLineTimeSteps = (
    prevTime: number,
    newTime: number,
    lineDrawAngle: number,
    fasterPlanetPeriod: number,
    linePersistence: number
): number[] => {
    const timeSteps: number[] = [];
    if (lineDrawAngle <= 0 || fasterPlanetPeriod <= 0) {
        return timeSteps;
    }

    const timeStepPerAngle = (lineDrawAngle / 360) * fasterPlanetPeriod;
    if (timeStepPerAngle <= 0) return timeSteps;

    // To optimize, only start generating lines from the point they would become visible.
    const earliestVisibleTime = newTime - linePersistence;
    const generationStartTime = Math.max(prevTime, earliestVisibleTime);

    let startTimeOffset = 0;
    // If we're skipping a large chunk of time, calculate the offset to the first
    // line that should be drawn in the current frame, avoiding a long loop.
    if (generationStartTime > prevTime) {
        const stepsToSkip = Math.floor((generationStartTime - prevTime) / timeStepPerAngle);
        startTimeOffset = stepsToSkip * timeStepPerAngle;
    }
    
    // Start the loop from the correctly offset time.
    const loopStartTime = prevTime + startTimeOffset + timeStepPerAngle;

    for (let t = loopStartTime; t <= newTime; t += timeStepPerAngle) {
        timeSteps.push(t);
    }
    return timeSteps;
};

/**
 * Helper to generate a single new Line object for a given time `t`.
 * This includes calculating planet positions and applying drift correction.
 */
const _generateNewLine = (
    t: number,
    fromPlanet: CelestialBodyData,
    toPlanet: CelestialBodyData,
    conn: Connection,
    linePersistence: number,
    driftAmount: number,
    newTime: number, // The end time of the current frame
    s: AppState
): Line => {
    const baseFromPos3D = calculatePlanetPosition(fromPlanet, t, s);
    const baseToPos3D = calculatePlanetPosition(toPlanet, t, s);
    const fromPos3D = { ...baseFromPos3D };
    const toPos3D = { ...baseToPos3D };
    
    if (driftAmount !== 0) {
        const frameDelta = newTime - s.time;
        if (frameDelta > 0) {
            // Drift correction logic: Interpolate backward from current time
            const driftCorrection = driftAmount * ((newTime - t) / frameDelta);
            const driftAxis = s.lineDriftAxis || 'z';
            fromPos3D[driftAxis] -= driftCorrection;
            toPos3D[driftAxis] -= driftCorrection;
            baseFromPos3D[driftAxis] -= driftCorrection;
            baseToPos3D[driftAxis] -= driftCorrection;
        }
    }

    let lineColor = conn.color;

    if (s.lineColorMode === 'distance') {
        const getRadius = (planet: CelestialBodyData, state: AppState) => {
            const rLinear = planet.orbitRadius * state.sceneScale;
            const rLog = (Math.log(planet.orbitRadius + 1) * 100) * state.sceneScale;
            return lerp(rLinear, rLog, state.logarithmicOrbitsT);
        };
    
        const r1 = getRadius(fromPlanet, s);
        const r2 = getRadius(toPlanet, s);
        const maxDist = r1 + r2;
        const minDist = Math.abs(r1 - r2);
        
        const currentDist = Math.hypot(
            baseToPos3D.x - baseFromPos3D.x,
            baseToPos3D.y - baseFromPos3D.y,
            baseToPos3D.z - baseFromPos3D.z
        );
    
        const range = maxDist - minDist;
        const normalizedDist = range > 0.001 ? Math.max(0, Math.min(1, (currentDist - minDist) / range)) : 0;
        
        lineColor = sampleGradient(s.lineGradient, normalizedDist);
    
    } else if (s.lineColorMode === 'orbit') {
        // Use 'From' planet period for cycle
        const period = fromPlanet.period || 365.25;
        const phase = (t % period) / period;
        lineColor = sampleGradient(s.lineGradient, phase);
    }
    
    return {
        id: Math.random() + t,
        baseFrom: baseFromPos3D,
        baseTo: baseToPos3D,
        from: fromPos3D,
        to: toPos3D,
        color: lineColor,
        time: t,
        persistence: linePersistence,
        connectionId: conn.id,
        fromPlanetName: fromPlanet.name,
        toPlanetName: toPlanet.name,
    };
};

const _generateNewLinesAndParticles = (
    s: AppState,
    newTime: number,
    driftAmount: number,
    getCelestialBody: (name: string) => CelestialBodyData | undefined,
    zOffsets: Map<string, number>
) => {
    const newLines: Line[] = [];
    let newParticles: Particle[] = [];

    const doomedConnectionIds = new Set<number>();
    if (s.isPresetTransitioning && s.presetTransition) {
        s.presetTransition.connectionsToRemove.forEach(c => doomedConnectionIds.add(c.id));
        s.presetTransition.connectionsToUpdate.forEach(c => doomedConnectionIds.add(c.from.id));
    }

    if (s.showLines || s.isSparkleMode) {
        for (const conn of s.connections) {
            if (doomedConnectionIds.has(conn.id)) continue;

            const fromNode = s.planetNodes.find(n => n.id === conn.from);
            const toNode = s.planetNodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) continue;
            
            const fromPlanet = getCelestialBody(fromNode.name);
            const toPlanet = getCelestialBody(toNode.name);
            if (!fromPlanet || !toPlanet) continue;
            
            let prevTime = lastLinePositions.get(conn.id)?.time;
            if (prevTime === undefined || s.time < prevTime) prevTime = s.time;

            if (s.showLines && !s.debugDisableLines) {
                const fasterPlanet = (fromPlanet.period !== 0 && (fromPlanet.period <= toPlanet.period || toPlanet.period === 0)) ? fromPlanet : toPlanet;
                const synodicPeriod = calculateSynodicPeriod(fromPlanet.period, toPlanet.period);
                const linePersistence = synodicPeriod * conn.persistenceMultiplier;

                const effectiveDrawAngle = s.lineDrawAngle;

                const timeSteps = _calculateNewLineTimeSteps(prevTime, newTime, effectiveDrawAngle, fasterPlanet.period, linePersistence);
                
                for (const t of timeSteps) {
                    newLines.push(_generateNewLine(t, fromPlanet, toPlanet, conn, linePersistence, driftAmount, newTime, s));
                }
                
                if (timeSteps.length > 0) {
                    lastLinePositions.set(conn.id, { time: timeSteps[timeSteps.length - 1] });
                } else {
                    lastLinePositions.set(conn.id, { time: prevTime });
                }
            }

            if (s.isSparkleMode && !s.debugDisableParticles) {
                const driftAxis = s.lineDriftAxis || 'z';
                const fromPos3D_prev = { ...calculatePlanetPosition(fromPlanet, s.time, s) };
                fromPos3D_prev.z += zOffsets.get(fromPlanet.name) ?? 0;
                const toPos3D_prev = { ...calculatePlanetPosition(toPlanet, s.time, s) };
                toPos3D_prev.z += zOffsets.get(toPlanet.name) ?? 0;

                if (driftAmount !== 0) {
                    fromPos3D_prev[driftAxis] -= driftAmount;
                    toPos3D_prev[driftAxis] -= driftAmount;
                }

                const fromPos3D_current = { ...calculatePlanetPosition(fromPlanet, newTime, s) };
                fromPos3D_current.z += zOffsets.get(fromPlanet.name) ?? 0;
                const toPos3D_current = { ...calculatePlanetPosition(toPlanet, newTime, s) };
                toPos3D_current.z += zOffsets.get(toPlanet.name) ?? 0;

                newParticles.push(...generateParticlesForQuad({
                    fromPrev: fromPos3D_prev, toPrev: toPos3D_prev,
                    fromCurr: fromPos3D_current, toCurr: toPos3D_current,
                    color: conn.color, connectionId: conn.id
                }, s));
            }
        }
    }
    return { newLines, newParticles };
};

/**
 * The main simulation update function, called on every animation frame.
 * It calculates the state of the universe for the next frame.
 */
export const calculateFrameUpdate = (
    s: AppState,
    getCelestialBody: (name: string) => CelestialBodyData | undefined,
    deltaTime: number
) => {
    // 1. Update Time
    const { newTime, shouldStop } = _updateTime(s, deltaTime);
    
    // 2. Calculate Scene Drift for lines and particles
    const { driftAmount } = _calculateDrift(s, deltaTime);
    
    // 3. Update existing line history (decay, drift)
    const survivingHistory = _updateLineHistory(s, deltaTime, newTime, driftAmount, getCelestialBody);
    
    // 4. Generate new lines and particles for this frame
    const zOffsets = calculateZOffsets(s, getCelestialBody);
    const { newLines, newParticles } = _generateNewLinesAndParticles(s, newTime, driftAmount, getCelestialBody, zOffsets);
    
    // 5. Combine history and enforce max lines cap
    // Append new lines to surviving history in-place instead of spread-copying both arrays
    if (newLines.length > 0) {
        for (let i = 0; i < newLines.length; i++) survivingHistory.push(newLines[i]);
    }
    if (survivingHistory.length > s.maxLines) {
        survivingHistory.splice(0, survivingHistory.length - s.maxLines);
    }

    // 6. Update existing particles in-place and append new ones
    // Pass the original array directly — updateParticles mutates in-place then filters dead.
    const survivingParticles = updateParticles(s.particles, driftAmount, s.lineDriftAxis || 'z', deltaTime, s.particleDrag, s.isPlaying);
    if (newParticles.length > 0) {
        for (let i = 0; i < newParticles.length; i++) survivingParticles.push(newParticles[i]);
    }

    // 7. Count dying lines for O(1) check in simulation loop
    let dyingLineCount = 0;
    for (let i = 0; i < survivingHistory.length; i++) {
        if (survivingHistory[i].isDying) dyingLineCount++;
    }

    // 8. Return all computed next-frame state
    return { newTime, finalHistory: survivingHistory, finalParticles: survivingParticles, shouldStop, newLines, dyingLineCount };
};
