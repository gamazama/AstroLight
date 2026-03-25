


import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { SCRUB_HOLD_DELAY_MS } from '../constants';
import { interactionState } from '../store/interactionState';

export const useKeyboardShortcuts = () => {
    const { state, ...actions } = useAppStore(state => ({
        state: {
            isSoundEnabled: state.isSoundEnabled,
            isSettingsPanelOpen: state.isSettingsPanelOpen,
            isSpeedScrubbing: state.isSpeedScrubbing,
            isZOffsetScrubbing: state.isZOffsetScrubbing,
            isDriftScrubbing: state.isDriftScrubbing,
            isFovScrubbing: state.isFovScrubbing,
            enableLineZDrift: state.enableLineZDrift,
            isBrushMode: state.isBrushMode,
            isSoundCreator2Open: state.isSoundCreator2Open,
            isFullscreen: state.isFullscreen,
        },
        // Actions
        startSpeedScrub: state.actions.startSpeedScrub,
        stopSpeedScrub: state.actions.stopSpeedScrub,
        startZOffsetScrub: state.actions.startZOffsetScrub,
        stopZOffsetScrub: state.actions.stopZOffsetScrub,
        startDriftScrub: state.actions.startDriftScrub,
        stopDriftScrub: state.actions.stopDriftScrub,
        startFovScrub: state.actions.startFovScrub,
        stopFovScrub: state.actions.stopFovScrub,
        togglePlay: state.actions.togglePlay,
        handleReset: state.actions.handleReset,
        toggleBrushMode: state.actions.toggleBrushMode,
        toggleFullscreen: state.actions.toggleFullscreen,
        toggleSound: state.actions.toggleSound,
        updateLineBrightness: state.actions.updateLineBrightness,
        updateUI: state.actions.updateUI,
        toggleRenderMode: state.actions.toggleRenderMode,
        undo: state.actions.undo,
        redo: state.actions.redo,
        toggleShowOrbits: state.actions.toggleShowOrbits,
        toggleShowPlanets: state.actions.toggleShowPlanets,
        toggleShowLiveConnections: state.actions.toggleShowLiveConnections,
        toggleIsSparkleMode: state.actions.toggleIsSparkleMode,
        resetTargetZOffset: state.actions.resetTargetZOffset,
        disableDriftMode: state.actions.disableDriftMode,
        markFeatureUsed: state.actions.markFeatureUsed,
    }), shallow);

    const { isAboutModalOpen, isShortcutsModalOpen, isStartDatePickerOpen, isEndDatePickerOpen, tutorialStep } = useAppStore(state => ({
        isAboutModalOpen: state.isAboutModalOpen,
        isShortcutsModalOpen: state.isShortcutsModalOpen,
        isStartDatePickerOpen: state.isStartDatePickerOpen,
        isEndDatePickerOpen: state.isEndDatePickerOpen,
        tutorialStep: state.tutorialStep,
    }), shallow);

    const isUIBlocked = isAboutModalOpen || isShortcutsModalOpen || isStartDatePickerOpen || isEndDatePickerOpen || tutorialStep !== null;

    const dKeyTimer = useRef<number | null>(null);
    const vKeyTimer = useRef<number | null>(null);
    const zKeyTimer = useRef<number | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isUIBlocked) return;
            const target = e.target as HTMLElement;

            if (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') {
                return;
            }
            if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                return;
            }

            const key = e.key.toLowerCase();
            const isModKey = e.ctrlKey || e.metaKey;

            // Global Esc to exit specialized modes
            if (e.key === 'Escape') {
                if (state.isBrushMode) {
                    actions.toggleBrushMode();
                    return;
                }
                if (state.isSoundCreator2Open) {
                    actions.updateUI({ isSoundCreator2Open: false });
                    return;
                }
                if (state.isFullscreen) {
                    actions.toggleFullscreen();
                    return;
                }
                if (state.isSettingsPanelOpen) {
                    actions.updateUI({ isSettingsPanelOpen: false });
                    return;
                }
            }

            if (isModKey && key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    actions.redo();
                } else {
                    actions.undo();
                }
                return;
            }
            if (isModKey && key === 'y') {
                e.preventDefault();
                actions.redo();
                return;
            }
            
            if (isModKey) return; // Ignore other mod key combinations for now

            if (key === 's' && !state.isSpeedScrubbing) {
                e.preventDefault();
                actions.startSpeedScrub();
                actions.markFeatureUsed('speed_scrub_action'); // Track usage for beginner hint
                return;
            }
            if (key === 'z') {
                e.preventDefault();
                if (zKeyTimer.current === null && !state.isZOffsetScrubbing) {
                    zKeyTimer.current = window.setTimeout(() => {
                        actions.startZOffsetScrub();
                        zKeyTimer.current = null;
                    }, SCRUB_HOLD_DELAY_MS);
                }
                return;
            }
            if (key === 'd') {
                e.preventDefault();
                if (dKeyTimer.current === null && !state.isDriftScrubbing) {
                    dKeyTimer.current = window.setTimeout(() => {
                        actions.startDriftScrub();
                        actions.markFeatureUsed('drift_scrub_action');
                        dKeyTimer.current = null;
                    }, SCRUB_HOLD_DELAY_MS);
                }
                return;
            }
            if (key === 'v') {
                e.preventDefault();
                if (vKeyTimer.current === null && !state.isFovScrubbing) {
                    vKeyTimer.current = window.setTimeout(() => {
                        actions.startFovScrub();
                        vKeyTimer.current = null;
                    }, SCRUB_HOLD_DELAY_MS);
                }
                return;
            }

            switch (key) {
                case ' ': e.preventDefault(); actions.togglePlay(); break;
                case 'r': actions.handleReset(); break;
                case 'b': actions.toggleBrushMode(); break;
                case 'f': actions.toggleFullscreen(); break;
                case 'm': actions.toggleSound(!state.isSoundEnabled); break;
                case 'o': actions.toggleShowOrbits(); break;
                case 'p': actions.toggleShowPlanets(); break;
                case 'l': actions.toggleShowLiveConnections(); break;
                case 'k': actions.toggleIsSparkleMode(); break;
                case '[': actions.updateLineBrightness(-0.1); break;
                case ']': actions.updateLineBrightness(0.1); break;
                case '`': actions.updateUI({ isSettingsPanelOpen: !state.isSettingsPanelOpen }); break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 's' && state.isSpeedScrubbing) {
                actions.stopSpeedScrub();
            }
            if (key === 'z') {
                if (zKeyTimer.current !== null) {
                    clearTimeout(zKeyTimer.current);
                    zKeyTimer.current = null;
                    actions.resetTargetZOffset();
                } else if (state.isZOffsetScrubbing) {
                    actions.stopZOffsetScrub();
                }
            }
            if (key === 'd') {
                if (dKeyTimer.current !== null) {
                    clearTimeout(dKeyTimer.current);
                    dKeyTimer.current = null;
                    if (state.enableLineZDrift) {
                        actions.disableDriftMode();
                    }
                } else if (state.isDriftScrubbing) {
                    interactionState.scrub.isAxisLocked = false; // Reset lock
                    actions.stopDriftScrub();
                }
            }
            if (key === 'v') {
                if (vKeyTimer.current !== null) {
                    clearTimeout(vKeyTimer.current);
                    vKeyTimer.current = null;
                    actions.toggleRenderMode();
                } else if (state.isFovScrubbing) {
                    actions.stopFovScrub();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [actions, isUIBlocked, state]);
};
