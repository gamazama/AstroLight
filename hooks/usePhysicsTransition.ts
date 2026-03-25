import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { lerp } from '../utils/mathUtils';
import type { SimulationState } from '../types';

const LERP_FACTOR = 0.15; // Animation speed

/**
 * This hook is the single source of truth for managing the smooth transitions 
 * of the physics parameters (logarithmicOrbitsT, ellipticalOrbitsT, orbitalInclinationT).
 * It runs its own animation loop, decoupled from the main simulation loop, to prevent conflicts.
 */
export const usePhysicsTransition = () => {
    const { updateSimulation } = useAppStore.getState().actions;
    const animationFrameId = useRef<number | null>(null);

    const runTransitionStep = useCallback(() => {
        const s = useAppStore.getState();

        const transitions = [
            { target: s.logarithmicOrbits, current: s.logarithmicOrbitsT, key: 'logarithmicOrbitsT' },
            { target: s.ellipticalOrbits, current: s.ellipticalOrbitsT, key: 'ellipticalOrbitsT' },
            { target: s.orbitalInclination, current: s.orbitalInclinationT, key: 'orbitalInclinationT' },
        ];

        const updates: Partial<SimulationState> = {};
        let needsAnimate = false;

        for (const transition of transitions) {
            const targetT = transition.target ? 1.0 : 0.0;
            if (Math.abs(transition.current - targetT) > 0.001) {
                let newT = lerp(transition.current, targetT, LERP_FACTOR);
                if (Math.abs(newT - targetT) < 0.001) {
                    newT = targetT;
                }
                (updates as any)[transition.key] = newT;
                needsAnimate = true;
            }
        }

        if (needsAnimate) {
            updateSimulation(updates);
            // Request the next frame to continue the animation.
            animationFrameId.current = requestAnimationFrame(runTransitionStep);
        } else {
            // All animations are complete, stop the loop.
            animationFrameId.current = null;
        }
    }, [updateSimulation]);
    
    // This effect subscribes to the relevant state changes to start the animation loop when needed.
    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state, prevState) => {
                const targetsChanged = 
                    state.logarithmicOrbits !== prevState.logarithmicOrbits ||
                    state.ellipticalOrbits !== prevState.ellipticalOrbits ||
                    state.orbitalInclination !== prevState.orbitalInclination;

                // If a target boolean has changed AND the animation loop isn't already running, start it.
                if (targetsChanged && !animationFrameId.current) {
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