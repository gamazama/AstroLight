
import type { StoreSet, StoreGet } from '../appStore';
import type { AppState, Connection, TemporalState, SimulationState, VisualsState, Preset, SoundState, PlanetNode } from '../../types';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { PRESETS } from '../../data/presets';
import { initialUIState, initialSimulationState, initialVisualsState, initialBackgroundState, fullInitialVisualsState } from '../../initialState';
import { initialSoundState } from '../../AstroSound/soundStore';
import { APP_URL, APP_VERSION } from '../../constants';
import { clearLastLinePositions } from '../../hooks/renderer/simulationUpdate';
import { keyMap, reverseKeyMap } from '../../data/serializationConfig';

declare const pako: { deflate: (data: string | Uint8Array) => Uint8Array; inflate: (data: Uint8Array, options?: { to?: string }) => string };

/**
 * A helper to remap connection IDs when loading a config for a different star system.
 */
export const remapConnections = (
    connections: Connection[] | undefined,
    configPlanetNodes: { id: number, name: string }[] | undefined,
    newPlanetNodes: PlanetNode[]
): Connection[] => {
    const nameToIdMap = new Map(newPlanetNodes.map(p => [p.name, p.id]));
    const safeConfigPlanetNodes = configPlanetNodes || [];

    return (connections || []).map((conn) => {
        const fromName = safeConfigPlanetNodes.find(p => p.id === conn.from)?.name;
        const toName = safeConfigPlanetNodes.find(p => p.id === conn.to)?.name;
        const fromId = fromName ? nameToIdMap.get(fromName) : undefined;
        const toId = toName ? nameToIdMap.get(toName) : undefined;
        if (fromId === undefined || toId === undefined) return null;
        return { ...conn, from: fromId, to: toId };
    }).filter((c): c is Connection => c !== null);
};


