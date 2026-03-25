
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import type { SoundNode } from '../types';
import { ALL_NODE_TYPES } from '../components/nodeTypes';

interface UseNodeCanvasInteractionProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    onNodeMenu: (pos: { x: number, y: number } | null) => void;
    nodeMenu: { x: number, y: number } | null;
    getPortPosition: (nodeId: string, portName: string, portType: 'input' | 'output') => { x: number, y: number } | null;
    isRerouterPreviewActive: boolean;
}

type InteractionState = 
    | { type: 'idle' }
    | { type: 'panning'; startPoint: { x: number; y: number } }
    | { type: 'node_drag'; didDrag: boolean; startPoint: { x: number; y: number }; initialPositions: Map<string, { x: number; y: number }>; nodeIdsToMove: Set<string>; }
    | { type: 'marquee'; startPoint: { x: number; y: number } }
    | { type: 'connecting'; }
    | { type: 'scaffold_resize'; nodeId: string; handle: string; startPoint: { x: number; y: number }; initialGeo: { x: number; y: number; width: number; height: number; }};


/**
 * A comprehensive hook to manage all complex mouse interactions on the NodeCanvas.
 * This includes panning, node dragging, marquee selection, and creating connections.
 * It centralizes all event listeners and state management into a robust state machine
 * to prevent common issues like orphaned event listeners and inconsistent states.
 */
