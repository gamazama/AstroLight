
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { ALL_NODE_TYPES } from './nodeTypes';
import Node from './Node';
import type { SoundNodePort } from '../types';
import { useNodeCanvasInteraction } from '../hooks/useNodeCanvasInteraction';
import { createSplinePath } from '../utils/splineUtils';
import { NodeMenu } from './NodeMenu';
import { MasterOutput } from './MasterOutput';

const NodeCanvas: React.FC = () => {
    const { graph, scState, mousePosition, duplicationPreviewNodes, deleteConnection } = useAppStore(state => ({
        graph: state.graph,
        scState: state.soundCreator,
        mousePosition: state.mousePosition,
        duplicationPreviewNodes: state.duplicationPreviewNodes,
        deleteConnection: state.actions.deleteConnection,
    }), shallow);
    
    const canvasRef = useRef<HTMLDivElement>(null);
    const portRefs = useRef(new Map<string, HTMLDivElement>());
    
    const [nodeMenu, setNodeMenu] = useState<{x: number, y: number} | null>(null);
    const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
    const [rerouterPreview, setRerouterPreview] = useState<{ x: number, y: number } | null>(null);

    const transform = scState.transform;
    const nodeDefs = useMemo(() => new Map(ALL_NODE_TYPES.map(n => [n.type, n])), []);
    const isAttributePanelOpen = scState.selectedNodeIds.length > 0;
    
    const getPortPosition = useCallback((nodeId: string, portName: string, portType: 'input' | 'output'): { x: number, y: number } | null => {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        const portEl = portRefs.current.get(`${nodeId}-${portName}`);
        
        if (portEl && canvasRect) {
            const portRect = portEl.getBoundingClientRect();
            const x = (portRect.left + portRect.width / 2 - canvasRect.left - transform.x) / transform.k;
            const y = (portRect.top + portRect.height / 2 - canvasRect.top - transform.y) / transform.k;
            return { x, y };
        }
        return null; 
    }, [transform.x, transform.y, transform.k]);

    const { interactionHandlers, marqueeRect } = useNodeCanvasInteraction({
        canvasRef,
        onNodeMenu: setNodeMenu,
        nodeMenu,
        getPortPosition,
        isRerouterPreviewActive: !!rerouterPreview,
    });

    useEffect(() => {
        if (!hoveredConnectionId || !canvasRef.current) {
            if (rerouterPreview) setRerouterPreview(null);
            return;
        }
        
        const conn = graph.connections.find(c => c.id === hoveredConnectionId);
        if (!conn) {
            if (rerouterPreview) setRerouterPreview(null);
            return;
        }
    
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const startPos = getPortPosition(conn.fromNodeId, conn.fromOutput, 'output');
        const endPos = conn.toNodeId === 'MASTER_OUTPUT' 
            ? (() => {
                const toEl = document.getElementById('master-output-port-sc2');
                if (!toEl || !canvasRect) return null;
                const toRect = toEl.getBoundingClientRect();
                return { 
                    x: (toRect.left + toRect.width / 2 - canvasRect.left - scState.transform.x) / scState.transform.k, 
                    y: (toRect.top + toRect.height / 2 - canvasRect.top - scState.transform.y) / scState.transform.k 
                };
            })()
            : getPortPosition(conn.toNodeId, conn.toInput, 'input');
    
        if (!startPos || !endPos) {
            if (rerouterPreview) setRerouterPreview(null);
            return;
        }
    
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        const mouseWorldX = (mousePosition.x - canvasRect.left - scState.transform.x) / scState.transform.k;
        const mouseWorldY = (mousePosition.y - canvasRect.top - scState.transform.y) / scState.transform.k;
        const dist = Math.hypot(mouseWorldX - midX, mouseWorldY - midY);
        const threshold = 12 / scState.transform.k;
    
        if (dist < threshold) {
            setRerouterPreview({ x: midX, y: midY });
        } else {
            setRerouterPreview(null);
        }
    
    }, [hoveredConnectionId, mousePosition, scState.transform, graph.connections, getPortPosition, rerouterPreview]);


    const drawingConnectionType = useMemo(() => {
        const { drawingConnection } = scState;
        if (!drawingConnection) return null;

        if (drawingConnection.type === 'forward') {
            const fromNode = graph.nodes.find(n => n.id === drawingConnection.fromNodeId);
            if (!fromNode) return null;
            const fromNodeDef = nodeDefs.get(fromNode.type);
            if (!fromNodeDef) return null;
            let fromOutputPort: SoundNodePort | undefined;
            
            if (fromNode.type === 'DataSource' || fromNode.type === 'Interaction') { 
                fromOutputPort = { name: drawingConnection.fromOutput, label: '', type: 'value' };
            } else { 
                fromOutputPort = fromNodeDef.outputs.find(o => o.name === drawingConnection.fromOutput); 
            }
            return fromOutputPort ? fromOutputPort.type : null;
        } else { // backward
            const toNode = graph.nodes.find(n => n.id === drawingConnection.toNodeId);
            if (!toNode) return null;
            const toNodeDef = nodeDefs.get(toNode.type);
            if (!toNodeDef) return null;
            const toInputPort = toNodeDef.inputs.find(i => i.name === drawingConnection.toInput) || 
                                (toNodeDef.parameters.some(p => p.name === drawingConnection.toInput) ? { name: drawingConnection.toInput, label: '', type: 'value' } : null);
            return toInputPort ? toInputPort.type : null;
        }
    }, [scState.drawingConnection, graph.nodes, nodeDefs]);
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const nodes = graph.nodes.filter(n => n.id !== 'MASTER_OUTPUT');
    const scaffolds = nodes.filter(n => n.type === 'Scaffold');
    const regularNodes = nodes.filter(n => n.type !== 'Scaffold');

    return (
        <div 
            ref={canvasRef}
            className="absolute inset-0 bg-transparent overflow-hidden"
            onMouseDown={interactionHandlers.handleMouseDown}
            onWheel={interactionHandlers.handleWheel}
            onDoubleClick={interactionHandlers.handleDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
        >
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
                <defs><pattern id="grid2" width={32 * transform.k} height={32 * transform.k} patternUnits="userSpaceOnUse"><path d={`M ${32 * transform.k} 0 L 0 0 0 ${32 * transform.k}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid2)" x={transform.x % (32 * transform.k)} y={transform.y % (32 * transform.k)} />
            </svg>

            <div className="absolute top-0 left-0 w-full h-full" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, transformOrigin: '0 0' }}>
                {scaffolds.map(node => (
                    <Node 
                        key={node.id} 
                        node={node} 
                        onMouseDown={interactionHandlers.handleMouseDown} 
                        onMouseUp={interactionHandlers.handleMouseUp}
                        onPortMouseDown={{ input: () => {}, output: () => {} }}
                        onPortMouseUp={() => {}}
                        portRefs={portRefs} 
                        isGhost={false}
                    />
                ))}

                {duplicationPreviewNodes?.map(node => (
                    <Node 
                        key={`${node.id}-ghost`} 
                        node={node}
                        onMouseDown={() => {}}
                        onMouseUp={() => {}}
                        onPortMouseDown={{ input: () => {}, output: () => {} }}
                        onPortMouseUp={() => {}}
                        portRefs={portRefs} 
                        isGhost={true}
                    />
                ))}
                {regularNodes.map(node => (
                    <Node 
                        key={node.id} 
                        node={node} 
                        onMouseDown={interactionHandlers.handleMouseDown} 
                        onMouseUp={interactionHandlers.handleMouseUp}
                        onPortMouseDown={{
                            input: (e, toNodeId, toInput) => interactionHandlers.handlePortMouseDown(e, toNodeId, toInput, 'input'),
                            output: (e, fromNodeId, fromOutput) => interactionHandlers.handlePortMouseDown(e, fromNodeId, fromOutput, 'output')
                        }}
                        onPortMouseUp={interactionHandlers.handlePortMouseUp}
                        portRefs={portRefs} 
                        isGhost={false}
                    />
                ))}
            </div>
            
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-10">
                <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, transformOrigin: '0 0' }}>
                {graph.connections.map(conn => {
                    const fromNode = graph.nodes.find(n => n.id === conn.fromNodeId); if (!fromNode) return null;
                    const fromNodeDef = nodeDefs.get(fromNode.type); if (!fromNodeDef) return null;
                    
                    const startPos = getPortPosition(conn.fromNodeId, conn.fromOutput, 'output');
                    if (!startPos) return null;
                    const { x: startX, y: startY } = startPos;
                    
                    let endX, endY;
                    if (conn.toNodeId === 'MASTER_OUTPUT') {
                        const toEl = document.getElementById('master-output-port-sc2'); if (!toEl || !canvasRect) return null;
                        const toRect = toEl.getBoundingClientRect();
                        endX = (toRect.left + toRect.width / 2 - canvasRect.left - transform.x) / transform.k;
                        endY = (toRect.top + toRect.height / 2 - canvasRect.top - transform.y) / transform.k;
                    } else {
                        const endPos = getPortPosition(conn.toNodeId, conn.toInput, 'input');
                        if (!endPos) return null;
                        endX = endPos.x;
                        endY = endPos.y;
                    }

                    const path = createSplinePath({x: startX, y: startY}, conn.pathPoints || [], {x: endX, y: endY});
                    
                    let fromOutputPort: SoundNodePort | undefined | { name: string, type: 'value' };
                    if (fromNode.type === 'DataSource' || fromNode.type === 'Interaction') {
                        fromOutputPort = { name: conn.fromOutput, type: 'value' };
                    } else {
                        fromOutputPort = fromNodeDef.outputs.find(o => o.name === conn.fromOutput);
                    }
                    
                    const portType = fromOutputPort ? fromOutputPort.type : 'value';

                    const isHovered = hoveredConnectionId === conn.id;
                    const clippingKey = `${conn.fromNodeId}-${conn.fromOutput}`;
                    const isClipping = portType === 'audio' && useAppStore.getState().clippingOutputs[clippingKey];
            
                    const strokeWidth = isClipping ? 7 : (isHovered ? 5 : 3);
                    const strokeColor = isClipping ? '#ef4444' : (portType === 'audio' ? '#06b6d4' : '#10b981');

                    const hitboxPointerEvents = scState.drawingConnection ? 'none' : 'all';

                    return (
                        <g key={conn.id}>
                            <path d={path} stroke="transparent" strokeWidth="28" fill="transparent" strokeLinecap="round" className="cursor-pointer" style={{ pointerEvents: hitboxPointerEvents }} onMouseDown={(e) => { e.stopPropagation(); interactionHandlers.handleConnectionMouseDown(e, conn.id); }} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); deleteConnection(conn.id); }} onMouseEnter={() => setHoveredConnectionId(conn.id)} onMouseLeave={() => setHoveredConnectionId(null)}/>
                            <path d={path} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" className="pointer-events-none transition-all duration-75" style={{ opacity: isHovered ? 1 : 0.8 }}/>
                        </g>
                    );
                })}
                {rerouterPreview && (
                    <g className="pointer-events-none">
                        <circle
                            cx={rerouterPreview.x}
                            cy={rerouterPreview.y}
                            r={8 / scState.transform.k}
                            fill="rgba(6, 182, 212, 0.2)"
                            stroke="rgba(6, 182, 212, 0.5)"
                            strokeWidth={1.5 / scState.transform.k}
                        />
                        <circle
                            cx={rerouterPreview.x}
                            cy={rerouterPreview.y}
                            r={4 / scState.transform.k}
                            fill="#06b6d4"
                        />
                    </g>
                )}
                {scState.drawingConnection && (() => {
                    let startX, startY, endX, endY;
                    const { drawingConnection } = scState;

                    if (drawingConnection.type === 'forward' && drawingConnection.to) {
                        const startPos = getPortPosition(drawingConnection.fromNodeId, drawingConnection.fromOutput, 'output');
                        if (!startPos) return null;
                        ({ x: startX, y: startY } = startPos);
                        ({ x: endX, y: endY } = drawingConnection.to);
                        endX = (endX - transform.x) / transform.k;
                        endY = (endY - transform.y) / transform.k;
                    } else if (drawingConnection.type === 'backward' && drawingConnection.from) {
                        const endPos = getPortPosition(drawingConnection.toNodeId, drawingConnection.toInput, 'input');
                        if (!endPos) return null;
                        ({ x: endX, y: endY } = endPos);
                        ({ x: startX, y: startY } = drawingConnection.from);
                        startX = (startX - transform.x) / transform.k;
                        startY = (startY - transform.y) / transform.k;
                    } else {
                        return null; // Don't draw if the position isn't available yet
                    }

                    const dx = endX - startX;
                    const controlPointPoint = Math.max(30, Math.abs(dx) * 0.4);
                    const path = `M ${startX} ${startY} C ${startX + controlPointPoint} ${startY}, ${endX - controlPointPoint} ${endY}, ${endX} ${endY}`;
                    const strokeColor = drawingConnectionType === 'audio' ? '#06b6d4' : '#10b981';

                    return <path d={path} stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="5 5" />;
                })()}
                </g>
            </svg>

            {nodeMenu && <NodeMenu {...nodeMenu} onClose={() => setNodeMenu(null)} />}
            
            <MasterOutput 
                isAttributePanelOpen={isAttributePanelOpen} 
                portRefs={portRefs} 
                interactionHandlers={interactionHandlers} 
            />

            {marqueeRect && <div className="absolute border-2 border-dashed border-blue-400 bg-blue-400/20 pointer-events-none z-10" style={{ left: marqueeRect.x, top: marqueeRect.y, width: marqueeRect.width, height: marqueeRect.height }} />}
        </div>
    );
};

export default NodeCanvas;
