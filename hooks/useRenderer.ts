import React, { useEffect, useRef, useCallback } from 'react';
import type { AppState } from '../types/state';
import type { CelestialBodyData } from '../types/celestial';
import { drawScene } from './renderer/drawing';
import { useAppStore } from '../store/appStore';
import { registerFrameCallback, unregisterFrameCallback } from './renderLoop';

export const useRenderer = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
    const stateForAnimationRef = useRef(useAppStore.getState());
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state) => (stateForAnimationRef.current = state)
        );
        return unsubscribe;
    }, []);

    const animate = useCallback(() => {
        const s = stateForAnimationRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Cache the context on first use
        if (!ctxRef.current) {
            ctxRef.current = canvas.getContext('2d');
        }
        const ctx = ctxRef.current;

        if (ctx) {
            drawScene(ctx, canvas, s, s.actions.getCelestialBody, s.actualZOffsets);
        }
    }, [canvasRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Context can be invalidated on resize in some browsers
            ctxRef.current = canvas.getContext('2d');
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        registerFrameCallback('renderer', animate, 20);

        return () => {
            window.removeEventListener('resize', handleResize);
            unregisterFrameCallback('renderer');
        };
    }, [animate]);
};
