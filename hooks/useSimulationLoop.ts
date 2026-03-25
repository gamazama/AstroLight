
import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
// FIX: Import SimulationState to resolve 'Cannot find name' error.
import type { AppState, CelestialBodyData, VisualsState, Connection, SimulationState } from '../types';
import { STAR_SYSTEMS } from '../data/starSystems';
import { calculateFrameUpdate } from './renderer/simulationUpdate';
import { calculateZOffsets } from '../utils/zOffsetCalculations';
import { lerp } from '../utils/mathUtils';
import { FOV_LERP_FACTOR, FRAME_TIME_SMOOTHING_FACTOR, Z_OFFSET_LERP_FACTOR, ZOOM_LERP_FACTOR } from '../constants';

// --- Camera Transition Tuning Constants (co-located from global state) ---
const ORTHO_HANDOVER_FOV = 29.9;
const CAMERA_TRANSITION_COLLAPSE_MIN_LERP = 0.01;
const CAMERA_TRANSITION_COLLAPSE_MAX_LERP = 0.61;
const CAMERA_TRANSITION_EXPAND_MIN_LERP = 0.01;
const CAMERA_TRANSITION_EXPAND_MAX_LERP = 0.23;
const CAMERA_TRANSITION_EXPAND_EXPONENT = 7.4;
const CAMERA_TRANSITION_COLLAPSE_EXPONENT = 1;


