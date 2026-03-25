
import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { lerp } from '../utils/mathUtils';
import { INTERPOLATABLE_PRESET_KEYS } from '../constants';
import { initialVisualsState } from '../initialState';
import { 
    setupFadeAnimations, 
    calculateCameraModeUpdates, 
    calculateDriftUpdates, 
    interpolateProperties, 
    calculateConnectionTransition,
    calculateMidpointUpdates,
    calculateSpeedUpdate
} from '../utils/presetTransitionUtils';
import type { AppState } from '../types';

export const usePresetTransition = () => {
    const { updateUI, updateSimulation, updateVisuals, showNotification, resetHistory } = useAppStore.getState().actions;

    const animationFrameId = useRef<number | null>(null);
    const orthoMidpointZoom = useRef<number | null>(null);
    const didApplyFadeInFix = useRef(false);

    const runTransitionStep = useCallback(() => {
        const s = useAppStore.getState();

        if (s.presetTransition?.isActive) {
            const { startTime, duration, fromState, toState, connectionsToRemove, connectionsToAdd, connectionsToUpdate, endConfig } = s.presetTransition;
            const now = performance.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Ease in-out
        
            const updates: Partial<AppState> = {};

            // 1. Boolean Toggle Animation (Fade In/Out & Grow/Shrink)
            const { effectiveFromState, effectiveToState, initialUpdates } = setupFadeAnimations(fromState, endConfig, toState);
            
            if (Object.keys(initialUpdates).length > 0 && !didApplyFadeInFix.current) {
                updateSimulation(initialUpdates);
                didApplyFadeInFix.current = true;
            }

            // 2. Camera Mode Transition
            const { updates: cameraUpdates, isSwitchingToOrtho } = calculateCameraModeUpdates(fromState, endConfig, s, elapsed);
            Object.assign(updates, cameraUpdates);
        
            // 3. Drift Transition
            const driftUpdates = calculateDriftUpdates(fromState, toState, endConfig, s, easedProgress);
            Object.assign(updates, driftUpdates);

            // 4. Speed Transition
            const speedUpdates = calculateSpeedUpdate(fromState, toState, progress);
            Object.assign(updates, speedUpdates);

            // 5. Interpolate Properties
            const excludedKeys = new Set<string>(['lineZDriftSpeed', 'timeSpeed']); 
            if (isSwitchingToOrtho) {
                excludedKeys.add('targetZoom');
                excludedKeys.add('targetFov');
            }
            
            const interpolatedUpdates = interpolateProperties(INTERPOLATABLE_PRESET_KEYS, effectiveFromState, effectiveToState, easedProgress, excludedKeys);
            Object.assign(updates, interpolatedUpdates);
            
            // --- Pivot & World Rotation Cleanup ---
            // If the current scene has a pivot, but the target preset (typically) doesn't,
            // we must interpolate worldRotation and pivotOffset to 0.
            if (s.pivotPoint) {
                const currentRot = s.worldRotation;
                const currentOffset = s.pivotOffset;
                
                // Only interpolate if they are non-zero, to save ops
                if (currentRot.x !== 0 || currentRot.y !== 0 || currentRot.z !== 0) {
                    updates.worldRotation = {
                        x: lerp(currentRot.x, 0, easedProgress),
                        y: lerp(currentRot.y, 0, easedProgress),
                        z: lerp(currentRot.z, 0, easedProgress),
                    };
                }
                if (currentOffset.x !== 0 || currentOffset.y !== 0 || currentOffset.z !== 0) {
                     updates.pivotOffset = {
                        x: lerp(currentOffset.x, 0, easedProgress),
                        y: lerp(currentOffset.y, 0, easedProgress),
                        z: lerp(currentOffset.z, 0, easedProgress),
                    };
                }
                // Note: pivotClosingStartTime logic could be used here for the visual gizmo shrink,
                // but managing that parallel to this big transition is tricky.
                // Simply zeroing out parameters works well for scene transitions.
            }


            // 6. System Swap V-Curve Logic
            const isSystemSwap = (fromState as any).currentSystem !== endConfig.system;
            
            if (isSystemSwap) {
                // Calculate V-Curve Multiplier: 1 -> 0 -> 1
                let vCurveMultiplier = 1;
                if (progress < 0.5) {
                    // Phase 1: 1 -> 0
                    vCurveMultiplier = 1 - (progress / 0.5);
                } else {
                    // Phase 2: 0 -> 1
                    vCurveMultiplier = (progress - 0.5) / 0.5;
                }
                // Apply slight easing to the V-curve so it's not too sharp
                vCurveMultiplier = vCurveMultiplier * vCurveMultiplier; 

                const vCurveProps: (keyof AppState)[] = [
                    'planetSizeMultiplier', 
                    'lineWidth', 
                    'liveLineWidth', 
                    'labelFontSize', 
                    'starSize', 
                    'particleSize', 
                    'nebulaParticleSize'
                ];

                vCurveProps.forEach(prop => {
                    let currentVal = updates[prop];
                    
                    if (currentVal === undefined) {
                         currentVal = effectiveFromState[prop as keyof typeof effectiveFromState] as number;
                    }

                    if (typeof currentVal === 'number') {
                         (updates as any)[prop] = currentVal * vCurveMultiplier;
                    }
                });
            }

            // 7. Ortho Switch Midpoint Zoom Handling
            if (isSwitchingToOrtho) {
                const midpoint = duration / 2;
                if (elapsed >= midpoint) {
                    if (orthoMidpointZoom.current === null) {
                        orthoMidpointZoom.current = s.actualZoom;
                    }
                    const phase2Progress = (elapsed - midpoint) / (duration - midpoint);
                    const easedPhase2 = 0.5 - 0.5 * Math.cos(phase2Progress * Math.PI);
                    const finalZoom = toState.targetZoom ?? initialVisualsState.targetZoom;
                    updates.targetZoom = lerp(orthoMidpointZoom.current, finalZoom, easedPhase2);
                } else {
                    orthoMidpointZoom.current = null;
                }
            } else {
                orthoMidpointZoom.current = null;
            }
            
            // 8. Connections & Midpoint Swaps
            const midpoint = duration / 2;
            
            if (elapsed >= midpoint) {
                 const midpointUpdates = calculateMidpointUpdates(s, endConfig);
                 Object.assign(updates, midpointUpdates);
            }
            
            updates.connections = calculateConnectionTransition(progress, connectionsToUpdate, connectionsToRemove, connectionsToAdd);
            
            // Apply updates
            updateSimulation(updates);
        
            // 9. Finalization
            if (progress >= 1) {
                const { time, startDate, endDate } = s;
                
                // Reconstruct final state cleanly
                const finalUpdates: Partial<AppState> = {
                    ...(toState as Partial<AppState>),
                    planetNodes: endConfig.planetNodes,
                    planetsToRender: endConfig.planetNodes,
                    planetDataOverrides: endConfig.planetDataOverrides,
                    documentName: endConfig.documentName,
                    time, startDate, endDate, 
                    isPlaying: endConfig.isPlaying,
                    useRealisticPhysics: endConfig.useRealisticPhysics,
                    ellipticalOrbits: endConfig.ellipticalOrbits,
                    logarithmicOrbits: endConfig.logarithmicOrbits,
                    logarithmicOrbitsT: endConfig.logarithmicOrbits ? 1 : 0,
                    ellipticalOrbitsT: endConfig.ellipticalOrbits ? 1 : 0,
                    orbitalInclinationT: endConfig.orbitalInclination ? 1 : 0,
                    orbitalInclination: endConfig.orbitalInclination,
                    renderMode: endConfig.renderMode,
                    ambientMotionMode: endConfig.ambientMotionMode,
                    lineBlendMode: endConfig.lineBlendMode,
                    lineDriftAxis: endConfig.lineDriftAxis,
                    enableLineZDrift: endConfig.enableLineZDrift,
                    isSkyboxEnabled: endConfig.isSkyboxEnabled,
                    skyboxImage: endConfig.skyboxImage,
                    showLiveConnections: endConfig.showLiveConnections,
                    hasSystemBeenChanged: s.currentSystem !== endConfig.system,
                    
                    presetTransition: null,
                    isPresetTransitioning: false,
                    
                    showOrbits: endConfig.showOrbits,
                    showPlanets: endConfig.showPlanets,
                    showLines: endConfig.showLines,
                    showLabels: endConfig.showLabels,
                    isSparkleMode: endConfig.isSparkleMode,
                    isMyceliumMode: endConfig.isMyceliumMode,
                    showUnconnectedLabels: endConfig.showUnconnectedLabels,
                    showUnconnectedPlanets: endConfig.showUnconnectedPlanets,
                    useGradientBackground: endConfig.useGradientBackground,
                    showBackgroundColor: endConfig.showBackgroundColor,
                    showNebula: endConfig.showNebula,
                    showStars: endConfig.showStars,
                    showStarColors: endConfig.showStarColors,
                    webGLStarsOpposeDrift: endConfig.webGLStarsOpposeDrift,
                    lineColorMode: endConfig.lineColorMode,
                    lineGradient: endConfig.lineGradient,
                    orbitBlendMode: endConfig.orbitBlendMode,
                    debugDoFMode: endConfig.debugDoFMode,
                    
                    // Reset Pivot fully
                    pivotPoint: null,
                    pivotOffset: {x:0, y:0, z:0},
                    worldRotation: {x:0, y:0, z:0},
                };
                
                updateSimulation(finalUpdates);
                showNotification(`**Preset Loaded**: ${endConfig.documentName}`);
                resetHistory();
                orthoMidpointZoom.current = null;
                didApplyFadeInFix.current = false;
            }
        }
        
        if (useAppStore.getState().presetTransition?.isActive) {
            animationFrameId.current = requestAnimationFrame(runTransitionStep);
        } else {
            animationFrameId.current = null;
        }

    }, [updateUI, updateSimulation, updateVisuals, showNotification, resetHistory]);

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state, prevState) => {
                const isStarting = state.presetTransition?.isActive && !prevState.presetTransition?.isActive;
                if (isStarting && !animationFrameId.current) {
                    didApplyFadeInFix.current = false; 
                    animationFrameId.current = requestAnimationFrame(runTransitionStep);
                }
            }
        );

        return () => {
            unsubscribe();
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [runTransitionStep]);
};