export const createConfigActions = (set: StoreSet, get: StoreGet) => {
    
    const _executeApplyConfig = (config: Preset, name: string) => {
        const devSettingKeys: (keyof AppState)[] = [
            'isSettingsPanelOpen', 'settingsPanelPosition', 'uiBackgroundOpacity', 'uiBlurAmount',
            'isPerformanceMode', 'debugShowOrbitMask', 'maxLines', 'debugDisableLines',
            'debugDisableStars', 'debugDisableParticles', 'minLineAlpha',
            'disableCameraSmoothing', 'debugDoFMode'
        ];
        const currentState = get();
        const devSettingsToPreserve = Object.fromEntries(devSettingKeys.map(key => [key, currentState[key]]));

        const systemName = config.system || 'Sol';
        const system = STAR_SYSTEMS[systemName];
        if (!system) throw new Error(`System "${systemName}" not found.`);

        const newPlanetNodes = system.celestialBodies.map((p, i) => ({ id: i + 1, name: p.name, color: p.color }));
        
        const remappedConnections = remapConnections(config.connections, config.planetNodes, newPlanetNodes);

        const newSettings = { ...(config.settings || {}) };
        if (newSettings.startDate && typeof newSettings.startDate === 'string') newSettings.startDate = new Date(newSettings.startDate);
        if (newSettings.endDate && typeof newSettings.endDate === 'string') newSettings.endDate = new Date(newSettings.endDate);
        if (newSettings.targetFov !== undefined) newSettings.actualFov = newSettings.targetFov;
        if (newSettings.targetZoom !== undefined) newSettings.actualZoom = newSettings.targetZoom;
        
        // --- Migration Logic for Legacy Color Modes ---
        // If loading an old preset that used 'lineColorByDistance' but lacks the new 'lineColorMode'
        if (newSettings.lineColorByDistance === true && !newSettings.lineColorMode) {
            newSettings.lineColorMode = 'distance';
        }
        // If loading an old preset that lacks a 'lineGradient' but has legacy min/max colors
        if (!newSettings.lineGradient && (newSettings.lineColorMinDist || newSettings.lineColorMaxDist)) {
            const startColor = newSettings.lineColorMinDist || '#4ECDC4'; // Default Min
            const endColor = newSettings.lineColorMaxDist || '#C34A36'; // Default Max
            newSettings.lineGradient = [
                { id: 'legacy_1', position: 0, color: startColor, bias: 0.5, interpolation: 'linear' },
                { id: 'legacy_2', position: 1, color: endColor, bias: 0.5, interpolation: 'linear' }
            ];
        }
        // ----------------------------------------------

        // Ensure physics transition values (T-values) match the boolean settings instantly
        const effectiveLogOrbits = newSettings.logarithmicOrbits ?? initialSimulationState.logarithmicOrbits;
        const effectiveElliptical = newSettings.ellipticalOrbits ?? initialSimulationState.ellipticalOrbits;
        const effectiveInclination = newSettings.orbitalInclination ?? initialSimulationState.orbitalInclination;

        const physicsTUpdates = {
            logarithmicOrbitsT: effectiveLogOrbits ? 1 : 0,
            ellipticalOrbitsT: effectiveElliptical ? 1 : 0,
            orbitalInclinationT: effectiveInclination ? 1 : 0,
        };

        const soundStateKeys: (keyof SoundState)[] = ['isSoundEnabled', 'masterVolume', 'graph', 'instruments', 'activeInstrumentInstances', 'isDroneEnabled', 'isLineSoundEnabled', 'isFilterEnabled', 'filterCutoff', 'filterResonance', 'isDelayEnabled', 'delayTime', 'delayFeedback', 'soundNodeOutputs', 'clippingOutputs'];
        for (const key of soundStateKeys) {
            delete (newSettings as Partial<SoundState>)[key];
        }
        
        const shouldKeepPresetsOpen = get().openTopMenuDropdown === 'presets';
        
        clearLastLinePositions(); // Clear stale simulation state

        set({
            ...initialSimulationState, ...initialBackgroundState, ...initialVisualsState, ...initialUIState, ...initialSoundState,
            ...newSettings,
            ...physicsTUpdates,
            // Override Beginner Mode: loading a scene implies an advanced user or a specific state
            beginnerMode: { ...initialUIState.beginnerMode, isActive: false },
            currentSystem: systemName,
            planetNodes: newPlanetNodes,
            planetsToRender: newPlanetNodes, 
            connections: remappedConnections,
            documentName: newSettings.documentName || name, 
            showIntroScreen: false, time: 0, lineHistory: [], particles: [], hasSystemBeenChanged: systemName !== currentState.currentSystem, 
            infoPanelPlanetId: null, isFullscreen: currentState.isFullscreen, openTopMenuDropdown: shouldKeepPresetsOpen ? 'presets' : null,
            ...devSettingsToPreserve,
        });

        get().actions.resetHistory();
    };

    return {
        loadPresetStatically: (presetName: keyof typeof PRESETS) => {
            const preset = PRESETS[presetName];
            if (!preset) {
                set({ notification: `**Error**: Preset '${presetName}' not found.` });
                return;
            }
            try {
                _executeApplyConfig(preset, presetName);
                set({ notification: `**Preset '${presetName}' loaded**.` });
            } catch (e) {
                if (import.meta.env.DEV) console.error("Static preset load error:", e);
                set({ notification: `**Error**: ${e instanceof Error ? e.message : 'Unknown error'}` });
            }
        },
        importConfig: (file: File) => {
            const s = get();
            const execute = () => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const fileContent = e.target?.result as string;
                        if (!fileContent) throw new Error("File is empty.");

                        if (!file.name.toLowerCase().endsWith('.ass')) {
                            throw new Error("Unsupported file type. Please select an AstroLight™ Shareable Save (.ass) file.");
                        }
        
                        const assignmentIndex = fileContent.indexOf('=');
                        if (assignmentIndex === -1) {
                            throw new Error("Invalid .ass file format: Missing assignment operator '='.");
                        }

                        const objectStart = fileContent.indexOf('{', assignmentIndex);
                        const objectEnd = fileContent.lastIndexOf('}');
        
                        if (objectStart === -1 || objectEnd === -1 || objectEnd < objectStart) {
                            throw new Error("Invalid .ass file format: Could not find preset object braces.");
                        }
                        
                        const jsonString = fileContent.substring(objectStart, objectEnd + 1);
                        const config = JSON.parse(jsonString);
        
                        if (!config || typeof config.system !== 'string' || !config.settings) {
                            throw new Error("Invalid .ass file format: Parsed object is invalid.");
                        }
                        
                        const filename = file.name.replace(/\.ass$/i, "");
                        _executeApplyConfig(config, filename);
                        set({ notification: `**Preset '${filename}' imported** successfully.` });

                    } catch (err) {
                        if (import.meta.env.DEV) console.error("Import error:", err);
                        if (err instanceof SyntaxError && err.message.includes('JSON.parse')) {
                            set({ notification: `**Error**: Failed to parse .ass file. Please ensure it's a valid AstroLight™ save file.` });
                        } else {
                            set({ notification: `**Error**: ${err instanceof Error ? err.message : 'Unknown error'}` });
                        }
                    }
                };
                reader.readAsText(file);
            };

             if (s.history.past.length > 30) {
                set({
                    confirmationDialog: {
                        title: 'Discard Changes?',
                        message: `You have unsaved changes. Are you sure you want to import '${file.name}'?`,
                        onConfirm: () => {
                            execute();
                            set({ confirmationDialog: null });
                        }
                    }
                });
            } else {
                execute();
            }
        },
        loadFromUrl: (configData: string) => {
            try {
                let base64 = configData.replace(/-/g, '+').replace(/_/g, '/');
                base64 += '=='.slice(0, (4 - base64.length % 4) % 4);
                const compressed = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
                const jsonString = pako.inflate(compressed, { to: 'string' });
                const config = JSON.parse(jsonString);

                if (config.settings) {
                    _executeApplyConfig(config, 'Shared Creation');
                } else if (config.ms) {
                    const deminifiedSettings: Partial<AppState> = {};
                    const reverseMap = reverseKeyMap as Record<string, string>;
                    const ms = config.ms as Record<string, unknown>;
                    for (const shortKey of Object.keys(ms)) {
                        const longKey = reverseMap[shortKey];
                        if (longKey) {
                            (deminifiedSettings as Record<string, unknown>)[longKey] = ms[shortKey];
                        }
                    }
                    const fullConfig: Preset = {
                        system: config.s,
                        planetNodes: config.p,
                        connections: config.c,
                        settings: deminifiedSettings,
                    };
                    _executeApplyConfig(fullConfig, 'Shared Creation');
                } else {
                     throw new Error("Invalid share data format.");
                }
                
                if (!get().isFullscreen) {
                    get().actions.toggleFullscreen();
                }
                
                set({ notification: `**Shared Creation** loaded!` });
                const url = new URL(window.location.href);
                url.searchParams.delete('cconfig');
                url.searchParams.delete('config');
                window.history.replaceState({}, document.title, url.toString());
            } catch (e) {
                if (import.meta.env.DEV) console.error("Share link error:", e);
                set({ notification: '**Error**: Invalid share link.' });
            }
        },
    };
};
