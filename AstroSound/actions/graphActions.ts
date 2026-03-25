import type { StoreSet, StoreGet } from '../../store/appStore';
import type { SoundNode } from '../types';
import { ALL_NODE_TYPES } from '../components/nodeTypes';

export const createGraphActions = (set: StoreSet, get: StoreGet) => ({
    toggleSound: (enabled?: boolean) => {
        get().actions.markFeatureUsed('sound_toggled');
        set(state => ({ isSoundEnabled: enabled === undefined ? !state.isSoundEnabled : enabled }));
    },
    setSoundUiUpdateRate: (rate: number) => set({ soundUiUpdateRate: rate }),
    
    addNode: (type: string, position: { x: number; y: number }) => {
        const nodeDef = ALL_NODE_TYPES.find(n => n.type === type);
        if (!nodeDef) return;
        const defaultParams = Object.fromEntries(nodeDef.parameters.map(p => [p.name, p.defaultValue]));
        const newNode: SoundNode = {
            id: `${type}_${Date.now()}`,
            type,
            position,
            params: { ...defaultParams, exposedInputs: [] }
        };

        // Set sensible default exposed inputs for new nodes
        switch (newNode.type) {
            case 'Math': newNode.params.exposedInputs = ['val1', 'val2']; break;
            case 'Oscillator': case 'LFO': newNode.params.exposedInputs = ['frequency']; break;
            case 'Cross-Oscillator': newNode.params.exposedInputs = ['frequency', 'unisonSpread', 'fmAmount']; break;
            case 'Waveshaper': newNode.params.exposedInputs = ['drive']; break;
            case 'Cosmic Octaver': newNode.params.exposedInputs = ['value']; break;
            case 'Filter': newNode.params.exposedInputs = ['cutoff']; break;
            case 'Gain': newNode.params.exposedInputs = ['gain']; break;
            case 'Pan': newNode.params.exposedInputs = ['pan']; break;
            case 'Delay': newNode.params.exposedInputs = ['time']; break;
            case 'Reverb': newNode.params.exposedInputs = ['mix']; break;
        }

        if (newNode.type === 'DataSource' && get().connections.length > 0) {
            newNode.params.connectionIndex = 0;
        }
        set(state => ({ graph: { ...state.graph, nodes: [...state.graph.nodes, newNode] } }));
    },

    deleteNodes: (nodeIds: string[]) => {
        const idsToDelete = new Set(nodeIds.filter(id => id !== 'MASTER_OUTPUT'));
        if (idsToDelete.size === 0) return;
        set(state => ({
            graph: {
                nodes: state.graph.nodes.filter(n => !idsToDelete.has(n.id)),
                connections: state.graph.connections.filter(c => !idsToDelete.has(c.fromNodeId) && !idsToDelete.has(c.toNodeId))
            },
            soundCreator: { ...state.soundCreator, selectedNodeIds: [] }
        }));
    },

    updateNodeParam: (nodeId: string, paramName: string, value: any) => {
        set(state => ({
            graph: {
                ...state.graph,
                nodes: state.graph.nodes.map(n => n.id === nodeId ? { ...n, params: { ...n.params, [paramName]: value } } : n)
            }
        }));
        
        // Side effect for group bypassing via Scaffold
        const node = get().graph.nodes.find(n => n.id === nodeId);
        if (node && node.type === 'Scaffold' && paramName === 'isBypassed') {
            const { graph } = get();
            const scaffold = node;
            const scaffoldBounds = {
                left: scaffold.position.x, top: scaffold.position.y,
                right: scaffold.position.x + scaffold.params.width, bottom: scaffold.position.y + scaffold.params.height
            };
    
            const nodesToUpdate: { nodeId: string, paramName: string, value: any }[] = [];
    
            graph.nodes.forEach(n => {
                if (n.type === 'Scaffold' || n.id === scaffold.id) return;
                
                const nodeDef = ALL_NODE_TYPES.find(d => d.type === n.type);
                const width = nodeDef?.width ?? 208;
                const height = document.getElementById(`sound-node-${n.id}`)?.offsetHeight ?? 100;
                const nodeBounds = {
                    left: n.position.x, top: n.position.y,
                    right: n.position.x + width, bottom: n.position.y + height
                };
    
                const isInside = nodeBounds.left >= scaffoldBounds.left && nodeBounds.right <= scaffoldBounds.right &&
                                 nodeBounds.top >= scaffoldBounds.top && nodeBounds.bottom <= scaffoldBounds.bottom;
                
                if (isInside) {
                    nodesToUpdate.push({ nodeId: n.id, paramName: 'isBypassed', value });
                }
            });
            
            if (nodesToUpdate.length > 0) {
                set(state => ({
                    graph: {
                        ...state.graph,
                        nodes: state.graph.nodes.map(n => {
                            const update = nodesToUpdate.find(u => u.nodeId === n.id);
                            return update ? { ...n, params: { ...n.params, [update.paramName]: update.value } } : n;
                        })
                    }
                }));
            }
        }
    },

    updateNodePosition: (id: string, pos: { x: number, y: number }) => set(state => ({ graph: { ...state.graph, nodes: state.graph.nodes.map(n => n.id === id ? { ...n, position: pos } : n) } })),
    
    updateNodePositions: (positions: { nodeId: string, position: { x: number; y: number; } }[]) => {
        const posMap = new Map(positions.map(p => [p.nodeId, p.position]));
        set(state => ({
            graph: {
                ...state.graph,
                nodes: state.graph.nodes.map(n => posMap.has(n.id) ? { ...n, position: posMap.get(n.id)! } : n)
            }
        }));
    },

    updateNodeGeometry: (nodeId: string, geometry: { x: number; y: number; width: number; height: number; }) => {
        set(state => ({
            graph: {
                ...state.graph,
                nodes: state.graph.nodes.map(n => n.id === nodeId ? {
                    ...n,
                    position: { x: geometry.x, y: geometry.y },
                    params: { ...n.params, width: geometry.width, height: geometry.height }
                } : n)
            }
        }));
    },

    toggleNodeInput: (nodeId: string, paramName: string) => {
        const s = get();
        const node = s.graph.nodes.find(n => n.id === nodeId);
        if (!node) return;
        const exposed = node.params.exposedInputs || [];
        let newExposed;
        if (exposed.includes(paramName)) {
            if (s.graph.connections.some(c => c.toNodeId === nodeId && c.toInput === paramName)) {
                set({ notification: '**Cannot hide** a connected input.' });
                return;
            }
            newExposed = exposed.filter(p => p !== paramName);
        } else {
            newExposed = [...exposed, paramName];
        }
        get().actions.updateNodeParam(nodeId, 'exposedInputs', newExposed);
    },

    checkScaffoldIntersections: (movedNodeIds: Set<string>) => {
        set(state => {
            let newGraphNodes = [...state.graph.nodes];
            const scaffolds = newGraphNodes.filter(n => n.type === 'Scaffold');
            const movedNodes = newGraphNodes.filter(n => movedNodeIds.has(n.id));

            for (const movedNode of movedNodes) {
                if (movedNode.type === 'Scaffold') continue;

                const nodeDef = ALL_NODE_TYPES.find(d => d.type === movedNode.type);
                const nodeWidth = nodeDef?.width ?? 208;
                const nodeHeight = document.getElementById(`sound-node-${movedNode.id}`)?.offsetHeight ?? 100;
                const nodeBounds = {
                    left: movedNode.position.x, top: movedNode.position.y,
                    right: movedNode.position.x + nodeWidth, bottom: movedNode.position.y + nodeHeight
                };

                for (const scaffold of scaffolds) {
                    if (movedNodeIds.has(scaffold.id)) continue;
                    
                    const scaffoldBounds = {
                        left: scaffold.position.x, top: scaffold.position.y,
                        right: scaffold.position.x + scaffold.params.width, bottom: scaffold.position.y + scaffold.params.height
                    };

                    const intersects = !(nodeBounds.right < scaffoldBounds.left || nodeBounds.left > scaffoldBounds.right || nodeBounds.bottom < scaffoldBounds.top || nodeBounds.top > scaffoldBounds.bottom);

                    if (intersects) {
                        const newLeft = Math.min(scaffoldBounds.left, nodeBounds.left - 20);
                        const newTop = Math.min(scaffoldBounds.top, nodeBounds.top - 20);
                        const newRight = Math.max(scaffoldBounds.right, nodeBounds.right + 20);
                        const newBottom = Math.max(scaffoldBounds.bottom, nodeBounds.bottom + 20);
                        
                        const scaffoldToUpdate = newGraphNodes.find(n => n.id === scaffold.id);
                        if (scaffoldToUpdate) {
                            scaffoldToUpdate.position.x = newLeft;
                            scaffoldToUpdate.position.y = newTop;
                            scaffoldToUpdate.params.width = newRight - newLeft;
                            scaffoldToUpdate.params.height = newBottom - newTop;
                        }
                    }
                }
            }
            return { graph: { ...state.graph, nodes: newGraphNodes } };
        });
    },
});