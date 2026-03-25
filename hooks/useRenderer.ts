import React, { useEffect, useRef, useCallback } from 'react';
import type { AppState } from '../types/state';
import type { CelestialBodyData } from '../types/celestial';
import { drawScene } from './renderer/drawing';
import { useAppStore } from '../store/appStore';

export const useRenderer = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
) => {
    const animationFrameId = useRef<number | undefined>(undefined);
    const stateForAnimationRef = useRef(useAppStore.getState());

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state) => (stateForAnimationRef.current = state)
        );
        return unsubscribe;
    }, []);

    const animate = useCallback(() => {
        const s = stateForAnimationRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (canvas && ctx) {
            drawScene(ctx, canvas, s, s.actions.getCelestialBody, s.actualZOffsets);
        }

        animationFrameId.current = requestAnimationFrame(animate);
    }, [canvasRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        
        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [animate]);
};