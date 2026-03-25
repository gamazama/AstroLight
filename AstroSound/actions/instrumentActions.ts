import type { StoreSet, StoreGet } from '../../store/appStore';
import type { SoundNode, SoundConnection, Instrument, ActiveInstrumentInstance } from '../types';
import { ALL_NODE_TYPES } from '../components/nodeTypes';
import { NODE_PREFABS } from '../components/nodePrefabs';
import { processExposedInputs } from './utils';

export const createInstrumentActions = (set: StoreSet, get: StoreGet) => ({
    addNodePrefab: (prefabName: string, position: { x: number; y: number }) => {
        const prefab = NODE_PREFABS.find(p => p.name === prefabName);
        if (!prefab) return;

        const now = Date.now();
        const outputNodeIndices = new Set<number>();
        prefab.nodes.forEach((n, i) => { if (n.type === 'Output') outputNodeIndices.add(i); });
        
        const nonOutputNodes = prefab.nodes.filter((_, i) => !outputNodeIndices.has(i));
        const newNodes: SoundNode[] = nonOutputNodes.map((n, i) => {
            const nodeDef = ALL_NODE_TYPES.find(d => d.type === n.type);
            const defaultParams = nodeDef ? Object.fromEntries(nodeDef.parameters.map(p => [p.name, p.defaultValue])) : {};
            return {
                id: `${n.type}_${now + i}`,
                type: n.type,
                position: { x: position.x + n.relPos.x, y: position.y + n.relPos.y },
                params: { ...defaultParams, ...n.params, exposedInputs: [] }
            };
        });

        const oldToNewId = new Map<number, string>();
        let nonOutputNodeIndex = 0;
        prefab.nodes.forEach((_, i) => {
            if (!outputNodeIndices.has(i)) {
                oldToNewId.set(i, newNodes[nonOutputNodeIndex].id);
                nonOutputNodeIndex++;
            }
        });

        const newConns = prefab.connections
            .filter(c => !outputNodeIndices.has(c.from))
            .map((c, i) => {
                const fromId = oldToNewId.get(c.from);
                const toId = outputNodeIndices.has(c.to) ? 'MASTER_OUTPUT' : oldToNewId.get(c.to);
                if (!fromId || !toId) return null;

                const targetNode = newNodes.find(n => n.id === toId);
                if (targetNode) {
                    const nodeDef = ALL_NODE_TYPES.find(d => d.type === targetNode.type);
                    if (nodeDef?.parameters.some(p => p.name === c.toInput && p.modulatable) && !targetNode.params.exposedInputs.includes(c.toInput)) {
                        targetNode.params.exposedInputs.push(c.toInput);
                    }
                }
                return { id: `conn_prefab_${now + i}`, fromNodeId: fromId, fromOutput: c.fromOutput, toNodeId: toId, toInput: c.toInput, pathPoints: [] };
            }).filter((c): c is NonNullable<typeof c> => c !== null) as SoundConnection[];
        
        set(state => ({
            graph: { ...state.graph, nodes: [...state.graph.nodes, ...newNodes], connections: [...state.graph.connections, ...newConns] },
            soundCreator: { ...state.soundCreator, selectedNodeIds: newNodes.map(n => n.id) }
        }));
    },

    openSaveInstrumentModal: () => set({ isSaveInstrumentModalOpen: true, instrumentToSaveInfo: { name: '', description: '' } }),
    closeSaveInstrumentModal: () => set({ isSaveInstrumentModalOpen: false, instrumentToSaveInfo: null }),
    updateInstrumentToSaveInfo: (field: 'name' | 'description', value: string) => set(state => ({ instrumentToSaveInfo: state.instrumentToSaveInfo ? { ...state.instrumentToSaveInfo, [field]: value } : null })),
    
    saveInstrument: () => {
        const s = get();
        const { graph, instrumentToSaveInfo, soundCreator: { selectedNodeIds } } = s;
        if (!instrumentToSaveInfo || !instrumentToSaveInfo.name) {
            set({ notification: '**Instrument name** is required.' });
            return;
        }
        const nodesToScan = selectedNodeIds.length > 0 ? graph.nodes.filter(n => selectedNodeIds.includes(n.id)) : graph.nodes.filter(n => n.id !== 'MASTER_OUTPUT');
        const outConn = graph.connections.find(c => c.toNodeId === 'MASTER_OUTPUT' && nodesToScan.some(n => n.id === c.fromNodeId));
        if (!outConn) {
            set({ notification: selectedNodeIds.length > 0 ? 'Selection must include node connected to Master Output.' : 'Graph must connect to Master Output.' });
            return;
        }
        const finalNodeIds = new Set(nodesToScan.map(n => n.id));
        const finalConnections = graph.connections.filter(c => finalNodeIds.has(c.fromNodeId) && finalNodeIds.has(c.toNodeId));
        const params: Instrument['parameters'] = [], dataSources: Instrument['dataSources'] = [];
        nodesToScan.forEach(n => {
            if (n.type === 'Parameter') params.push({ nodeId: n.id, label: n.params.customName || 'Parameter', min: n.params.min, max: n.params.max, step: n.params.step, defaultValue: n.params.defaultValue });
            else if (n.type === 'DataSource') dataSources.push({ nodeId: n.id, label: n.params.customName || 'Data Source' });
        });
        const newInstrument: Instrument = { name: instrumentToSaveInfo.name, description: instrumentToSaveInfo.description, graph: { nodes: nodesToScan, connections: finalConnections }, parameters: params, dataSources, outputNodeId: outConn.fromNodeId };
        set(state => ({ instruments: [...state.instruments, newInstrument] }));
        set({ notification: `Instrument **${newInstrument.name}** saved!` });
        get().actions.closeSaveInstrumentModal();
    },

    addInstrumentInstance: (instrumentName: string) => {
        const s = get();
        const instrument = s.instruments.find(i => i.name === instrumentName);
        if (!instrument) {
            if (import.meta.env.DEV) console.warn("Instrument not found:", instrumentName);
            return;
        }

        const instanceId = `inst_${Date.now()}`;
        const prefix = `${instanceId}_`;
        const yOffset = 5000 + (s.activeInstrumentInstances.length * 1500);
        const defaultConnectionIndex = s.connections.length > 0 ? 0 : null;

        const newNodes: SoundNode[] = instrument.graph.nodes.map(node => ({
            ...node,
            id: `${prefix}${node.id}`,
            position: { x: node.position.x, y: node.position.y + yOffset },
            params: {
                ...node.params,
                connectionIndex: (node.type === 'DataSource' && node.params.sourceType !== 'planet') ? defaultConnectionIndex : node.params.connectionIndex
            }
        }));

        const newConnections: SoundConnection[] = instrument.graph.connections.map(conn => ({
            ...conn,
            id: `${prefix}${conn.id}`,
            fromNodeId: `${prefix}${conn.fromNodeId}`,
            toNodeId: `${prefix}${conn.toNodeId}`,
            pathPoints: []
        }));

        const instanceGraph = processExposedInputs({ nodes: newNodes, connections: newConnections });

        const outputConnectionId = `conn_${instanceId}_out`;
        const masterConnection: SoundConnection = {
            id: outputConnectionId,
            fromNodeId: `${prefix}${instrument.outputNodeId}`,
            fromOutput: 'out', 
            toNodeId: 'MASTER_OUTPUT',
            toInput: 'in',
            pathPoints: []
        };

        const newInstance: ActiveInstrumentInstance = {
            id: instanceId,
            instrumentName: instrument.name,
            prefix,
            outputConnectionId
        };

        const nextGraph = {
            nodes: [...s.graph.nodes, ...instanceGraph.nodes],
            connections: [...s.graph.connections, ...newConnections, masterConnection]
        };

        set(state => ({ graph: nextGraph, activeInstrumentInstances: [...state.activeInstrumentInstances, newInstance] }));
        get().actions.showNotification(`Added **${instrument.name}**`);
        if (!s.isSoundEnabled) get().actions.toggleSound(true);
    },
    
    removeInstrumentInstance: (instanceId: string) => {
        set(state => ({
            activeInstrumentInstances: state.activeInstrumentInstances.filter(i => i.id !== instanceId),
            graph: {
                nodes: state.graph.nodes.filter(n => !n.id.startsWith(`${instanceId}_`)),
                connections: state.graph.connections.filter(c => !c.id.startsWith(`${instanceId}_`) && c.id !== `conn_${instanceId}_out`)
            }
        }));
        get().actions.showNotification(`Removed instance`);
    },

    updateInstrumentParam: (instanceId: string, paramNodeId: string, value: number) => {
        const instance = get().activeInstrumentInstances.find(i => i.id === instanceId);
        if (instance) get().actions.updateNodeParam(`${instance.prefix}${paramNodeId}`, 'value', value);
    },
    
    updateInstrumentDataSource: (instanceId: string, dataSourceNodeId: string, connectionIndex: number) => {
        const instance = get().activeInstrumentInstances.find(i => i.id === instanceId);
        if (instance) get().actions.updateNodeParam(`${instance.prefix}${dataSourceNodeId}`, 'connectionIndex', connectionIndex === -1 ? null : connectionIndex);
    },
    
    openInstrumentDataModal: (instrument: Instrument) => set({ instrumentDataModalContent: instrument }),
    closeInstrumentDataModal: () => set({ instrumentDataModalContent: null }),
});