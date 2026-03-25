import { ALL_NODE_TYPES } from '../components/nodeTypes';
import type { SoundGraph } from '../types';

export const get_default_params = (type: string) => {
    const nodeDef = ALL_NODE_TYPES.find(n => n.type === type);
    if (!nodeDef) return { exposedInputs: [] };
    return { 
        ...Object.fromEntries(nodeDef.parameters.map(p => [p.name, p.defaultValue])),
        exposedInputs: [],
    };
}

export const processExposedInputs = (graph: SoundGraph): SoundGraph => {
    const nodeDefs = new Map(ALL_NODE_TYPES.map(n => [n.type, n]));
    const nodes = graph.nodes.map(node => {
        const nodeDef = nodeDefs.get(node.type);
        if (!nodeDef) return node;

        const incomingConnections = graph.connections.filter(c => c.toNodeId === node.id);
        const exposedInputsFromConnections = new Set(node.params.exposedInputs || []);

        for (const conn of incomingConnections) {
            const isParamInput = nodeDef.parameters.some(p => p.name === conn.toInput && p.modulatable);
            if (isParamInput) {
                exposedInputsFromConnections.add(conn.toInput);
            }
        }
        
        return {
            ...node,
            params: {
                ...node.params,
                exposedInputs: Array.from(exposedInputsFromConnections),
            },
        };
    });

    return { ...graph, nodes };
};