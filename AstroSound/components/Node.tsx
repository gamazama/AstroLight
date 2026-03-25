
import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { ALL_NODE_TYPES } from './nodeTypes';
import type { SoundNode, SoundNodePort } from '../types';
import OscilloscopeNodeViz from './OscilloscopeNodeViz';
import CurveNodeViz from './CurveNodeViz';
import { frequencyToNote } from '../../utils/noteUtils';

// --- Smart Value Formatter ---
const formatValue = (val: number): string => {
    if (val === 0) return '0';
    const abs = Math.abs(val);
    if (abs >= 10000) return (val / 1000).toFixed(1) + 'k';
    if (abs >= 1000) return val.toFixed(0);
    if (abs >= 100) return val.toFixed(1);
    if (abs >= 10) return val.toFixed(2);
    if (abs < 0.001) return val.toExponential(1);
    return val.toFixed(3);
};

const NodePortValue: React.FC<{ value: number | number[] | undefined }> = ({ value }) => {
    if (value === undefined) return null;
    const displayValue = Array.isArray(value) ? (value[0] + value[1]) * 0.5 : value;
    
    if (!isFinite(displayValue)) return <span className="text-[9px] font-mono bg-red-900/50 px-1 rounded text-white">ERR</span>;
    
    return (
        <span className="text-[10px] font-mono bg-black/40 px-1.5 rounded text-cyan-300 min-w-[24px] text-center inline-block">
            {formatValue(displayValue)}
        </span>
    );
};

// --- Lightweight Visualizations ---

const LfoLed: React.FC<{ value: number }> = ({ value }) => {
    // Map -1..1 to 0.1..1 opacity
    const opacity = 0.2 + 0.8 * ((value + 1) / 2);
    return (
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-black/50 border border-white/10 overflow-hidden">
            <div 
                className="w-full h-full bg-indigo-400 transition-opacity duration-75" 
                style={{ opacity }} 
            />
        </div>
    );
};

const VuMeter: React.FC<{ value: number | number[] }> = ({ value }) => {
    const [l, r] = Array.isArray(value) ? value : [value, value];
    const clamp = (v: number) => Math.max(0, Math.min(1, Math.abs(v)));
    
    return (
        <div className="flex gap-0.5 h-3.5 w-2 items-end ml-1 bg-black/40 p-[1px] rounded border border-white/5 opacity-80">
            <div className="w-0.5 bg-cyan-900/50 h-full relative overflow-hidden rounded-[1px]">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-300 transition-transform duration-75 origin-bottom" style={{ height: '100%', transform: `scaleY(${clamp(l)})` }} />
            </div>
            <div className="w-0.5 bg-cyan-900/50 h-full relative overflow-hidden rounded-[1px]">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-300 transition-transform duration-75 origin-bottom" style={{ height: '100%', transform: `scaleY(${clamp(r)})` }} />
            </div>
        </div>
    );
};

const NoteDisplay: React.FC<{ frequency: number }> = ({ frequency }) => {
    const note = frequencyToNote(frequency);
    return (
        <div className="mt-1 mb-1 w-full text-center pointer-events-none">
            <span className="text-[11px] font-bold text-cyan-100 bg-black/40 px-2 py-0.5 rounded border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                {note}
            </span>
        </div>
    );
};

const MathOperatorDisplay: React.FC<{ operation: string }> = ({ operation }) => {
    const symbolMap: Record<string, string> = {
        add: '+', subtract: '-', multiply: '×', divide: '÷',
        scale: 'mx+c', abs: '|x|', min: 'min', max: 'max', pow: 'xʸ'
    };
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
            <span className="text-4xl font-black text-white">
                {symbolMap[operation] || '?'}
            </span>
        </div>
    );
};

const DataSourceDisplay: React.FC<{ node: SoundNode, planetNodes: {id:number, name:string}[], connections: {id:number, from:number, to:number}[] }> = ({ node, planetNodes, connections }) => {
    const { sourceType, connectionIndex, planetId } = node.params;
    let displayText = "None Selected";

    if (sourceType === 'planet' && planetId !== null) {
        const planet = planetNodes.find(n => n.id === planetId);
        if (planet) displayText = planet.name;
    } else if (sourceType !== 'planet' && connectionIndex !== null && connections[connectionIndex]) {
        const conn = connections[connectionIndex];
        const from = planetNodes.find(n => n.id === conn.from);
        const to = planetNodes.find(n => n.id === conn.to);
        if (from && to) {
             // Abbreviate if too long?
            displayText = `${from.name} ↔ ${to.name}`;
        }
    }

    return (
        <div className="w-full text-center pointer-events-none mb-1">
            <span className="text-[10px] font-bold text-indigo-200 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/30">
                {displayText}
            </span>
        </div>
    );
};