export const useNodeCanvasInteraction = ({ canvasRef, onNodeMenu, nodeMenu, getPortPosition, isRerouterPreviewActive }: UseNodeCanvasInteractionProps) => {
    const { graph, scState } = useAppStore(state => ({
        graph: state.graph,
        scState: state.soundCreator,
    }), shallow);
    const actions = useAppStore(state => state.actions);
    
    const interactionRef = useRef<InteractionState>({ type: 'idle' });
    const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
    const marqueeRectRef = useRef(marqueeRect);
    useEffect(() => {
        marqueeRectRef.current = marqueeRect;
    }, [marqueeRect]);

    const ctrlHeldRef = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const state = interactionRef.current;
            const { transform } = useAppStore.getState().soundCreator;

            switch (state.type) {
                case 'panning':
                    actions.panAndZoomCanvas({ dx: e.clientX - state.startPoint.x, dy: e.clientY - state.startPoint.y, dZoom: 0 });
                    state.startPoint = { x: e.clientX, y: e.clientY };
                    break;

                case 'node_drag': {
                    const dx = e.clientX - state.startPoint.x;
                    const dy = e.clientY - state.startPoint.y;
                    if (!state.didDrag && Math.hypot(dx, dy) > 5) {
                        state.didDrag = true;
                    }
                    if(state.didDrag) {
                        const updatedPositions = Array.from(state.nodeIdsToMove).map(id => {
                            const startPos = state.initialPositions.get(id);
                            if (!startPos) return null;
                            return { nodeId: id, position: { x: startPos.x + dx / transform.k, y: startPos.y + dy / transform.k } };
                        }).filter((p): p is { nodeId: string; position: { x: number; y: number; }; } => p !== null);
                        
                        if (updatedPositions.length > 0) {
                            actions.updateNodePositions(updatedPositions);
                        }
                    }
                    break;
                }
                
                case 'scaffold_resize': {
                    const dx = (e.clientX - state.startPoint.x) / transform.k;
                    const dy = (e.clientY - state.startPoint.y) / transform.k;
                    const { initialGeo } = state;

                    let newX = initialGeo.x, newY = initialGeo.y, newWidth = initialGeo.width, newHeight = initialGeo.height;

                    if (state.handle.includes('top')) { newY = initialGeo.y + dy; newHeight = initialGeo.height - dy; }
                    if (state.handle.includes('left')) { newX = initialGeo.x + dx; newWidth = initialGeo.width - dx; }
                    if (state.handle.includes('bottom')) { newHeight = initialGeo.height + dy; }
                    if (state.handle.includes('right')) { newWidth = initialGeo.width + dx; }

                    if (newWidth < 100) { if (state.handle.includes('left')) newX = initialGeo.x + initialGeo.width - 100; newWidth = 100; }
                    if (newHeight < 80) { if (state.handle.includes('top')) newY = initialGeo.y + initialGeo.height - 80; newHeight = 80; }
                    
                    actions.updateNodeGeometry(state.nodeId, { x: newX, y: newY, width: newWidth, height: newHeight });
                    break;
                }
                
                case 'marquee':
                    if (canvasRef.current) {
                        const canvasRect = canvasRef.current.getBoundingClientRect();
                        const x = Math.min(e.clientX, state.startPoint.x) - canvasRect.left;
                        const y = Math.min(e.clientY, state.startPoint.y) - canvasRect.top;
                        setMarqueeRect({ x, y, width: Math.abs(e.clientX - state.startPoint.x), height: Math.abs(e.clientY - state.startPoint.y) });
                    }
                    break;
                
                case 'connecting':
                    if (canvasRef.current) {
                        const canvasRect = canvasRef.current.getBoundingClientRect();
                        actions.moveConnection({ x: (e.clientX - canvasRect.left), y: (e.clientY - canvasRect.top) });
                    }
                    break;
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            const state = interactionRef.current;

            if (state.type === 'panning' && canvasRef.current) {
                canvasRef.current.style.cursor = 'default';
            }

            if (state.type === 'node_drag') {
                if (state.didDrag) {
                    actions.checkScaffoldIntersections(state.nodeIdsToMove);
                }

                const targetNodeId = (e.target as HTMLElement).closest('.sound-node')?.id.replace('sound-node-', '');

                if (ctrlHeldRef.current && state.didDrag) {
                    const dx = e.clientX - state.startPoint.x;
                    const dy = e.clientY - state.startPoint.y;

                    const { selectedNodeIds } = useAppStore.getState().soundCreator;
                    const originalPositions = selectedNodeIds.map(id => {
                        const originalPos = state.initialPositions.get(id);
                        return originalPos ? { nodeId: id, position: originalPos } : null;
                    }).filter((p): p is { nodeId: string; position: { x: number; y: number; }; } => p !== null);
                    
                    if (originalPositions.length > 0) {
                        actions.updateNodePositions(originalPositions);
                    }

                    setTimeout(() => actions.handleDuplicateSelection({ dx, dy }, state.initialPositions), 0);
                    
                } else if (!state.didDrag && e.button === 0 && targetNodeId) {
                    actions.selectNode(targetNodeId || null, e.shiftKey || e.ctrlKey || e.metaKey);
                }
            }

            if (state.type === 'marquee' && marqueeRectRef.current && canvasRef.current) {
                 const currentMarqueeRect = marqueeRectRef.current;
                 const { graph, soundCreator: { transform } } = useAppStore.getState();
                 const worldMarquee = {
                     left: (currentMarqueeRect.x - transform.x) / transform.k, top: (currentMarqueeRect.y - transform.y) / transform.k,
                     right: (currentMarqueeRect.x + currentMarqueeRect.width - transform.x) / transform.k, bottom: (currentMarqueeRect.y + currentMarqueeRect.height - transform.y) / transform.k,
                 };
                 const selectedIds = graph.nodes.filter(node => {
                     if (node.id === 'MASTER_OUTPUT') return false;
                     const nodeEl = document.getElementById(`sound-node-${node.id}`); if (!nodeEl) return false;
                     const nodeRect = nodeEl.getBoundingClientRect();
                     const nodeWorldBox = { left: node.position.x, top: node.position.y, right: node.position.x + (nodeRect.width / transform.k), bottom: node.position.y + (nodeRect.height / transform.k) };
                     return worldMarquee.left < nodeWorldBox.right && worldMarquee.right > nodeWorldBox.left && worldMarquee.top < nodeWorldBox.bottom && worldMarquee.bottom > nodeWorldBox.top;
                 }).map(n => n.id);
                 actions.selectNodes(selectedIds, e.shiftKey);
            }

            if (state.type === 'connecting') {
                if (!(e.target as HTMLElement).closest('.node-port')) {
                    actions.endConnection(null);
                }
                document.body.style.cursor = '';
            }
            
            actions.updateUI({ duplicationPreviewNodes: null });
            setMarqueeRect(null);
            interactionRef.current = { type: 'idle' };
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseleave', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [actions, canvasRef, graph.nodes]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
            
            const isModKey = e.ctrlKey || e.metaKey;

            if (isModKey) {
                ctrlHeldRef.current = true;
            }

            if (isModKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                actions.groupSelectionInScaffold();
            }

            if (isModKey && interactionRef.current.type === 'node_drag' && !e.repeat) {
                const state = interactionRef.current;
                const existingPreview = useAppStore.getState().duplicationPreviewNodes;
                if (!existingPreview) {
                    const { selectedNodeIds } = useAppStore.getState().soundCreator;
                    const nodesToGhost = graph.nodes.filter(n => selectedNodeIds.includes(n.id));
                    const ghostNodes = nodesToGhost.map(node => {
                        const initialPosition = state.initialPositions.get(node.id);
                        return initialPosition ? { ...node, position: initialPosition } : node;
                    });
                    actions.updateUI({ duplicationPreviewNodes: ghostNodes });
                }
                return;
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && scState.selectedNodeIds.length > 0 && !isModKey) {
                e.preventDefault();
                actions.deleteNodes(scState.selectedNodeIds);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                ctrlHeldRef.current = false;
                actions.updateUI({ duplicationPreviewNodes: null });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [actions, graph.nodes, scState.selectedNodeIds]);

    const handleMouseDown = useCallback((e: React.MouseEvent, _id?: string) => {
        const targetEl = e.target as HTMLElement;
        const targetNodeEl = targetEl.closest('.sound-node');
        if (nodeMenu) { onNodeMenu(null); return; }

        const resizeHandle = targetEl.dataset.resizeHandle;
        if (resizeHandle && targetNodeEl) {
            e.stopPropagation();
            const nodeId = targetNodeEl.id.replace('sound-node-', '');
            const node = graph.nodes.find(n => n.id === nodeId);
            if (node) {
                interactionRef.current = {
                    type: 'scaffold_resize',
                    nodeId,
                    handle: resizeHandle,
                    startPoint: { x: e.clientX, y: e.clientY },
                    initialGeo: { x: node.position.x, y: node.position.y, width: node.params.width, height: node.params.height }
                };
            }
            return;
        }

        const isModKey = e.shiftKey || e.ctrlKey || e.metaKey;
        const isDuplicationKey = e.ctrlKey || e.metaKey;

        if (targetNodeEl) {
            e.stopPropagation();
            const nodeId = targetNodeEl.id.replace('sound-node-', '');
            const { soundCreator, graph } = useAppStore.getState();
            const isAlreadySelected = soundCreator.selectedNodeIds.includes(nodeId);

            let idsForSelection = soundCreator.selectedNodeIds;
            if (!isAlreadySelected) {
                idsForSelection = isModKey && !isDuplicationKey ? [...soundCreator.selectedNodeIds, nodeId] : [nodeId];
                actions.selectNodes(idsForSelection, false);
            }
            
            const nodeIdsToMove = new Set<string>(idsForSelection);
            const primaryDraggedNode = graph.nodes.find(n => n.id === nodeId);
            
            if (primaryDraggedNode && primaryDraggedNode.type === 'Scaffold') {
                const scaffoldBounds = {
                    left: primaryDraggedNode.position.x, top: primaryDraggedNode.position.y,
                    right: primaryDraggedNode.position.x + primaryDraggedNode.params.width, bottom: primaryDraggedNode.position.y + primaryDraggedNode.params.height
                };
                graph.nodes.forEach(n => {
                    if (n.type === 'Scaffold') return;
                    const nodeDef = ALL_NODE_TYPES.find(d => d.type === n.type);
                    const width = n.params.width || nodeDef?.width || 208;
                    const height = document.getElementById(`sound-node-${n.id}`)?.offsetHeight || 100;
                    const nodeCenter = { x: n.position.x + width / 2, y: n.position.y + height / 2 };

                    if (nodeCenter.x > scaffoldBounds.left && nodeCenter.x < scaffoldBounds.right && nodeCenter.y > scaffoldBounds.top && nodeCenter.y < scaffoldBounds.bottom) {
                        nodeIdsToMove.add(n.id);
                    }
                });
            }
    
            const initialPositions = new Map<string, { x: number; y: number }>();
            nodeIdsToMove.forEach(id => {
                const node = graph.nodes.find(n => n.id === id);
                if (node) initialPositions.set(id, { ...node.position });
            });
    
            interactionRef.current = { type: 'node_drag', didDrag: false, startPoint: { x: e.clientX, y: e.clientY }, initialPositions, nodeIdsToMove };

            if (isDuplicationKey) {
                ctrlHeldRef.current = true;
                const nodesToGhost = graph.nodes.filter(n => nodeIdsToMove.has(n.id));
                const ghostNodes = nodesToGhost.map(node => ({...node, position: initialPositions.get(node.id)!}));
                actions.updateUI({ duplicationPreviewNodes: ghostNodes });
            }
        } else {
            if (e.button === 0 && !e.altKey) {
                if (!e.shiftKey) actions.clearNodeSelection();
                interactionRef.current = { type: 'marquee', startPoint: { x: e.clientX, y: e.clientY } };
            } else if (e.button === 1 || (e.button === 0 && e.altKey)) {
                if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
                e.preventDefault();
                interactionRef.current = { type: 'panning', startPoint: { x: e.clientX, y: e.clientY } };
            }
        }
    }, [actions, canvasRef, nodeMenu, onNodeMenu, graph.nodes]);

    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        actions.panAndZoomCanvas({ dx: 0, dy: 0, dZoom: -e.deltaY * 0.001, mouseX, mouseY });
    }, [actions, canvasRef]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.sound-node')) {
            onNodeMenu({ x: e.clientX, y: e.clientY });
        }
    }, [onNodeMenu]);

    const handlePortMouseDown = useCallback((e: React.MouseEvent, nodeId: string, portName: string, portDirection: 'input' | 'output') => {
        e.stopPropagation();
        if (portDirection === 'output') {
            actions.startConnection(nodeId, portName);
        } else { // input
            if (nodeId === 'MASTER_OUTPUT') {
                actions.startBackwardConnection(nodeId, portName);
            } else {
                const { graph } = useAppStore.getState();
                const isConnected = graph.connections.some(c => c.toNodeId === nodeId && c.toInput === portName);
                if (isConnected) {
                    actions.reconnectFromInput(nodeId, portName);
                } else {
                    actions.startBackwardConnection(nodeId, portName);
                }
            }
        }
        document.body.style.cursor = 'crosshair';
        interactionRef.current = { type: 'connecting' };
    }, [actions]);

    const handleConnectionMouseDown = useCallback((e: React.MouseEvent, connectionId: string) => {
        const s = useAppStore.getState();
        const conn = s.graph.connections.find(c => c.id === connectionId);
        if (!conn || !canvasRef.current) return;

        const { transform } = s.soundCreator;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const mouseWorldPos = { x: (e.clientX - canvasRect.left - transform.x) / transform.k, y: (e.clientY - canvasRect.top - transform.y) / transform.k };
        
        if (isRerouterPreviewActive) {
            actions.createRerouterNode(connectionId, mouseWorldPos);
            return;
        }

        const startPos = getPortPosition(conn.fromNodeId, conn.fromOutput, 'output');
        const endPos = conn.toNodeId === 'MASTER_OUTPUT' 
            ? (() => {
                const toEl = document.getElementById('master-output-port-sc2');
                if (!toEl || !canvasRect) return null;
                const toRect = toEl.getBoundingClientRect();
                return { 
                    x: (toRect.left + toRect.width / 2 - canvasRect.left - transform.x) / transform.k, 
                    y: (toRect.top + toRect.height / 2 - canvasRect.top - transform.y) / transform.k 
                };
            })()
            : getPortPosition(conn.toNodeId, conn.toInput, 'input');

        if (!startPos || !endPos) return;

        const distSqToStart = (mouseWorldPos.x - startPos.x)**2 + (mouseWorldPos.y - startPos.y)**2;
        const distSqToEnd = (mouseWorldPos.x - endPos.x)**2 + (mouseWorldPos.y - endPos.y)**2;
        
        const portRadius = 16;
        const portThresholdSq = (portRadius / transform.k) ** 2;
        // Reduced threshold to prioritize rewiring over creating new connections when clicking near the output.
        // Previously * 4 (radius ~32px), now * 0.5 (radius ~11px).
        const newConnectionThresholdSq = portThresholdSq * 0.5; 

        if (distSqToStart < newConnectionThresholdSq) {
            handlePortMouseDown(e, conn.fromNodeId, conn.fromOutput, 'output');
        } else if (distSqToStart < distSqToEnd) {
            actions.startRewireFromOutputEnd(connectionId);
            document.body.style.cursor = 'crosshair';
            interactionRef.current = { type: 'connecting' };
        } else {
            actions.startRewireFromInputEnd(connectionId);
            document.body.style.cursor = 'crosshair';
            interactionRef.current = { type: 'connecting' };
        }
    }, [actions, canvasRef, getPortPosition, handlePortMouseDown, isRerouterPreviewActive]);

    const handlePortMouseUp = useCallback((e: React.MouseEvent, nodeId: string, portName: string, portDirection: 'input' | 'output') => {
        e.stopPropagation(); 
        const { drawingConnection } = useAppStore.getState().soundCreator;
        if (!drawingConnection) return;

        if (drawingConnection.type === 'forward' && portDirection === 'input') {
            actions.endConnection({ toNodeId: nodeId, toInput: portName });
        } else if (drawingConnection.type === 'backward' && portDirection === 'output') {
            actions.endConnection({ fromNodeId: nodeId, fromOutput: portName });
        }
    }, [actions]);

    const handleMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    }, []);

    return {
        interactionHandlers: {
            handleMouseDown,
            handleMouseUp,
            handleWheel,
            handleDoubleClick,
            handlePortMouseDown,
            handlePortMouseUp,
            handleConnectionMouseDown,
        },
        marqueeRect,
    };
};
