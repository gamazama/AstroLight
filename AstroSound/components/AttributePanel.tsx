import React, { useMemo, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { ALL_NODE_TYPES } from './nodeTypes';
import type { SoundNode } from '../types';
import { AttributePanelHeader } from './AttributePanelHeader';
import { ParameterList } from './ParameterList';

const AttributePanel: React.FC<{isOpen: boolean}> = ({isOpen}) => {
    const { selectedNodeIds, graph, openColorPicker, updateNodeParam, toggleNodeInput, connections, planetNodes, soundNodeOutputs, clippingOutputs } = useAppStore(state => ({
        selectedNodeIds: state.soundCreator.selectedNodeIds,
        graph: state.graph,
        openColorPicker: state.actions.openColorPicker,
        updateNodeParam: state.actions.updateNodeParam,
        toggleNodeInput: state.actions.toggleNodeInput,
        connections: state.connections,
        planetNodes: state.planetNodes,
        soundNodeOutputs: state.soundNodeOutputs,
        clippingOutputs: state.clippingOutputs,
    }), shallow);
    
    const contentRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const selectedNodes = useMemo(() => 
        selectedNodeIds.map(id => graph.nodes.find(n => n.id === id)).filter((n): n is SoundNode => !!n),
        [selectedNodeIds, graph.nodes]
    );

    const primaryNode = selectedNodes.length > 0 ? selectedNodes[selectedNodes.length - 1] : null;
    const nodeDef = primaryNode ? ALL_NODE_TYPES.find(def => def.type === primaryNode.type) : null;
    const allSameType = useMemo(() => selectedNodes.length <= 1 || selectedNodes.every(n => n.type === primaryNode?.type), [selectedNodes, primaryNode]);

    const handleMultiNodeParamChange = (paramName: string, value: any) => {
        selectedNodeIds.forEach(id => {
            const nodeToUpdate = graph.nodes.find(n => n.id === id);
            const nodeDefToUpdate = nodeToUpdate ? ALL_NODE_TYPES.find(def => def.type === nodeToUpdate.type) : null;
            // Only update if the node actually has this parameter
            if (nodeDefToUpdate?.parameters.some(p => p.name === paramName) || ['customName', 'displayColor', 'isBypassed'].includes(paramName)) {
                updateNodeParam(id, paramName, value);
            }
        });

        // Special handling for presets to reset to 'custom' when individual params change
        if (primaryNode && (primaryNode.type === 'Reverb' || primaryNode.type === 'Cross-Oscillator') && paramName !== 'preset') {
            handleMultiNodeParamChange('preset', 'custom');
        }
    };
    
    const handlePresetChange = (presetValue: string) => {
        handleMultiNodeParamChange('preset', presetValue);
        
        if (presetValue === 'custom' || !primaryNode) return;

        if (primaryNode.type === 'Reverb') {
            const presets = { 'small_room': { decay: 0.3, mix: 0.2, damping: 0.7, size: 0.5 }, 'hall': { decay: 0.8, mix: 0.4, damping: 0.3, size: 0.9 }, 'space_ambient': { decay: 0.9, mix: 0.5, damping: 0.1, size: 1.0 }};
            const presetValues = (presets as any)[presetValue];
            if (presetValues) Object.entries(presetValues).forEach(([key, value]) => handleMultiNodeParamChange(key, value));
        }
        if (primaryNode.type === 'Cross-Oscillator') {
            const presets = { 'warm_saw': { waveform: 'sawtooth', unisonVoices: 1, syncEnabled: false, fmEnabled: false, fmWaveform: 'sine', subOctave: 'off', amplitude: 0.5 }, 'supersaw_lead': { waveform: 'sawtooth', unisonVoices: 8, unisonSpread: 0.2, syncEnabled: false, fmEnabled: false, fmWaveform: 'sine', subOctave: '-1', subLevel: 0.3, amplitude: 0.4 }, 'hard_sync_bass': { waveform: 'sawtooth', frequency: 110, unisonVoices: 1, syncEnabled: true, syncRatio: 1.5, fmEnabled: false, fmWaveform: 'sine', subOctave: '-1', subLevel: 0.5, amplitude: 0.6 }, 'fm_bell': { waveform: 'sine', frequency: 523.25, unisonVoices: 1, syncEnabled: false, fmEnabled: true, fmWaveform: 'sine', fmRatio: 1.4, fmAmount: 400, subOctave: 'off', amplitude: 0.6 }, 'rich_pad': { waveform: 'sawtooth', unisonVoices: 6, unisonSpread: 0.15, syncEnabled: false, fmEnabled: false, fmWaveform: 'sine', subOctave: '-1', subLevel: 0.4, amplitude: 0.4 } };
            const presetValues = (presets as any)[presetValue];
            if (presetValues) Object.entries(presetValues).forEach(([key, value]) => handleMultiNodeParamChange(key, value));
        }
    };

    return (
        <div ref={panelRef} className={`fixed top-0 right-0 h-screen w-80 dynamic-blur border-l border-white/10 shadow-lg transition-transform duration-300 ease-in-out z-20 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {primaryNode && nodeDef ? (
                <>
                    <AttributePanelHeader
                        primaryNode={primaryNode}
                        selectedNodes={selectedNodes}
                        nodeDef={nodeDef}
                        onNameChange={val => handleMultiNodeParamChange('customName', val)}
                        onColorChange={e => openColorPicker({ type: 'soundNodeDisplay', nodeId: primaryNode.id }, e, primaryNode.params.displayColor || '#4a5568')}
                        onBypassToggle={() => handleMultiNodeParamChange('isBypassed', !primaryNode.params.isBypassed)}
                    />

                    <div ref={contentRef} className="overflow-y-auto custom-scroll flex-grow p-4">
                         <ParameterList
                            primaryNode={primaryNode}
                            selectedNodes={selectedNodes}
                            nodeDef={nodeDef}
                            allSameType={allSameType}
                            connections={connections}
                            planetNodes={planetNodes}
                            soundNodeOutputs={soundNodeOutputs}
                            clippingOutputs={clippingOutputs}
                            graphConnections={graph.connections}
                            onChange={handleMultiNodeParamChange}
                            onPresetChange={handlePresetChange}
                            onToggleInput={toggleNodeInput}
                        />
                    </div>
                </>
            ) : (
                <div className="p-4">
                    <h3 className="font-bold mb-4">Attributes</h3>
                    <p className="text-sm text-gray-400">{selectedNodeIds.length > 1 ? `${selectedNodeIds.length} nodes selected.` : 'Select a node to view its properties.'}</p>
                </div>
            )}
        </div>
    );
};

export default AttributePanel;
