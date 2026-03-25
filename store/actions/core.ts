
import type { StoreSet, StoreGet } from '../appStore';
import type { AppState, CelestialBodyData, TemporalState, UndoableSimulationState, VisualsState, SimulationState } from '../../types';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { initialSimulationState, initialBackgroundState, initialVisualsState, initialUIState, getInitialTemporalState } from '../../initialState';
import { initialSoundState } from '../../AstroSound/soundStore';
import { MS_PER_DAY, EPOCH_DATE } from '../../constants';
import { clearLastLinePositions } from '../../hooks/renderer/simulationUpdate';

/**
 * Shallow equality check that avoids JSON.stringify overhead.
 * Handles primitives, arrays (shallow element comparison), and object references.
 */
const shallowEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    // For objects, compare by reference (already covers most cases since
    // temporal state stores snapshots that only change on undo/redo commits)
    return false;
};

const pluck = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        result[key] = obj[key];
    });
    return result;
}

const undoableSimKeys = (Object.keys(initialSimulationState) as (keyof SimulationState)[])
    .filter(k => k !== 'time' && k !== 'lineHistory' && k !== 'particles' && k !== 'highPrecisionPaths');

const transientVisualsKeys: (keyof VisualsState)[] = [
    'actualZoom',
    'actualFov',
    'actualZOffsets',
    'tilt',
    'rotation',
    'viewOffsetX',
    'viewOffsetY',
];
const undoableVisualsKeys = ([
    ...Object.keys(initialVisualsState),
    ...Object.keys(initialBackgroundState)
] as (keyof VisualsState)[]).filter(key => !transientVisualsKeys.includes(key));


const commitToHistory = (set: StoreSet, get: StoreGet) => {
    const { history, ...restOfState } = get();
    if (history.isTimeTraveling) return;

    const currentPresent: TemporalState = {
        simulationState: pluck(restOfState, undoableSimKeys as (keyof UndoableSimulationState)[]),
        visualsState: pluck(restOfState, undoableVisualsKeys),
        documentName: restOfState.documentName,
    };
    
    const newPast = [...history.past, history.present];

    set({
        history: {
            past: newPast,
            present: currentPresent,
            future: [],
            isTimeTraveling: false,
        }
    });
};

