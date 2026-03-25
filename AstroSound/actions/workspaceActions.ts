import type { StoreSet, StoreGet } from '../../store/appStore';
import type { SoundNode, SoundConnection } from '../types';
import { processExposedInputs } from './utils';

export const createWorkspaceActions = (set: StoreSet, get: StoreGet) => ({
    panAndZoomCanvas: ({ dx, dy, dZoom, mouseX, mouseY }: { dx: number, dy: number, dZoom: number, mouseX?: number, mouseY?: number }) => {
        set(state => {
            const { transform } = state.soundCreator;
            const newTransform = { x: transform.x + dx, y: transform.y + dy, k: transform.k };
            if (dZoom) {
                const newK = Math.max(0.2, Math.min(3, transform.k * (1 + dZoom)));
                if (mouseX !== undefined && mouseY !== undefined) {
                    newTransform.x = mouseX - (mouseX - transform.x) * (newK / transform.k);
                    newTransform.y = mouseY - (mouseY - transform.y) * (newK / transform.k);
                }
                newTransform.k = newK;
            }
            return { soundCreator: { ...state.soundCreator, transform: newTransform } };
        });
    },

    selectNode: (id: string | null, additive: boolean) => {
        set(state => {
            const current = state.soundCreator.selectedNodeIds;
            const newSelection = id === null ? [] : additive ? (current.includes(id) ? current.filter(i => i !== id) : [...current, id]) : [id];
            return { soundCreator: { ...state.soundCreator, selectedNodeIds: newSelection } };
        });
    },
    
    selectNodes: (ids: string[], additive: boolean) => set(state => ({ soundCreator: { ...state.soundCreator, selectedNodeIds: additive ? [...new Set([...state.soundCreator.selectedNodeIds, ...ids])] : ids } })),
    
    clearNodeSelection: () => set(state => ({ soundCreator: { ...state.soundCreator, selectedNodeIds: [] } })),

    handleDuplicateSelection: (delta: { dx: number, dy: number }, initialPositions?: Map<string, { x: number; y: number }>) => {
        const showNotification = get().actions.showNotification;
        const state = get();
        const { graph, soundCreator } = state;
        const { selectedNodeIds, transform } = soundCreator;

        if (selectedNodeIds.length === 0 || !initialPositions) {
            set({ duplicationPreviewNodes: null });
            return;
        }

        const nodesToDuplicate = graph.nodes.filter(n => selectedNodeIds.includes(n.id));
        const now = Date.now();
        const oldToNewIdMap = new Map<string, string>();
        
        const newNodes: SoundNode[] = nodesToDuplicate.map((node, i) => {
            const newNodeId = `${node.type}_${now + i}`;
            oldToNewIdMap.set(node.id, newNodeId);
            const basePosition = initialPositions.get(node.id);
            if (!basePosition) return null;

            return {
                ...node,
                id: newNodeId,
                position: {
                    x: basePosition.x + delta.dx / transform.k,
                    y: basePosition.y + delta.dy / transform.k,
                },
            };
        }).filter((n): n is SoundNode => n !== null);

        if (newNodes.length === 0) {
            set({ duplicationPreviewNodes: null });
            return;
        }

        // Duplicate internal connections
        const internalConnections = graph.connections.filter(c => selectedNodeIds.includes(c.fromNodeId) && selectedNodeIds.includes(c.toNodeId));
        const newInternalConnections = internalConnections.map((conn, i) => {
            const newFromId = oldToNewIdMap.get(conn.fromNodeId);
            const newToId = oldToNewIdMap.get(conn.toNodeId);
            if (!newFromId || !newToId) return null;
            return { ...conn, id: `conn_dup_int_${now + i}`, fromNodeId: newFromId, toNodeId: newToId };
        }).filter((c): c is SoundConnection => c !== null);
        
        // Duplicate outgoing connections to master output
        const outgoingConnectionsToMaster = graph.connections.filter(c => selectedNodeIds.includes(c.fromNodeId) && c.toNodeId === 'MASTER_OUTPUT');
        const newOutgoingConnections = outgoingConnectionsToMaster.map((conn, i) => {
            const newFromId = oldToNewIdMap.get(conn.fromNodeId);
            return newFromId ? { ...conn, id: `conn_dup_out_${now + i}`, fromNodeId: newFromId } : null;
        }).filter((c): c is SoundConnection => c !== null);

        const newConnections = [...newInternalConnections, ...newOutgoingConnections];

        showNotification(`Duplicated **${newNodes.length}** nodes.`);
        set({
            graph: { nodes: [...graph.nodes, ...newNodes], connections: [...graph.connections, ...newConnections] },
            soundCreator: { ...soundCreator, selectedNodeIds: newNodes.map(n => n.id) },
            duplicationPreviewNodes: null,
        });
    },

    groupSelectionInScaffold: () => {}, // Placeholder

    newSoundGraph: () => {
        const basicGraph = processExposedInputs({
             nodes: [{ id: 'MASTER_OUTPUT', type: 'Output', position: { x: 2000, y: 75 }, params: { customName: '', displayColor: '#4a5568', isBypassed: false, exposedInputs: [] } }],
             connections: []
        });
        set({ graph: basicGraph, soundCreator: { ...get().soundCreator, selectedNodeIds: [] } });
        get().actions.showNotification("Sound Graph Reset");
    },

    exportSoundGraph: () => {
        const { graph } = get();
        const json = JSON.stringify(graph, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AstroSound_Graph_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        get().actions.showNotification("Sound Graph Exported");
    },

    importSoundGraph: (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const graph = JSON.parse(json);
                if (!graph.nodes || !graph.connections) throw new Error("Invalid graph format");
                const processedGraph = processExposedInputs(graph);
                set({ graph: processedGraph });
                get().actions.showNotification("Sound Graph Loaded");
            } catch (err) {
                if (import.meta.env.DEV) console.error(err);
                get().actions.showNotification("Error loading graph");
            }
        };
        reader.readAsText(file);
    },

    addNodesAndConnections: (payload: { nodes: SoundNode[], connections: SoundConnection[] }) => set(state => ({
        graph: { nodes: [...state.graph.nodes, ...payload.nodes], connections: [...state.graph.connections, ...payload.connections] },
        soundCreator: { ...state.soundCreator, selectedNodeIds: payload.nodes.map(n => n.id) }
    })),
});