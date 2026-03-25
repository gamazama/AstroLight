
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

export const usePerformanceOptimization = () => {
    const { isPerformanceMode, actions } = useAppStore(state => ({
        isPerformanceMode: state.isPerformanceMode,
        actions: state.actions,
    }), shallow);

    const hasAutoDetected = useRef(false);
    const prevModeRef = useRef(isPerformanceMode);

    // 1. Auto-Detection on Mount
    useEffect(() => {
        if (hasAutoDetected.current) return;
        hasAutoDetected.current = true;

        const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory; // RAM in GB (approx)
        const cores = navigator.hardwareConcurrency;

        // Heuristic for "Low Spec"
        // - RAM < 4GB
        // - Cores < 4
        // - Low power mobile GPU (hard to detect directly without WebGL debug, but RAM usually correlates)
        const isLowSpec = (memory && memory < 4) || (cores && cores < 4);

        if (isLowSpec) {
            if (import.meta.env.DEV) console.log("[AstroLight] Low-spec device detected. Enabling Performance Mode.");
            actions.updateUI({ isPerformanceMode: true });
            actions.showNotification("Performance Mode enabled for your device.");
        }
    }, [actions]);

    // 2. React to Mode Change
    useEffect(() => {
        // Only trigger if the mode actually flipped
        if (isPerformanceMode === prevModeRef.current) return;
        prevModeRef.current = isPerformanceMode;

        if (isPerformanceMode) {
            // --- Apply Optimization Settings ---
            actions.adjustParameter({
                uiBlurAmount: 0, // Disable costly backdrop-filter
                dofStrength: 0,  // Disable expensive fragment shader blur
                isSparkleMode: false, // Disable particle system
                showNebula: false, // Reduce overdraw
                starCount: Math.min(2000, useAppStore.getState().starCount), // Cap stars
                maxLines: Math.min(5000, useAppStore.getState().maxLines), // Reduce geometry buffer
                isMyceliumMode: false, // Disable complex noise shader
                disableCameraSmoothing: true // Optional: make camera snappier
            });
        } else {
            // --- Restore "High Quality" Defaults ---
            // Note: We don't restore exact previous values because that's complex to track.
            // We just restore sensible high-quality defaults.
            actions.adjustParameter({
                uiBlurAmount: 10,
                isSparkleMode: true,
                showNebula: true,
                disableCameraSmoothing: false
            });
        }
    }, [isPerformanceMode, actions]);
};
