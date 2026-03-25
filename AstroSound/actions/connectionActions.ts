import type { StoreSet, StoreGet } from '../../store/appStore';
import type { SoundNode, SoundConnection } from '../types';
import { ALL_NODE_TYPES } from '../components/nodeTypes';

export const createConnectionActions = (set: StoreSet, get: StoreGet) => ({
    startConnection: (fromNodeId: string, fromOutput: string) => set(state => ({ soundCreator: { ...state.soundCreator, drawingConnection: { type: 'forward', fromNodeId, fromOutput } } })),
    
    startBackwardConnection: (toNodeId: string, toInput: string) => set(state => ({ soundCreator: { ...state.soundCreator, drawingConnection: { type: 'backward', toNodeId, toInput } } })),
    
    moveConnection: (pos: { x: number, y: number }) => set(state => {
        if (!state.soundCreator.drawingConnection) return state;
        if (state.soundCreator.drawingConnection.type === 'forward') {
            return { soundCreator: { ...state.soundCreator, drawingConnection: { ...state.soundCreator.drawingConnection, to: pos } } };
        } else { // backward
            return { soundCreator: { ...state.soundCreator, drawingConnection: { ...state.soundCreator.drawingConnection, from: pos } } };
        }
    }),

    endConnection: (endTarget: { toNodeId: string; toInput: string } | { fromNodeId: string; fromOutput: string } | null) => {
        set(state => {
            const { soundCreator, graph } = state;
            const drawingInfo = soundCreator.drawingConnection;
            const nextSoundCreatorState = { ...soundCreator, drawingConnection: null };
    
            if (!endTarget || !drawingInfo) return { soundCreator: nextSoundCreatorState };
    
            let fromNodeId, fromOutput, toNodeId, toInput;
    
            if (drawingInfo.type === 'forward') {
                if (!('toNodeId' in endTarget)) return { soundCreator: nextSoundCreatorState };
                fromNodeId = drawingInfo.fromNodeId; fromOutput = drawingInfo.fromOutput;
                toNodeId = endTarget.toNodeId; toInput = endTarget.toInput;
            } else { // backward
                if (!('fromNodeId' in endTarget)) return { soundCreator: nextSoundCreatorState };
                fromNodeId = endTarget.fromNodeId; fromOutput = endTarget.fromOutput;
                toNodeId = drawingInfo.toNodeId; toInput = drawingInfo.toInput;
            }
    
            if (fromNodeId === toNodeId) return { soundCreator: nextSoundCreatorState };
    
            const fromNode = graph.nodes.find(n => n.id === fromNodeId);
            const toNode = graph.nodes.find(n => n.id === toNodeId);
            if (!fromNode || !toNode) return { soundCreator: nextSoundCreatorState };
    
            const fromNodeDef = ALL_NODE_TYPES.find(d => d.type === fromNode.type);
            const toNodeDef = ALL_NODE_TYPES.find(d => d.type === toNode.type);
            if (!fromNodeDef || !toNodeDef) return { soundCreator: nextSoundCreatorState };
    
            const fromPortDef = (fromNode.type === 'DataSource' || fromNode.type === 'Interaction') 
                ? { name: fromOutput, type: 'value' as const, label: '' } 
                : fromNodeDef.outputs.find(o => o.name === fromOutput);
                
            const toPortDef = toNodeDef.inputs.find(i => i.name === toInput) || (toNodeDef.parameters.some(p => p.name === toInput && p.modulatable) ? { name: toInput, type: 'value', label: '' } : null);
    
            if (!fromPortDef || !toPortDef || fromPortDef.type !== toPortDef.type) {
                return { soundCreator: nextSoundCreatorState, notification: `**Incompatible**: Cannot connect ports.` };
            }
    
            const newConnection: SoundConnection = { id: `conn_${Date.now()}`, fromNodeId, fromOutput, toNodeId, toInput, pathPoints: [] };
            const isMultiInputPort = (toNode.type === 'Mixer') || (toNode.type === 'Output' && toInput === 'in');
    
            const finalConnections = isMultiInputPort
                ? [...graph.connections, newConnection]
                : [...graph.connections.filter(c => !(c.toNodeId === toNodeId && c.toInput === toInput)), newConnection];
    
            const isParamInput = toNodeDef.parameters.some(p => p.name === toInput && p.modulatable);
            const finalNodes = !isParamInput ? graph.nodes : graph.nodes.map(n => {
                if (n.id === toNodeId) {
                    const exposed = new Set(n.params.exposedInputs || []);
                    exposed.add(toInput);
                    return { ...n, params: { ...n.params, exposedInputs: Array.from(exposed) } };
                }
                return n;
            });
    
            return {
                soundCreator: nextSoundCreatorState,
                graph: { nodes: finalNodes, connections: finalConnections },
            };
        });
    },

    reconnectFromInput: (toNodeId: string, toInput: string) => {
        set(state => {
            const existing = state.graph.connections.find(c => c.toNodeId === toNodeId && c.toInput === toInput);
            if (!existing) return state;
            return {
                graph: { ...state.graph, connections: state.graph.connections.filter(c => c.id !== existing.id) },
                soundCreator: { ...state.soundCreator, drawingConnection: { type: 'forward', fromNodeId: existing.fromNodeId, fromOutput: existing.fromOutput } }
            };
        });
    },

    startRewireFromInputEnd: (connectionId: string) => {
        set(state => {
            const connection = state.graph.connections.find(c => c.id === connectionId);
            if (!connection) return state;
            return {
                graph: { ...state.graph, connections: state.graph.connections.filter(c => c.id !== connectionId) },
                soundCreator: { ...state.soundCreator, drawingConnection: { type: 'forward', fromNodeId: connection.fromNodeId, fromOutput: connection.fromOutput } }
            };
        });
    },

    startRewireFromOutputEnd: (connectionId: string) => {
        set(state => {
            const connection = state.graph.connections.find(c => c.id === connectionId);
            if (!connection) return state;
            return {
                graph: { ...state.graph, connections: state.graph.connections.filter(c => c.id !== connectionId) },
                soundCreator: { ...state.soundCreator, drawingConnection: { type: 'backward', toNodeId: connection.toNodeId, toInput: connection.toInput } }
            };
        });
    },
    
    deleteConnection: (id: string) => set(state => ({ graph: { ...state.graph, connections: state.graph.connections.filter(c => c.id !== id) } })),

    createRerouterNode: (connectionId: string, position: { x: number; y: number }) => {
        set(state => {
            const { graph } = state;
            const originalConnection = graph.connections.find(c => c.id === connectionId);
            if (!originalConnection) return state;
            const fromNode = graph.nodes.find(n => n.id === originalConnection.fromNodeId);
            if (!fromNode) return state;

            const fromNodeDef = ALL_NODE_TYPES.find(d => d.type === fromNode.type);
            let portType: 'audio' | 'value' = 'value'; 

            if (fromNodeDef) {
                if (fromNode.type === 'DataSource' || fromNode.type === 'Interaction') {
                    portType = 'value';
                } else {
                    const fromPortDef = fromNodeDef.outputs.find(o => o.name === originalConnection.fromOutput);
                    if (fromPortDef) portType = fromPortDef.type;
                }
            }

            const rerouterType = portType === 'audio' ? 'Audio Rerouter' : 'Value Rerouter';
            const nodeDef = ALL_NODE_TYPES.find(n => n.type === rerouterType);
            const defaultParams = nodeDef ? Object.fromEntries(nodeDef.parameters.map(p => [p.name, p.defaultValue])) : {};
            
            const rerouterNode: SoundNode = {
                id: `${rerouterType.replace(' ', '_')}_${Date.now()}`,
                type: rerouterType,
                position,
                params: { ...defaultParams, exposedInputs: [] }
            };
    
            const conn1: SoundConnection = { id: `conn_reroute_1_${Date.now()}`, fromNodeId: originalConnection.fromNodeId, fromOutput: originalConnection.fromOutput, toNodeId: rerouterNode.id, toInput: 'in', pathPoints: [] };
            const conn2: SoundConnection = { id: `conn_reroute_2_${Date.now()}`, fromNodeId: rerouterNode.id, fromOutput: 'out', toNodeId: originalConnection.toNodeId, toInput: originalConnection.toInput, pathPoints: [] };
            
            const nextConnections = graph.connections.filter(c => c.id !== connectionId);
            nextConnections.push(conn1, conn2);
            const nextNodes = [...graph.nodes, rerouterNode];
    
            return { graph: { nodes: nextNodes, connections: nextConnections } };
        });
    },
});