export const useSimulationLoop = () => {
    const { updateFrameData, updateUI, updateSimulation, updateVisuals, showNotification, resetHistory } = useAppStore.getState().actions;

    const getCelestialBody = useCallback((name: string): CelestialBodyData | undefined => {
        const state = useAppStore.getState();
        const systemData = STAR_SYSTEMS[state.currentSystem];
        const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
        if (!basePlanetData) return undefined;
        return { ...basePlanetData, ...state.planetDataOverrides[name] };
    }, []);

    const animationFrameId = useRef<number | undefined>(undefined);
    const lastFrameTime = useRef<number>(performance.now());
    const wasHidden = useRef(document.hidden);
    const smoothedFrameTime = useRef(0);
    
    // Track current velocity of ambient motion for smooth transitions (Rotation, Tilt, PanX, PanY)
    const ambientVelocityRef = useRef({ r: 0, t: 0, x: 0, y: 0 });

    const runSimulationStep = useCallback(() => {
        const frameStartTime = performance.now();

        if (document.hidden) {
            wasHidden.current = true;
            animationFrameId.current = requestAnimationFrame(runSimulationStep);
            return;
        }

        if (wasHidden.current) {
            wasHidden.current = false;
            lastFrameTime.current = performance.now();
        }

        let s = useAppStore.getState(); // Read latest state directly from the store
        
        const now = performance.now();
        const delta = now - lastFrameTime.current;
        lastFrameTime.current = now;
        const deltaTimeInSeconds = delta / 1000;

        let newActualFov = s.actualFov;
        let newActualZoom = s.actualZoom;

        // --- Camera Transition Logic ---
        if (s.transitionFov && s.transitionZoom) {
            const fovTarget = s.transitionFov.to;
            const zoomTarget = s.transitionZoom.to;

            // Check if we are close enough to complete the transition
            if (Math.abs(s.actualFov - fovTarget) < 0.1) {
                // SNAP TO FINAL & CLEAN UP
                const finalZoom = zoomTarget;
                const finalFov = fovTarget;

                // Forcibly set the local variables for this frame's render to the exact final values.
                newActualFov = finalFov;
                newActualZoom = finalZoom;

                // Update the store with all final values, including 'actual' ones, to prevent next-frame correction.
                if (s.renderMode === 'perspective' && finalFov === ORTHO_HANDOVER_FOV && s.transitionFov.from >= ORTHO_HANDOVER_FOV) {
                    // Finishing transition to Ortho
                    updateVisuals({ 
                        renderMode: 'orthographic', 
                        transitionFov: null, 
                        transitionZoom: null,
                        targetZoom: finalZoom, 
                        actualZoom: finalZoom,
                        targetFov: finalFov,
                        actualFov: finalFov,
                    });
                } else {
                    // Finishing transition to Persp
                    updateVisuals({ 
                        transitionFov: null, 
                        transitionZoom: null,
                        targetZoom: finalZoom,
                        actualZoom: finalZoom,
                        targetFov: finalFov,
                        actualFov: finalFov,
                    });
                }
            } else {
                // TRANSITION IN PROGRESS - LERP
                const isExpanding = fovTarget > s.transitionFov.from;
                const minLerp = isExpanding ? CAMERA_TRANSITION_EXPAND_MIN_LERP : CAMERA_TRANSITION_COLLAPSE_MIN_LERP;
                const maxLerp = isExpanding ? CAMERA_TRANSITION_EXPAND_MAX_LERP : CAMERA_TRANSITION_COLLAPSE_MAX_LERP;
                const exponent = isExpanding ? CAMERA_TRANSITION_EXPAND_EXPONENT : CAMERA_TRANSITION_COLLAPSE_EXPONENT;

                const totalFovDistance = Math.abs(s.transitionFov.to - s.transitionFov.from);
                const currentFovDistance = Math.abs(fovTarget - s.actualFov);
                const progress = Math.max(0, 1.0 - (currentFovDistance / totalFovDistance));
                
                let easedProgress;
                if (isExpanding) {
                    // Ortho -> Persp (Expand) uses ease-out, which decelerates.
                    easedProgress = 1 - Math.pow(1 - progress, exponent);
                } else {
                    // Persp -> Ortho (Collapse) now uses ease-in, which accelerates.
                    easedProgress = Math.pow(progress, exponent);
                }

                const fovLerpFactor = minLerp + (maxLerp - minLerp) * easedProgress;
                newActualFov = lerp(s.actualFov, fovTarget, fovLerpFactor);

                const totalZoomDistance = Math.abs(s.transitionZoom.to - s.transitionZoom.from);
                const currentZoomDistance = Math.abs(zoomTarget - s.actualZoom);
                const zoomProgress = totalZoomDistance > 0.01 ? Math.max(0, 1.0 - (currentZoomDistance / totalZoomDistance)) : 1.0;
                
                let zoomEasedProgress;
                if (isExpanding) {
                    // Ortho -> Persp (Expand) uses ease-out.
                    zoomEasedProgress = 1 - Math.pow(1 - zoomProgress, exponent);
                } else {
                    // Persp -> Ortho (Collapse) uses ease-in.
                    zoomEasedProgress = Math.pow(zoomProgress, exponent);
                }

                const zoomLerpFactor = minLerp + (maxLerp - minLerp) * zoomEasedProgress;
                newActualZoom = lerp(s.actualZoom, zoomTarget, zoomLerpFactor);
            }
        } else {
            // DEFAULT SMOOTHER LOGIC
            const { disableCameraSmoothing, targetFov, targetZoom, renderMode } = s;
            const fovTargetForSmoothing = renderMode === 'orthographic' ? ORTHO_HANDOVER_FOV : targetFov;
            newActualFov = disableCameraSmoothing ? fovTargetForSmoothing : lerp(s.actualFov, fovTargetForSmoothing, FOV_LERP_FACTOR);
            newActualZoom = disableCameraSmoothing ? targetZoom : lerp(s.actualZoom, targetZoom, ZOOM_LERP_FACTOR);
        }

        // --- Z-Offset Smoothing ---
        const targetZOffsets = calculateZOffsets(s, getCelestialBody);
        const newOffsets: Record<string, number> = {};
        const allPlanetNames = new Set([...Array.from(targetZOffsets.keys()), ...Object.keys(s.actualZOffsets)]);
        allPlanetNames.forEach(name => {
            const target = targetZOffsets.get(name) ?? 0;
            const current = s.actualZOffsets[name] ?? 0;
            let newOffset = s.disableCameraSmoothing ? target : lerp(current, target, Z_OFFSET_LERP_FACTOR);
            if (Math.abs(newOffset - target) < 0.01) newOffset = target;
            if (newOffset !== 0 || target !== 0) newOffsets[name] = newOffset;
        });

        // --- Ambient Motion & Cinematic Intro Orbit (Smoothed) ---
        
        // 1. Calculate Target Velocities (The change we WANT to happen this frame)
        let targetDeltaRotation = 0;
        let targetDeltaTilt = 0;
        let targetDeltaX = 0;
        let targetDeltaY = 0;

        const isUserInteracting = s.isCameraDragging || s.isCameraPanning || s.isResettingCamera || s.isPresetTransitioning;

        if (!isUserInteracting) {
            if (s.showIntroScreen) {
                 const time = performance.now() / 1000;
                 // Intro Motion Targets
                 targetDeltaRotation = (0.8 + Math.sin(time * 0.05) * 0.2) * deltaTimeInSeconds;
                 
                 // For tilt, we calculate the desired absolute position, then find the delta from current
                 const desiredTilt = Math.sin(time * 0.1) * 15 + Math.sin(time * 0.3) * 5;
                 // We just use the delta here to keep it velocity-based like the others
                 // This approximates the derivative of the wave
                 targetDeltaTilt = ((Math.cos(time * 0.1) * 1.5 + Math.cos(time * 0.3) * 1.5) * deltaTimeInSeconds); 
            } else if (s.ambientMotionMode !== 'none') {
                const effectiveSpeed = s.ambientMotionSpeed;
                const time = performance.now() / 1000;

                switch (s.ambientMotionMode) {
                    case 'orbit': 
                        targetDeltaRotation = (effectiveSpeed * 5 * deltaTimeInSeconds); 
                        break;
                    case 'wobble':
                        // Derivative of the wobble sine/cos functions
                        targetDeltaTilt = (Math.cos(time * effectiveSpeed * 0.2) * 0.6 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds); // approx
                        targetDeltaRotation = (-Math.sin(time * effectiveSpeed * 0.2 * 0.7) * 0.42 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds); // approx
                        break;
                    case 'drift':
                        // Derivative of drift functions
                        targetDeltaX = (Math.cos(time*effectiveSpeed*0.1) * 1.5 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        targetDeltaY = (-Math.sin(time*effectiveSpeed*0.1*1.3) * 2.0 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        break;
                    case 'figure8':
                        // Lissajous pattern: Rotation = sin(t), Tilt = sin(2t)
                        // Derivative for velocity: dRot = cos(t), dTilt = 2cos(2t)
                        targetDeltaRotation = (Math.cos(time * effectiveSpeed * 0.2) * 1.5 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        targetDeltaTilt = (Math.cos(time * effectiveSpeed * 0.4) * 1.0 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        break;
                    case 'spiral':
                         // Constant rotation + Oscillating Tilt
                        targetDeltaRotation = (effectiveSpeed * 3 * deltaTimeInSeconds);
                        targetDeltaTilt = (Math.sin(time * effectiveSpeed * 0.3) * 1.0 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        break;
                    case 'survey':
                        // Pan X sine wave (surveying left to right)
                        targetDeltaX = (Math.cos(time * effectiveSpeed * 0.15) * 4.0 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        break;
                    case 'float':
                        // Pan Y sine wave + Gentle Rotation
                        targetDeltaY = (Math.cos(time * effectiveSpeed * 0.2) * 3.0 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        targetDeltaRotation = (Math.sin(time * effectiveSpeed * 0.05) * 0.2 * effectiveSpeed * effectiveSpeed * deltaTimeInSeconds);
                        break;
                }
            }
        }

        // 2. Smooth the Velocity (Lerp current velocity towards target velocity)
        // This ensures when we switch modes (or turn off), the camera glides to the new behavior/halt.
        const AMBIENT_SMOOTHING = 0.05; // Adjust this for more/less inertia (0.01 - 0.1)
        
        const vel = ambientVelocityRef.current;
        vel.r = lerp(vel.r, targetDeltaRotation, AMBIENT_SMOOTHING);
        vel.t = lerp(vel.t, targetDeltaTilt, AMBIENT_SMOOTHING);
        vel.x = lerp(vel.x, targetDeltaX, AMBIENT_SMOOTHING);
        vel.y = lerp(vel.y, targetDeltaY, AMBIENT_SMOOTHING);

        // 3. Apply the Smoothed Velocity
        const ambientUpdates: Partial<VisualsState> = {};
        const VELOCITY_THRESHOLD = 0.00001;

        if (Math.abs(vel.r) > VELOCITY_THRESHOLD) ambientUpdates.rotation = s.rotation + vel.r;
        if (Math.abs(vel.t) > VELOCITY_THRESHOLD) ambientUpdates.tilt = s.tilt + vel.t;
        if (Math.abs(vel.x) > VELOCITY_THRESHOLD) ambientUpdates.viewOffsetX = s.viewOffsetX + vel.x;
        if (Math.abs(vel.y) > VELOCITY_THRESHOLD) ambientUpdates.viewOffsetY = s.viewOffsetY + vel.y;

        if (Object.keys(ambientUpdates).length > 0) updateSimulation(ambientUpdates as Partial<AppState>);


        const isSimulating = s.isPlaying && (s.connections.length > 0 || s.endDate !== null || s.lineHistory.some(l => l.isDying) || s.isPresetTransitioning);
        let frameUpdate: ReturnType<typeof calculateFrameUpdate>;

        if (isSimulating) {
            frameUpdate = calculateFrameUpdate(s, getCelestialBody, deltaTimeInSeconds);
        } else {
            frameUpdate = {
                newTime: s.isPlaying ? s.time + s.timeSpeed * 60 * deltaTimeInSeconds : s.time,
                finalHistory: s.lineHistory, finalParticles: s.particles,
                shouldStop: false, newLines: [],
            };
        }
        
        const currentFrameTime = performance.now() - frameStartTime;
        smoothedFrameTime.current = lerp(smoothedFrameTime.current, currentFrameTime, FRAME_TIME_SMOOTHING_FACTOR);

        updateFrameData({
            time: frameUpdate.newTime,
            lineHistory: frameUpdate.finalHistory,
            particles: frameUpdate.finalParticles,
            actualZoom: newActualZoom,
            actualFov: newActualFov,
            actualZOffsets: newOffsets,
        });
        
        updateUI({ frameTime: smoothedFrameTime.current });

        if (frameUpdate.shouldStop && s.isPlaying) {
            updateSimulation({ isPlaying: false });
            showNotification('**End date** reached. Simulation stopped.');
        }

        animationFrameId.current = requestAnimationFrame(runSimulationStep);
    }, [getCelestialBody, updateFrameData, updateUI, updateSimulation, updateVisuals, showNotification, resetHistory]);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(runSimulationStep);
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [runSimulationStep]);
};
