
import React from 'react';
import type { StoreSet, StoreGet } from '../appStore';
import type { AppState, CelestialBodyData, Line } from '../../types';
import type { Connection } from '../../types/simulation';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { calculateHarmonicMultiplier } from '../../utils/celestialCalculations';
import { LINE_FADE_SECONDS } from '../../constants';

/**
 * Creates a new lineHistory array where lines associated with the given
 * connection IDs are marked as "dying" to begin their fade-out animation.
 * @param state The current application state.
 * @param connectionIdsToRemove A Set of connection IDs to mark for removal.
 * @returns A new lineHistory array.
 */
export const createDyingLinesForConnections = (state: AppState, connectionIdsToRemove: Set<number>): Line[] => {
    const { time, lineHistory, lineOpacityMultiplier } = state;
    return lineHistory.map(line => {
        if (connectionIdsToRemove.has(line.connectionId) && !line.isDying) {
            const age = time - line.time;
            const persistence = line.persistence > 0 ? line.persistence : 1;
            const currentOpacity = lineOpacityMultiplier * (1 - age / persistence);
            return { 
                ...line, 
                isDying: true, 
                timeToLive: LINE_FADE_SECONDS,
                startFadeOpacity: currentOpacity 
            };
        }
        return line;
    });
};


export const createConnectionActions = (set: StoreSet, get: StoreGet) => {
    
    const getCelestialBody = (name: string): CelestialBodyData | undefined => {
        const state = get();
        const systemData = STAR_SYSTEMS[state.currentSystem];
        const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
        if (!basePlanetData) return undefined;
        return { ...basePlanetData, ...state.planetDataOverrides[name] };
    };

    const createConnection = (fromId: number, toId: number) => {
        if (fromId === toId) return;
        const s = get();

        if (s.connections.some(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId))) {
            set({ notification: '**Connection** already exists.' });
            set({ connectingNodeId: null, canvasConnectingFromNodeId: null, planetConnectionDragInfo: null });
            return;
        }

        const fromNode = s.planetNodes.find(n => n.id === fromId);
        const toNode = s.planetNodes.find(n => n.id === toId);
        if (!fromNode || !toNode) return;

        const fromPlanet = getCelestialBody(fromNode.name);
        const toPlanet = getCelestialBody(toNode.name);
        if (!fromPlanet || !toPlanet) return;

        // --- Color Selection Logic ---
        // Gather available colors from both planets. Use default color if specific palette is missing.
        const fromColors = fromPlanet.connectionColors || [fromPlanet.color, fromPlanet.color, fromPlanet.color];
        const toColors = toPlanet.connectionColors || [toPlanet.color, toPlanet.color, toPlanet.color];
        
        // Combine pools (6 colors total if palettes exist)
        const colorPool = [...fromColors, ...toColors];
        
        // Pick a random color from the combined pool
        const randomColor = colorPool[Math.floor(Math.random() * colorPool.length)];

        const newConnection: Connection = {
            id: Date.now() + Math.random(),
            from: fromId,
            to: toId,
            color: randomColor,
            // Use a conservative limit (e.g., 50) for default connections to prevent 
            // visual clutter from massive orbital ratios (like Pluto <-> Mars).
            persistenceMultiplier: calculateHarmonicMultiplier(fromPlanet.period, toPlanet.period, 50),
        };

        set({ notification: `**Connection created**: ${fromNode.name} ↔ ${toNode.name}` });
        set(state => ({
            connections: [...state.connections, newConnection],
            connectingNodeId: null,
            canvasConnectingFromNodeId: null,
            planetConnectionDragInfo: null,
            tutorialConnectionId: state.tutorialStep === 5 ? newConnection.id : state.tutorialConnectionId,
        }));
        get().actions.adjustParameter({}); // Commit change to history
    };

    return {
        handleNodeClick: (nodeId: number, e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            const fromNodeId = get().connectingNodeId;
            if (fromNodeId === null) {
                set({ connectingNodeId: nodeId });
            } else {
                if (fromNodeId === nodeId) {
                    set({ connectingNodeId: null });
                } else {
                    get().actions.createUiConnection(fromNodeId, nodeId);
                }
            }
        },
        removeConnection: (index: number, options?: { commitHistory?: boolean; notify?: boolean }) => {
            const { commitHistory = true, notify = true } = options || {};

            const s = get();
            const connToRemove = s.connections[index];
            if (!connToRemove) return;

            if (notify) {
                const fromNode = s.planetNodes.find(n => n.id === connToRemove.from);
                const toNode = s.planetNodes.find(n => n.id === connToRemove.to);
                if (fromNode && toNode) set({ notification: `Connection **removed**: ${fromNode.name} ↔ ${toNode.name}` });
            }
            
            set(state => ({
                connections: state.connections.filter((_, i) => i !== index),
                lineHistory: createDyingLinesForConnections(state, new Set([connToRemove.id])),
            }));

            if (commitHistory) {
                get().actions.adjustParameter({});
            }
        },
        clearConnections: () => {
            const s = get();
            if (s.connections.length === 0) {
                set({ notification: 'No connections to **clear**.' });
                return;
            }
            
            set(state => {
                // FIX: Explicitly type the Set constructor to resolve a TypeScript inference issue.
                const connectionIds = new Set<number>(state.connections.map((c: Connection) => c.id));
                return {
                    notification: 'All connections **cleared**.',
                    connections: [],
                    lineHistory: createDyingLinesForConnections(state, connectionIds),
                };
            });
            get().actions.adjustParameter({}); // Commit change to history
        },
        updateConnectionPersistence: (index: number, multiplier: number) => {
            const s = get();
            const newConnections = s.connections.map((c, i) => i === index ? { ...c, persistenceMultiplier: multiplier } : c);
            get().actions.adjustParameter({ connections: newConnections });
        },
        resetConnectionToHarmonic: (index: number) => {
            const s = get();
            const conn = s.connections[index];
            if (!conn) return;

            const fromPlanet = getCelestialBody(s.planetNodes.find(n => n.id === conn.from)!.name);
            const toPlanet = getCelestialBody(s.planetNodes.find(n => n.id === conn.to)!.name);
            if (!fromPlanet || !toPlanet) return;

            // Allow uncapped multipliers when explicitly using the Wand
            const harmonicMultiplier = calculateHarmonicMultiplier(fromPlanet.period, toPlanet.period, Infinity);
            const newConnections = s.connections.map((c, i) => i === index ? { ...c, persistenceMultiplier: harmonicMultiplier } : c);
            get().actions.adjustParameter({ connections: newConnections });
            set({ notification: `Persistence reset to **harmonic value** (${harmonicMultiplier}x)` });
        },
        clearConnectionLine: () => set({ connectionLine: null }),
        createCanvasConnection: (fromId: number, toId: number) => createConnection(fromId, toId),
        createUiConnection: (fromId: number, toId: number) => createConnection(fromId, toId),
    };
};