interface NodeProps {
    node: SoundNode;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onMouseUp: (e: React.MouseEvent, id: string) => void;
    onPortMouseDown: { 
        input: (e: React.MouseEvent, toNodeId: string, toInput: string) => void; 
        output: (e: React.MouseEvent, fromNodeId: string, fromOutput: string) => void 
    };
    onPortMouseUp: (e: React.MouseEvent, nodeId: string, portName: string, portDirection: 'input' | 'output') => void;
    portRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
    isGhost?: boolean;
}

const Node: React.FC<NodeProps> = ({ node, onMouseDown, onMouseUp, onPortMouseDown, onPortMouseUp, portRefs, isGhost = false }) => {
    const { scState, soundNodeOutputs, clippingOutputs, graph, connections, planetNodes } = useAppStore(state => ({
        scState: state.soundCreator,
        soundNodeOutputs: state.soundNodeOutputs,
        clippingOutputs: state.clippingOutputs,
        graph: state.graph,
        connections: state.connections,
        planetNodes: state.planetNodes,
    }), shallow);
    
    const nodeDefs = useMemo(() => new Map(ALL_NODE_TYPES.map(n => [n.type, n])), []);
    const nodeDef = nodeDefs.get(node.type);

    if (!nodeDef) return null;

    // --- Node Specific Logic ---
    const isScaffold = node.type === 'Scaffold';
    const isRerouter = node.type === 'Audio Rerouter' || node.type === 'Value Rerouter';
    const isOscilloscope = node.type === 'Oscilloscope';
    const isCurve = node.type === 'Curve';
    const isLFO = node.type === 'LFO';
    // Allow VU meter on ALL nodes if the output type is audio
    const isOctaver = node.type === 'Cosmic Octaver';
    const isMath = node.type === 'Math';
    const isDataSource = node.type === 'DataSource';
    const isInteraction = node.type === 'Interaction';

    // --- Data Retrieval ---
    const liveOutputs = soundNodeOutputs[node.id] || {};
    const primaryOutputValue = liveOutputs['out'];
    const lfoValue = typeof primaryOutputValue === 'number' ? primaryOutputValue : 0;

    if (isScaffold) {
        const isSelected = scState.selectedNodeIds.includes(node.id);
        const ghostClasses = isGhost ? 'opacity-30 pointer-events-none border-dashed' : '';
        const scaffoldColor = node.params.displayColor || '#4a5568';

        return (
            <div
                id={`sound-node-${node.id}`}
                className={`sound-node absolute border-2 rounded-xl shadow-lg transition-opacity duration-200 ${isSelected && !isGhost ? 'border-indigo-400/80' : 'border-transparent'} ${ghostClasses}`}
                style={{
                    transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                    width: node.params.width,
                    height: node.params.height,
                    backgroundColor: `${scaffoldColor}33`,
                    zIndex: -10,
                }}
                onMouseUp={(e) => onMouseUp(e, node.id)}
            >
                <div
                    className="h-8 rounded-t-lg px-3 py-1 cursor-grab flex items-center justify-between"
                    style={{ backgroundColor: `${scaffoldColor}55` }}
                    onMouseDown={(e) => onMouseDown(e, node.id)}
                >
                    <span className="font-bold text-sm truncate pointer-events-none">{node.params.customName || nodeDef.label}</span>
                </div>

                {isSelected && !isGhost && (
                    <>
                        <div data-resize-handle="top-left" className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-indigo-400 rounded-full cursor-nwse-resize border-2 border-gray-800 z-10"></div>
                        <div data-resize-handle="top-right" className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-400 rounded-full cursor-nesw-resize border-2 border-gray-800 z-10"></div>
                        <div data-resize-handle="bottom-left" className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-indigo-400 rounded-full cursor-nesw-resize border-2 border-gray-800 z-10"></div>
                        <div data-resize-handle="bottom-right" className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-400 rounded-full cursor-nwse-resize border-2 border-gray-800 z-10"></div>
                    </>
                )}
            </div>
        );
    }


    const inputsToRender: SoundNodePort[] = [...nodeDef.inputs];
    if (node.params.exposedInputs) {
        for (const paramName of node.params.exposedInputs) {
            const paramDef = nodeDef.parameters.find(p => p.name === paramName);
            if (paramDef) {
                inputsToRender.push({ name: paramDef.name, label: paramDef.label, type: 'value' });
            }
        }
    }

    let outputsToRender: SoundNodePort[] = [...nodeDef.outputs];
    if (node.type === 'DataSource' || node.type === 'Interaction') {
        const activeOutputs = node.params.activeOutputs || [];
        const outputParamDef = nodeDef.parameters.find(p => p.name === 'activeOutputs');
        
        if (outputParamDef?.options) {
            let dynamicOptions = JSON.parse(JSON.stringify(outputParamDef.options));
            
            if (node.type === 'DataSource') {
                if (node.params.sourceType === 'planet' && node.params.planetId !== null) {
                     const planetName = planetNodes.find(n => n.id === node.params.planetId)?.name || "Source";
                     dynamicOptions.forEach((group: any) => {
                         if (group.group === 'Source Body') group.group = planetName;
                     });
                } else if (node.params.connectionIndex !== null && connections[node.params.connectionIndex]) {
                     const conn = connections[node.params.connectionIndex];
                     const fromName = planetNodes.find(n => n.id === conn.from)?.name || "Source";
                     const toName = planetNodes.find(n => n.id === conn.to)?.name || "Target";
                     dynamicOptions.forEach((group: any) => {
                         if (group.group === 'Source Body') group.group = fromName;
                         if (group.group === 'Target Body') group.group = toName;
                     });
                }
            }

            outputsToRender = [];
            (dynamicOptions as any[]).forEach((group: any) => {
                if (group.items) {
                    group.items.forEach((item: any) => {
                        if (activeOutputs.includes(item.value)) {
                            const cleanLabel = item.label.split(' (')[0];
                            let label;
                            
                            // Only exclude prefixes for known groups, allow others to pass through or be prefixed
                            if (group.group !== 'Connection Physics' && group.group !== 'Interaction' && group.group !== 'Mouse' && group.group !== 'Camera' && group.group !== 'Simulation') {
                                label = `${group.group}: ${cleanLabel}`;
                            } else {
                                label = cleanLabel;
                            }

                            outputsToRender.push({
                                name: item.value.toString(),
                                label: label,
                                type: 'value'
                            });
                        }
                    });
                }
            });
        }
    }

    const isSelected = scState.selectedNodeIds.includes(node.id);
    const headerColor = node.params.displayColor || (isSelected ? '#6366f1' : '#334155');
    const rerouterPortColor = node.type === 'Audio Rerouter' ? 'bg-cyan-500' : 'bg-green-500';
    const ghostClasses = isGhost ? 'opacity-30 pointer-events-none border-dashed' : '';

    const customWidth = nodeDef.width ? `w-[${nodeDef.width}px]` : 'w-52';

    return (
        <div
            id={`sound-node-${node.id}`}
            className={`sound-node absolute dynamic-blur border ${isSelected && !isGhost ? 'border-indigo-400/80 ring-2 ring-indigo-400/50' : 'border-white/10'} shadow-lg transition-opacity duration-200 ${node.params.isBypassed ? 'opacity-50' : ''} ${isRerouter ? 'w-8 h-8 rounded-full' : `${customWidth} rounded-lg`} ${ghostClasses}`}
            style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onMouseUp={(e) => onMouseUp(e, node.id)}
        >
            {isRerouter ? (
                <>
                    <div
                        ref={el => { if(el) portRefs.current.set(`${node.id}-in`, el)}}
                        className={`node-port node-input absolute top-1/2 left-0 -translate-y-1/2 -translate-x-full w-3 h-3 ${rerouterPortColor} rounded-full cursor-crosshair`}
                        onMouseUp={(e) => onPortMouseUp(e, node.id, 'in', 'input')}
                        onMouseDown={(e) => onPortMouseDown.input(e, node.id, 'in')}
                    ></div>
                    <div
                        ref={el => { if(el) portRefs.current.set(`${node.id}-out`, el)}}
                        className={`node-port node-output absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-3 h-3 ${rerouterPortColor} rounded-full cursor-pointer`}
                        onMouseUp={(e) => onPortMouseUp(e, node.id, 'out', 'output')}
                        onMouseDown={(e) => onPortMouseDown.output(e, node.id, 'out')}
                    ></div>
                </>
            ) : (
                <>
                    <div className="h-2 rounded-t-lg relative" style={{ backgroundColor: headerColor }} onMouseDown={(e) => onMouseDown(e, node.id)}>
                        {isLFO && <LfoLed value={lfoValue} />}
                        {isCurve && <LfoLed value={lfoValue} />}
                    </div>
                    <div className="p-2 cursor-grab relative" onMouseDown={(e) => onMouseDown(e, node.id)}>
                        <div className="flex justify-between items-center">
                             <div className="font-bold text-sm truncate">{node.params.customName || nodeDef.label}</div>
                             {isOctaver && (
                                 <div className="flex items-center gap-1">
                                     <span className="text-[9px] text-gray-400">IN:</span>
                                     <NodePortValue value={soundNodeOutputs[node.id]?.inputValue || node.params.value} />
                                 </div>
                             )}
                        </div>
                        {isOctaver && <NoteDisplay frequency={liveOutputs['out'] as number} />}
                        {isDataSource && <DataSourceDisplay node={node} planetNodes={planetNodes} connections={connections} />}
                        {isMath && <MathOperatorDisplay operation={node.params.operation} />}
                        
                        {/* Viz Components */}
                        {isOscilloscope && <div className="mt-2"><OscilloscopeNodeViz nodeId={node.id} timeScale={node.params.timeScale} triggerLevel={node.params.trigger} /></div>}
                        {isCurve && <div className="mt-2"><CurveNodeViz node={node} /></div>}
                    </div>
                    <div className="flex justify-between px-2 pb-2 text-xs">
                        {/* Inputs Column */}
                        <div className="space-y-2 flex flex-col items-start">
                            {inputsToRender.map(input => {
                                const isConnected = graph.connections.some(c => c.toNodeId === node.id && c.toInput === input.name);
                                const color = input.type === 'audio' ? 'bg-cyan-500' : 'bg-green-500';
                                return (
                                    <div key={input.name} className="flex items-center gap-2">
                                        <div ref={el => { if(el) portRefs.current.set(`${node.id}-${input.name}`, el)}} className={`node-port node-input w-3 h-3 rounded-full cursor-crosshair ${color} ${isConnected ? '' : 'opacity-30'}`} onMouseUp={(e) => onPortMouseUp(e, node.id, input.name, 'input')} onMouseDown={(e) => onPortMouseDown.input(e, node.id, input.name)}></div>
                                        <span className="truncate text-gray-300" title={input.label}>{input.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Outputs Column */}
                        <div className="space-y-2 flex flex-col items-end">
                            {outputsToRender.map(output => {
                                 const color = output.type === 'audio' ? 'bg-cyan-500' : 'bg-green-500';
                                 const isClipping = clippingOutputs[`${node.id}-${output.name}`];
                                 const outputValue = soundNodeOutputs[node.id]?.[output.name];
                                 
                                return (
                                <div key={output.name} className="flex items-center gap-2 justify-end">
                                    {/* Show VU Meter for ALL audio ports, show Text Value for all Value ports */}
                                    {output.type === 'audio' ? (
                                        <VuMeter value={outputValue || 0} />
                                    ) : (
                                        <NodePortValue value={outputValue} />
                                    )}
                                    <span className="truncate text-right text-gray-300" title={output.label}>{output.label}</span>
                                    <div ref={el => { if(el) portRefs.current.set(`${node.id}-${output.name}`, el)}} className={`node-port node-output w-3 h-3 ${color} rounded-full cursor-pointer ${isClipping ? 'animate-pulse bg-red-500' : ''}`} onMouseUp={(e) => onPortMouseUp(e, node.id, output.name, 'output')} onMouseDown={(e) => onPortMouseDown.output(e, node.id, output.name)}></div>
                                </div>
                            )})}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Node;
