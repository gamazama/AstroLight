
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { HINTS } from '../data/hintData';

export const useBeginnerMode = () => {
    // OPTIMIZATION: Select only the state required for trigger evaluation.
    // We deliberately exclude 'time', 'particles', 'lineHistory' to prevent
    // the hook from re-running 60 times a second on every frame.
    // Instead, we use a local 'tick' state to force re-evaluation of time-based hints at a lower frequency.
    const appState = useAppStore(state => ({
        beginnerMode: state.beginnerMode,
        showIntroScreen: state.showIntroScreen,
        connections: state.connections,
        timeSpeed: state.timeSpeed,
        isCameraDragging: state.isCameraDragging,
        isCameraPanning: state.isCameraPanning,
        actualZoom: state.actualZoom,
        openTopMenuDropdown: state.openTopMenuDropdown,
        enableLineZDrift: state.enableLineZDrift,
        expandedLayers: state.expandedLayers,
        isResettingCamera: state.isResettingCamera,
        isShortcutsModalOpen: state.isShortcutsModalOpen,
        isStartDatePickerOpen: state.isStartDatePickerOpen,
        isEndDatePickerOpen: state.isEndDatePickerOpen,
        targetZOffset: state.targetZOffset,
        isBrushMode: state.isBrushMode,
        isFullscreen: state.isFullscreen,
        hasSystemBeenChanged: state.hasSystemBeenChanged,
        showLines: state.showLines,
        useRealisticPhysics: state.useRealisticPhysics,
        isJplPanelOpen: state.isJplPanelOpen,
        isSoundEnabled: state.isSoundEnabled,
        isSoundCreator2Open: state.isSoundCreator2Open,
        selectedConnectionId: state.selectedConnectionId,
        currentSystem: state.currentSystem,
        isPlanetModificationMode: state.isPlanetModificationMode,
        isControlPanelCollapsed: state.isControlPanelCollapsed,
        actions: state.actions,
    }), shallow);

    const { 
        beginnerMode, 
        showIntroScreen,
        isCameraDragging,
        isCameraPanning,
        actualZoom,
        timeSpeed,
        openTopMenuDropdown,
        enableLineZDrift,
        isResettingCamera,
        isShortcutsModalOpen,
        isStartDatePickerOpen,
        isEndDatePickerOpen,
        targetZOffset,
        actions 
    } = appState;

    const prevZoomRef = useRef(actualZoom);
    const [tick, setTick] = useState(0);

    // --- Low-Frequency Heartbeat ---
    // Forces the hook to re-evaluate logic every 1 second to check time-based triggers
    // (e.g., "if time > 2000"). This saves performance compared to checking every frame.
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- Usage Tracking ---
    useEffect(() => {
        if (!beginnerMode.isActive) return;

        if (isCameraDragging || isCameraPanning) {
            actions.markFeatureUsed('camera_move');
        }
        if (isResettingCamera) {
            actions.markFeatureUsed('camera_reset');
        }
        if (Math.abs(actualZoom - prevZoomRef.current) > 0.1) {
            actions.markFeatureUsed('camera_zoom');
            prevZoomRef.current = actualZoom;
        }
        if (timeSpeed > 10) {
            actions.markFeatureUsed('high_speed');
        }
        if (openTopMenuDropdown === 'planets') {
            actions.markFeatureUsed('planets_menu_opened');
        }
        if (openTopMenuDropdown === 'presets') {
            actions.markFeatureUsed('presets_opened');
        }
        if (enableLineZDrift) {
            actions.markFeatureUsed('drift_enabled');
        }
        if (isShortcutsModalOpen) {
            actions.markFeatureUsed('shortcuts_opened');
        }
        if (isStartDatePickerOpen || isEndDatePickerOpen) {
            actions.markFeatureUsed('date_picker_opened');
        }
        if (targetZOffset !== 0) {
             actions.markFeatureUsed('z_offset_tweaked');
        }

    }, [isCameraDragging, isCameraPanning, actualZoom, timeSpeed, openTopMenuDropdown, enableLineZDrift, beginnerMode.isActive, isResettingCamera, isShortcutsModalOpen, isStartDatePickerOpen, isEndDatePickerOpen, targetZOffset, actions]);


    // --- Logic Evaluation ---
    const { currentHint, availableDiscoveryHint } = useMemo(() => {
        // Completely disable if inactive OR ON INTRO SCREEN
        if (!beginnerMode.isActive || showIntroScreen) {
            return { currentHint: null, availableDiscoveryHint: null };
        }

        // Pause hints if a dropdown menu is open (to avoid obstruction)
        if (openTopMenuDropdown) {
            return { currentHint: null, availableDiscoveryHint: null };
        }
        
        // To evaluate hints that depend on properties not in our optimized selector (like 'time'),
        // we must access the full state *inside* this useMemo. 
        // Crucially, this useMemo only re-runs when 'appState' changes (UI events) OR when 'tick' changes (1s interval).
        // This prevents 60fps re-renders.
        const fullStateForEvaluation = useAppStore.getState();

        // 1. Check for currently active forced hint (from store)
        if (beginnerMode.currentHintId) {
            const hint = HINTS.find(h => h.id === beginnerMode.currentHintId);
            
            // IMPORTANT: If the hint is found, check if it is ALREADY COMPLETED.
            // If so, return null immediately so the UI updates, and let the useEffect below clean up the ID.
            if (hint) {
                const isCompleted = hint.completion(fullStateForEvaluation);
                if (isCompleted) {
                    return { currentHint: null, availableDiscoveryHint: null };
                }
                return { currentHint: hint, availableDiscoveryHint: null };
            }
        }

        // 2. Check for AUTO hints that should trigger immediately
        const autoHint = HINTS.find(hint => {
            if (hint.type !== 'auto') return false;
            const isDismissed = beginnerMode.dismissedHints.includes(hint.id);
            const isCompleted = hint.completion(fullStateForEvaluation);
            const isTriggered = hint.trigger(fullStateForEvaluation);
            return isTriggered && !isCompleted && !isDismissed;
        });

        if (autoHint) {
            // Check if we need to modify the hint based on panel state
            if (autoHint.id === 'customize') {
                // If panel is open (or at least one layer is expanded, implying interaction), remove the action button
                const isAnyLayerExpanded = Object.values(appState.expandedLayers).some(v => v);
                if (isAnyLayerExpanded) {
                     return { currentHint: { ...autoHint, action: undefined }, availableDiscoveryHint: null };
                }
            }
            
            return { currentHint: autoHint, availableDiscoveryHint: null };
        }

        // 3. Check for DISCOVERY hints (passive)
        const discoveryHint = HINTS.find(hint => {
            if (hint.type !== 'discovery') return false;
            const isDismissed = beginnerMode.dismissedHints.includes(hint.id);
            const isCompleted = hint.completion(fullStateForEvaluation);
            const isTriggered = hint.trigger(fullStateForEvaluation);
            return isTriggered && !isCompleted && !isDismissed;
        });

        return { currentHint: null, availableDiscoveryHint: discoveryHint || null };

    }, [beginnerMode, showIntroScreen, openTopMenuDropdown, appState, tick]);

    // Trigger auto-hints state update
    useEffect(() => {
        // Case A: Setting a new auto-hint
        if (currentHint && currentHint.type === 'auto' && beginnerMode.currentHintId !== currentHint.id) {
            const timer = setTimeout(() => {
                actions.setCurrentHint(currentHint.id);
            }, 500);
            return () => clearTimeout(timer);
        }
        
        // Case B: Cleaning up a completed hint (Auto-Dismissal)
        // If we have a forced ID in the store, but the logic says it's done (or useMemo returned null), dismiss it.
        if (beginnerMode.currentHintId) {
            const activeHint = HINTS.find(h => h.id === beginnerMode.currentHintId);
            if (activeHint) {
                // Check state directly to ensure we don't rely on stale closures
                const isCompleted = activeHint.completion(useAppStore.getState());
                if (isCompleted) {
                    actions.dismissHint(activeHint.id);
                }
            }
        }

    }, [currentHint, beginnerMode.currentHintId, actions, appState /* Dep for re-check */]);

    return {
        currentHint,
        availableDiscoveryHint
    };
};