export const createCoreActions = (set: StoreSet, get: StoreGet) => {

    const _executeChangeSystem = (systemName: string) => {
        const system = STAR_SYSTEMS[systemName];
        if (!system) return;

        const currentRealisticPhysics = get().useRealisticPhysics;
        const isNewSystemSol = systemName === 'Sol' || systemName === 'Sol (Extended)';
        const isNewSystemGeoCentric = systemName === 'Geo-centric';
        
        const newPlanetNodes = system.celestialBodies.map((p, i) => ({ id: i + 1, name: p.name, color: p.color }));

        const COMPACT_SYSTEMS = new Set([
            'TRAPPIST-1',
            'Kepler-90',
            'Gliese 876',
            'Proxima Centauri',
            'Kepler-16',
            'Golden Spiral',
            'Musical Scale'
        ]);
        const newSceneScale = COMPACT_SYSTEMS.has(systemName) ? 5 : 1;
        
        clearLastLinePositions(); // Clear stale simulation state

        const simUpdates: Partial<AppState> = {
            currentSystem: systemName,
            sceneScale: newSceneScale,
            planetNodes: newPlanetNodes,
            planetsToRender: newPlanetNodes,
            connections: [],
            lineHistory: [],
            particles: [],
            planetDataOverrides: {},
            time: 0,
            useRealisticPhysics: (currentRealisticPhysics && isNewSystemSol) || isNewSystemGeoCentric,
            rotation: 0,
            tilt: 0,
            selectedPlanet: null,
            hasSystemBeenChanged: true,
            infoPanelPlanetId: null,
            isBottomControlsCollapsed: true,
        };
        set(simUpdates);
        get().actions.resetHistory();
        set({ notification: `**System changed** to ${systemName}.` });
    };

    const _executeNew = (overrides: Partial<AppState> = {}) => {
        clearLastLinePositions(); // Clear stale simulation state
        set({
            ...initialSimulationState,
            ...initialBackgroundState,
            ...initialVisualsState,
            ...initialUIState,
            ...initialSoundState,
            showIntroScreen: false,
            ...overrides
        });
        get().actions.resetHistory();
        set({ notification: '**New scene** created.' });
    };


    return {
        adjustParameter: (update: Partial<AppState>) => {
            if (get().history.isTimeTraveling) return;
        
            set(update);
        
            const s = get();
            const isScrubbing = s.isSpeedScrubbing || s.isZOffsetScrubbing || s.isDriftScrubbing || s.isFovScrubbing;
        
            if (s.isMouseDown || isScrubbing) {
                set({ adjustmentPending: true });
            } else {
                commitToHistory(set, get);
            }
        },
        getCelestialBody: (name: string): CelestialBodyData | undefined => {
            const state = get();
            const systemData = STAR_SYSTEMS[state.currentSystem];
            const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
            if (!basePlanetData) return undefined;
            return { ...basePlanetData, ...state.planetDataOverrides[name] };
        },
        handleReset: () => {
            set({ time: 0, lineHistory: [], particles: [] });
            commitToHistory(set, get);
            set({ notification: 'Animation reset to **start date**.' });
        },
        handleStop: () => {
            set({ isPlaying: false, time: 0, lineHistory: [], particles: [] });
            commitToHistory(set, get);
            set({ notification: 'Simulation **stopped** and reset to start date.' });
        },
        togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),
        handleNew: () => {
            const s = get();
            
            const startTransition = () => {
                // Preserve beginner mode state to prevent hints from resetting
                const currentBeginnerMode = s.beginnerMode;

                const overrides = {
                    showNebula: false,
                    showStars: false,
                    beginnerMode: currentBeginnerMode
                };

                // If we are on the intro screen, fade out the nebula first
                if (s.showIntroScreen) {
                    get().actions.handleStartSandbox(); // Use the coordinated transition
                } else {
                    // If not on intro screen, just reset immediately with overrides
                    _executeNew(overrides);
                }
            };

            if (s.history.past.length > 30) {
                 set({
                    confirmationDialog: {
                        title: 'Discard Changes?',
                        message: `You have unsaved changes. Are you sure you want to start a new creation?`,
                        onConfirm: () => {
                            startTransition();
                            set({ confirmationDialog: null });
                        }
                    }
                });
            } else {
                startTransition();
            }
        },
        setStartDateAndReset: (newDate: Date) => {
            const state = get();
            if (state.endDate && newDate >= state.endDate) {
                set({ endDate: null });
                set({ notification: '**End date** cleared as it was before the new start date.' });
            }
            set({ startDate: newDate, time: 0, lineHistory: [], particles: [], isStartDatePickerOpen: false });
            commitToHistory(set, get);
            set({ notification: `**Start date** set to ${newDate.toLocaleDateString()}` });
        },
        setEndDateAndReset: (newEndDate: Date) => {
            if (newEndDate <= get().startDate) {
                set({ notification: "**Error**: End date must be after start date." });
                set({ isEndDatePickerOpen: false });
                return;
            }
            set({ endDate: newEndDate, time: 0, lineHistory: [], particles: [], isPlaying: true, isEndDatePickerOpen: false });
            commitToHistory(set, get);
            set({ notification: `**End date** set. Simulation will run until ${newEndDate.toLocaleDateString()}` });
        },
        clearEndDate: () => {
            set({ endDate: null });
            commitToHistory(set, get);
            set({ notification: '**End date** cleared.' });
        },
        changeSystem: (systemName: string) => {
            const s = get();
            if (systemName === s.currentSystem) return;
    
            if (s.history.past.length > 30) {
                set({
                    confirmationDialog: {
                        title: 'Discard Changes?',
                        message: `You have unsaved changes. Are you sure you want to load the '${systemName}' system?`,
                        onConfirm: () => {
                            _executeChangeSystem(systemName);
                            set({ confirmationDialog: null });
                        }
                    }
                });
            } else {
                _executeChangeSystem(systemName);
            }
        },
        toggleFullscreen: () => {
            const enteringFullscreen = !get().isFullscreen;
            const updates: Partial<AppState> = { isFullscreen: enteringFullscreen };
            if (enteringFullscreen) {
                Object.assign(updates, {
                    isAboutModalOpen: false,
                    colorPicker: null,
                    isStartDatePickerOpen: false,
                    isEndDatePickerOpen: false,
                    tutorialStep: null,
                });
            }
            set(updates);
        },
        handleStartSandbox: (options?: { skipTransition?: boolean, disableBeginnerMode?: boolean }) => {
             const s = get();

             const overrides: Partial<AppState> = {
                 showNebula: false,
                 showStars: false,
                 nebulaOpacity: initialBackgroundState.nebulaOpacity,
                 isIntroTransitioning: false,
                 showIntroScreen: false
             };

             if (options?.disableBeginnerMode) {
                 overrides.beginnerMode = { ...initialUIState.beginnerMode, isActive: false };
             } else {
                 // Preserve the entire beginner mode state (including history) unless explicitly disabled.
                 // This prevents hints from reappearing if the user has already seen them.
                 overrides.beginnerMode = s.beginnerMode;
             }

             if (options?.skipTransition) {
                 // Immediate reset for Tutorial or Game Mode
                 _executeNew(overrides);
                 return;
             }
             
             // Trigger the UI state for the transition (CSS in IntroScreen.tsx)
             set({ isIntroTransitioning: true });

             // Coordinated Data Transition (JS for Nebula Opacity)
             const fadeDuration = 1200; // Duration matches the CSS transition in IntroScreen
             const startOpacity = s.nebulaOpacity;
             const startTime = performance.now();

             const fadeStep = () => {
                 const now = performance.now();
                 const progress = Math.min((now - startTime) / fadeDuration, 1);
                 const easedProgress = 1 - Math.pow(1 - progress, 2); // Ease out
                 const newOpacity = startOpacity * (1 - easedProgress);
                 
                 set({ nebulaOpacity: newOpacity });

                 if (progress < 1) {
                     requestAnimationFrame(fadeStep);
                 } else {
                     // Transition complete. Reset everything.
                     _executeNew(overrides);
                 }
             };
             requestAnimationFrame(fadeStep);
        },
        handleGlobalMouseUp: () => {
            if (get().adjustmentPending) {
                commitToHistory(set, get);
            }
            set({ isMouseDown: false, adjustmentPending: false });
        },
        undo: () => {
            const s = get();
            if (s.history.past.length === 0) return;

            const newPast = s.history.past.slice(0, -1);
            const newPresent = s.history.past[s.history.past.length - 1];
            const newFuture = [s.history.present, ...s.history.future];
            
            const changes: Partial<AppState> = {};
            const historicalState = { ...newPresent.simulationState, ...newPresent.visualsState };

            for (const key in historicalState) {
                const typedKey = key as keyof typeof historicalState;
                if (!shallowEqual(s[typedKey], historicalState[typedKey])) {
                    (changes as Record<string, unknown>)[typedKey] = historicalState[typedKey];
                }
            }

            if (s.documentName !== newPresent.documentName) {
                changes.documentName = newPresent.documentName;
            }

            set({
                ...changes,
                history: {
                    past: newPast,
                    present: newPresent,
                    future: newFuture,
                    isTimeTraveling: true,
                }
            });
            setTimeout(() => set(state => ({ history: { ...state.history, isTimeTraveling: false } })), 0);
        },
        redo: () => {
            const s = get();
            if (s.history.future.length === 0) return;

            const newPast = [...s.history.past, s.history.present];
            const newPresent = s.history.future[0];
            const newFuture = s.history.future.slice(1);

            const changes: Partial<AppState> = {};
            const historicalState = { ...newPresent.simulationState, ...newPresent.visualsState };

            for (const key in historicalState) {
                const typedKey = key as keyof typeof historicalState;
                if (!shallowEqual(s[typedKey], historicalState[typedKey])) {
                    (changes as Record<string, unknown>)[typedKey] = historicalState[typedKey];
                }
            }

            if (s.documentName !== newPresent.documentName) {
                changes.documentName = newPresent.documentName;
            }

            set({
                ...changes,
                history: {
                    past: newPast,
                    present: newPresent,
                    future: newFuture,
                    isTimeTraveling: true,
                }
            });
            setTimeout(() => set(state => ({ history: { ...state.history, isTimeTraveling: false } })), 0);
        },
        resetHistory: () => {
            const s = get();
            const newPresent: TemporalState = {
                simulationState: pluck(s, undoableSimKeys as (keyof UndoableSimulationState)[]),
                visualsState: pluck(s, undoableVisualsKeys),
                documentName: s.documentName,
            };
            set({
                history: { past: [], present: newPresent, future: [], isTimeTraveling: false }
            });
        },
    };
};
