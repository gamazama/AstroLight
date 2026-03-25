import React from 'react';
import type { SoundNode, SoundNodeType } from '../types';
import type { Connection, PlanetNode } from '../../types/simulation';
import FilterNodeViz from './FilterNodeViz'; // Fixed Import
import { LFONodeViz } from './LFONodeViz';
import { ParamSlider } from './controls/ParamSlider';
import { ParamSelect } from './controls/ParamSelect';
import { ParamCheckboxGroup } from './controls/ParamCheckboxGroup';

const ModulatorButton: React.FC<{isExposed: boolean, onToggle: () => void, paramName: string}> = ({ isExposed, onToggle, paramName }) => (
    <div 
        onClick={onToggle} 
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${isExposed ? 'border-green-400 bg-green-500/30' : 'border-gray-500 hover:border-green-400'}`}
        title={isExposed ? `Hide '${paramName}' input` : `Expose '${paramName}' as input`}
    >
        {isExposed && <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
    </div>
);

/**
 * Helper to determine if a specific parameter should be visible based on other parameter values.
 */
const shouldShowParameter = (node: SoundNode, paramName: string): boolean => {
    const p = node.params;
    const type = node.type;

    if (type === 'Math') {
        if ((paramName === 'factor' || paramName === 'offset') && p.operation !== 'scale') return false;
        if (paramName === 'val2' && !['add', 'subtract', 'multiply', 'divide', 'min', 'max', 'pow'].includes(p.operation)) return false;
    }
    if (type === 'Static Source') {
        if (p.mode === 'value' && ['waveform', 'frequency', 'amplitude', 'pulseWidth', 'pan'].includes(paramName)) return false;
        if (p.mode === 'oscillator' && paramName === 'value') return false;
    }
    if (['Oscillator', 'LFO'].includes(type) && paramName === 'pulseWidth' && p.waveform !== 'square') return false;
    if (type === 'Cosmic Octaver') {
        if (['distanceUnit', 'speedConstant'].includes(paramName) && p.inputType !== 'distance') return false;
        if (paramName === 'customVelocity' && (p.inputType !== 'distance' || p.speedConstant !== 'custom')) return false;
    }
    if (type === 'DataSource') {
        if (paramName === 'connectionIndex' && p.sourceType === 'planet') return false;
        if (paramName === 'planetId' && p.sourceType !== 'planet') return false;
    }
    return true;
};

interface ParameterListProps {
    primaryNode: SoundNode;
    selectedNodes: SoundNode[];
    nodeDef: SoundNodeType;
    allSameType: boolean;
    connections: Connection[];
    planetNodes: PlanetNode[];
    soundNodeOutputs: Record<string, any>;
    clippingOutputs: Record<string, boolean>;
    graphConnections: any[];
    onChange: (paramName: string, value: any) => void;
    onPresetChange: (value: string) => void;
    onToggleInput: (nodeId: string, paramName: string) => void;
}

export const ParameterList: React.FC<ParameterListProps> = ({
    primaryNode,
    selectedNodes,
    nodeDef,
    allSameType,
    connections,
    planetNodes,
    soundNodeOutputs,
    graphConnections,
    onChange,
    onPresetChange,
    onToggleInput
}) => {
    if (primaryNode.type === 'Output') {
        return (
            <p className="text-sm text-gray-400 text-center py-8">This is the final audio output. Connect any audio signal here to hear it.</p>
        );
    }

    return (
        <>
            {/* Visualizers */}
            {selectedNodes.length === 1 && (primaryNode.type === 'LFO' || (primaryNode.type === 'Static Source' && primaryNode.params.mode === 'oscillator')) && <LFONodeViz node={primaryNode} />}
            {selectedNodes.length === 1 && primaryNode.type === 'Filter' && <FilterNodeViz node={primaryNode} />}

            {selectedNodes.length > 1 && !allSameType && (
                <p className="text-sm text-center text-gray-400 bg-black/20 p-4 rounded-md">Multiple node types selected. Only common properties (Name, Color, Bypass) can be edited.</p>
            )}
            
            {/* Parameters Loop */}
            {(allSameType) && nodeDef.parameters
                .filter(p => !['customName', 'displayColor', 'isBypassed'].includes(p.name))
                .map(param => {
                    if (!shouldShowParameter(primaryNode, param.name)) return null;

                    const firstValue = primaryNode.params[param.name];
                    const isMixed = selectedNodes.length > 1 && !selectedNodes.every(n => JSON.stringify(n.params[param.name]) === JSON.stringify(firstValue));
                    const isInputConnected = graphConnections.some(c => c.toNodeId === primaryNode.id && c.toInput === param.name);
                    
                    const labelPrefix = param.modulatable ? (
                        <ModulatorButton 
                            isExposed={(primaryNode.params.exposedInputs || []).includes(param.name)} 
                            onToggle={() => onToggleInput(primaryNode.id, param.name)} 
                            paramName={param.name} 
                        />
                    ) : undefined;

                    // Connected Input State (Read-Only)
                    if (isInputConnected && param.modulatable) {
                        const liveValue = soundNodeOutputs[primaryNode.id]?.[param.name];
                        const displayValue = liveValue !== undefined && typeof liveValue === 'number' ? liveValue.toFixed(3) : '...';
                        return (
                            <div key={param.name} className="py-2 relative">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm flex items-center gap-2 text-gray-300">
                                        {labelPrefix}
                                        <span className="truncate" title={param.label}>{param.label}</span>
                                    </label>
                                    <div className="w-20 text-right font-mono text-cyan-300 text-sm py-1 px-2">{displayValue}</div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        );
                    }

                    // Controls
                    switch (param.type) {
                        case 'number':
                        case 'slider':
                            return (
                                <ParamSlider
                                    key={param.name}
                                    param={param}
                                    value={firstValue}
                                    onChange={v => onChange(param.name, v)}
                                    onHighFrequencyChange={v => onChange(param.name, v)}
                                    labelPrefix={labelPrefix}
                                    overrideInputText={isMixed ? 'Mixed' : undefined}
                                />
                            );
                        case 'select':
                        case 'connection_select':
                        case 'planet_select':
                            const changeHandler = (param.name === 'preset' && (primaryNode.type === 'Reverb' || primaryNode.type === 'Cross-Oscillator')) 
                                ? onPresetChange 
                                : (val: any) => onChange(param.name, val);
                            return (
                                <ParamSelect
                                    key={param.name}
                                    param={param}
                                    value={firstValue}
                                    onChange={changeHandler}
                                    labelPrefix={labelPrefix}
                                    isMixed={isMixed}
                                    connections={connections}
                                    planetNodes={planetNodes}
                                />
                            );
                        case 'multi-select-checkbox':
                            // Dynamic Group Renaming for DataSource
                            let checkboxParam = param;
                            if (primaryNode.type === 'DataSource' && param.name === 'activeOutputs') {
                                let dynamicOptions = JSON.parse(JSON.stringify(param.options));

                                if (primaryNode.params.sourceType === 'planet') {
                                    // Single Planet Mode
                                    const planetId = primaryNode.params.planetId;
                                    const planetName = planetNodes.find(n => n.id === planetId)?.name || "Select Planet";
                                    
                                    // Filter to keep only Source Body (renamed) and Interaction
                                    dynamicOptions = dynamicOptions.filter((group: any) => 
                                        group.group === 'Source Body'
                                    );

                                    dynamicOptions.forEach((group: any) => {
                                        if (group.group === 'Source Body') group.group = planetName;
                                    });
                                } else {
                                    // Connection Mode
                                    const connIndex = primaryNode.params.connectionIndex;
                                    if (connIndex !== undefined && connIndex !== null && connections[connIndex]) {
                                        const conn = connections[connIndex];
                                        const fromName = planetNodes.find(n => n.id === conn.from)?.name || "Source";
                                        const toName = planetNodes.find(n => n.id === conn.to)?.name || "Target";
                                        
                                        dynamicOptions.forEach((group: any) => {
                                            if (group.group === 'Source Body') group.group = `${fromName}`;
                                            if (group.group === 'Target Body') group.group = `${toName}`;
                                        });
                                    }
                                }
                                checkboxParam = { ...param, options: dynamicOptions };
                            }
                            // If not DataSource (e.g. Interaction), we just pass it through

                            return (
                                <ParamCheckboxGroup
                                    key={param.name}
                                    param={checkboxParam}
                                    value={firstValue}
                                    onChange={v => onChange(param.name, v)}
                                    labelPrefix={labelPrefix}
                                    isMixed={isMixed}
                                    nodeId={primaryNode.id}
                                />
                            );
                        default:
                            return null;
                    }
                })}
        </>
    );
};