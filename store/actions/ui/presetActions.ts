
import type { StoreSet, StoreGet } from '../../appStore';
import type { AppState, Connection } from '../../../types';
import { PRESETS } from '../../../data/presets';
import { STAR_SYSTEMS } from '../../../data/starSystems';
import { INTERPOLATABLE_PRESET_KEYS } from '../../../constants';
import { initialSimulationState, initialVisualsState, initialBackgroundState, initialUIState } from '../../../initialState';
import { initialSoundState } from '../../../AstroSound/soundStore';
import { remapConnections } from '../config';

const fullInitialState = {
    ...initialSimulationState,
    ...initialBackgroundState,
    ...initialVisualsState,
    ...initialUIState,
    ...initialSoundState,
};

// Helper to wrap angles to [-180, 180] range to prevent excessive spinning during transitions
const normalizeAngle = (angle: number) => {
    return ((((angle + 180) % 360) + 360) % 360) - 180;
};

export const createPresetActions = (set: StoreSet, get: StoreGet) => ({
    loadPreset: (presetName: keyof typeof PRESETS) => {
        const s = get();
        if (s.presetTransition?.isActive) {
            set({ notification: 'Preset transition already in progress.' });
            return;
        }
    
        const executeTransition = () => {
            try {
                const preset = PRESETS[presetName];
                
                // --- Coordinate System Check ---
                // X-Axis drift uses a positive rotation multiplier, while Z-Axis/None uses negative.
                // If we are switching between these modes, we must flip the current rotation immediately
                // to prevent a visual "jump" before we start interpolating.
                const currentState = get(); // Get fresh state
                
                const currentIsXDrift = currentState.enableLineZDrift && currentState.lineDriftAxis === 'x';
                const targetIsXDrift = (preset.settings.enableLineZDrift ?? initialVisualsState.enableLineZDrift) && 
                                       (preset.settings.lineDriftAxis ?? initialVisualsState.lineDriftAxis) === 'x';

                if (currentIsXDrift !== targetIsXDrift) {
                    // Flip! We update the store immediately so the renderer draws the next frame correctly
                    // using the NEW axis logic but the SAME visual orientation.
                    const newRotation = -currentState.rotation;
                    
                    // We must also set the axis immediately so the renderer applies the correct multiplier next frame.
                    // If going TO X-Drift, set X. If going FROM X-Drift (to Z or None), set Z.
                    const newAxis = targetIsXDrift ? 'x' : 'z';
                    
                    set({ 
                        rotation: newRotation, 
                        lineDriftAxis: newAxis 
                    });
                }

                // Re-read state after potential flip to ensure fromState is consistent with the new coordinate system
                const startState = get();
    
                const fromState: Partial<AppState> = {};
                INTERPOLATABLE_PRESET_KEYS.forEach(key => {
                    (fromState as Record<string, unknown>)[key] = startState[key as keyof AppState];
                });
                Object.assign(fromState, {
                    currentSystem: startState.currentSystem, // Captured for transition logic
                    showOrbits: startState.showOrbits, showPlanets: startState.showPlanets, showLines: startState.showLines,
                    showLabels: startState.showLabels, showNebula: startState.showNebula, showStars: startState.showStars,
                    showLiveConnections: startState.showLiveConnections, isSparkleMode: startState.isSparkleMode,
                    isMyceliumMode: startState.isMyceliumMode, ambientMotionMode: startState.ambientMotionMode
                });
                
                // Normalize start angles
                if (fromState.rotation !== undefined) fromState.rotation = normalizeAngle(fromState.rotation);
                if (fromState.tilt !== undefined) fromState.tilt = normalizeAngle(fromState.tilt);
    
                const toState: Partial<AppState> = {};
                const presetSettings = preset.settings || {};
                INTERPOLATABLE_PRESET_KEYS.forEach(key => {
                    (toState as Record<string, unknown>)[key] = (presetSettings as Record<string, unknown>)[key] ?? (fullInitialState as Record<string, unknown>)[key];
                });

                // Normalize target angles
                if (toState.rotation !== undefined) toState.rotation = normalizeAngle(toState.rotation);
                if (toState.tilt !== undefined) toState.tilt = normalizeAngle(toState.tilt);

                const systemName = preset.system || 'Sol';
                const system = STAR_SYSTEMS[systemName];
                if (!system) throw new Error(`System "${systemName}" not found.`);
                const newPlanetNodes = system.celestialBodies.map((p, i) => ({ id: i + 1, name: p.name, color: p.color }));
                
                const remappedConnections = remapConnections(preset.connections, preset.planetNodes, newPlanetNodes);
    
                const currentConnections = [...startState.connections];
                const targetConnections = remappedConnections;
                const isSwitchingToDifferentSystem = startState.currentSystem !== systemName;

                let connectionsToUpdate: { from: Connection; to: Connection }[] = [];
                let connectionsToAdd: Connection[] = [];
                let connectionsToRemove: Connection[] = [];

                if (isSwitchingToDifferentSystem) {
                    connectionsToRemove = currentConnections;
                    connectionsToAdd = targetConnections;
                } else {
                    const currentConnMap = new Map<string, Connection>();
                    currentConnections.forEach(c => {
                        const key = `${Math.min(c.from, c.to)}-${Math.max(c.from, c.to)}`;
                        currentConnMap.set(key, c);
                    });

                    const targetConnMap = new Map<string, Connection>();
                    targetConnections.forEach(c => {
                        const key = `${Math.min(c.from, c.to)}-${Math.max(c.from, c.to)}`;
                        targetConnMap.set(key, c);
                    });

                    currentConnMap.forEach((conn, key) => {
                        if (targetConnMap.has(key)) {
                            connectionsToUpdate.push({ from: conn, to: targetConnMap.get(key)! });
                        } else {
                            connectionsToRemove.push(conn);
                        }
                    });

                    targetConnMap.forEach((conn, key) => {
                        if (!currentConnMap.has(key)) {
                            connectionsToAdd.push(conn);
                        }
                    });
                }


                const allConnsToRemove = [...connectionsToRemove, ...connectionsToUpdate.map(c => c.from)];
                const idsToRemove = new Set(allConnsToRemove.map(c => c.id));

                const indicesToRemove: number[] = [];
                startState.connections.forEach((conn, index) => {
                    if (idsToRemove.has(conn.id)) {
                        indicesToRemove.push(index);
                    }
                });

                indicesToRemove.sort((a, b) => b - a).forEach(index => {
                    get().actions.removeConnection(index, { commitHistory: false, notify: false });
                });

                const endConfig = {
                    system: systemName,
                    connections: remappedConnections,
                    planetNodes: newPlanetNodes,
                    planetDataOverrides: preset.settings.planetDataOverrides || {},
                    documentName: presetName,
                    startDate: preset.settings.startDate ? new Date(preset.settings.startDate) : new Date(),
                    endDate: preset.settings.endDate ? new Date(preset.settings.endDate) : null,
                    isPlaying: preset.settings.isPlaying ?? initialSimulationState.isPlaying,
                    useRealisticPhysics: preset.settings.useRealisticPhysics ?? initialSimulationState.useRealisticPhysics,
                    ellipticalOrbits: preset.settings.ellipticalOrbits ?? initialSimulationState.ellipticalOrbits,
                    logarithmicOrbits: preset.settings.logarithmicOrbits ?? initialSimulationState.logarithmicOrbits,
                    orbitalInclination: preset.settings.orbitalInclination ?? initialSimulationState.orbitalInclination,
                    renderMode: preset.settings.renderMode ?? initialVisualsState.renderMode,
                    ambientMotionMode: preset.settings.ambientMotionMode ?? initialVisualsState.ambientMotionMode,
                    lineBlendMode: preset.settings.lineBlendMode ?? initialVisualsState.lineBlendMode,
                    lineDriftAxis: preset.settings.lineDriftAxis ?? initialVisualsState.lineDriftAxis,
                    enableLineZDrift: preset.settings.enableLineZDrift ?? initialVisualsState.enableLineZDrift,
                    isSkyboxEnabled: preset.settings.isSkyboxEnabled ?? initialBackgroundState.isSkyboxEnabled,
                    skyboxImage: preset.settings.skyboxImage ?? initialBackgroundState.skyboxImage,
                    showLiveConnections: preset.settings.showLiveConnections ?? initialVisualsState.showLiveConnections,
                    showOrbits: preset.settings.showOrbits ?? initialVisualsState.showOrbits,
                    showPlanets: preset.settings.showPlanets ?? initialVisualsState.showPlanets,
                    showLines: preset.settings.showLines ?? initialVisualsState.showLines,
                    showLabels: preset.settings.showLabels ?? initialVisualsState.showLabels,
                    isSparkleMode: preset.settings.isSparkleMode ?? initialVisualsState.isSparkleMode,
                    isMyceliumMode: preset.settings.isMyceliumMode ?? initialVisualsState.isMyceliumMode,
                    showUnconnectedLabels: preset.settings.showUnconnectedLabels ?? initialVisualsState.showUnconnectedLabels,
                    showUnconnectedPlanets: preset.settings.showUnconnectedPlanets ?? initialVisualsState.showUnconnectedPlanets,
                    useGradientBackground: preset.settings.useGradientBackground ?? initialBackgroundState.useGradientBackground,
                    showBackgroundColor: preset.settings.showBackgroundColor ?? initialBackgroundState.showBackgroundColor,
                    showNebula: preset.settings.showNebula ?? initialVisualsState.showNebula,
                    showStars: preset.settings.showStars ?? initialBackgroundState.showStars,
                    showStarColors: preset.settings.showStarColors ?? initialBackgroundState.showStarColors,
                    webGLStarsOpposeDrift: preset.settings.webGLStarsOpposeDrift ?? initialBackgroundState.webGLStarsOpposeDrift,
                    lineColorMode: preset.settings.lineColorMode ?? initialVisualsState.lineColorMode,
                    lineGradient: preset.settings.lineGradient ?? initialVisualsState.lineGradient,
                    orbitBlendMode: preset.settings.orbitBlendMode ?? initialVisualsState.orbitBlendMode,
                    debugDoFMode: preset.settings.debugDoFMode ?? initialVisualsState.debugDoFMode,
                };
    
                set({
                    presetTransition: {
                        isActive: true,
                        startTime: performance.now(),
                        duration: 2500,
                        fromState,
                        toState,
                        connectionsToRemove,
                        connectionsToAdd,
                        connectionsToUpdate,
                        endConfig,
                    },
                    isPresetTransitioning: true,
                    notification: `Transitioning to **${presetName}**...`
                });
                
                // Mark beginner feature
                get().actions.markFeatureUsed('presets_opened');
    
            } catch (e) {
                if (import.meta.env.DEV) console.error("Preset transition error:", e);
                set({ notification: `**Error**: ${e instanceof Error ? e.message : 'Unknown error'}` });
            }
        };
    
        if (s.history.past.length > 30) {
            set({
                confirmationDialog: {
                    title: 'Discard Changes?',
                    message: `You have unsaved changes. Are you sure you want to load the '${presetName}' preset? This will start a transition.`,
                    onConfirm: () => {
                        executeTransition();
                        set({ confirmationDialog: null });
                    }
                }
            });
        } else {
            executeTransition();
        }
    },
});
