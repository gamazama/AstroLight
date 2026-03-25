
import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import LayerItem from '../../components/layers/LayerItem';
import Slider from '../../components/shared/Slider';

const SoundOnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

// Node / Microchip icon for "Main Canvas"
const NodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface SoundLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
}

const SoundLayer: React.FC<SoundLayerProps> = ({ isExpanded, onToggleExpand, onHeaderClick }) => {
    const { 
        isSoundEnabled,
        masterVolume,
        instruments,
        activeInstrumentInstances,
        graph,
        connections,
        planetNodes,
        toggleSound,
        updateSound,
        addInstrumentInstance,
        openInstrumentDataModal,
        removeInstrumentInstance,
        updateInstrumentParam,
        updateInstrumentDataSource,
        updateUI,
        updateNodeParam,
    } = useAppStore(state => ({
        isSoundEnabled: state.isSoundEnabled,
        masterVolume: state.masterVolume,
        instruments: state.instruments,
        activeInstrumentInstances: state.activeInstrumentInstances,
        graph: state.graph,
        connections: state.connections,
        planetNodes: state.planetNodes,
        toggleSound: state.actions.toggleSound,
        updateSound: state.actions.updateSound,
        addInstrumentInstance: state.actions.addInstrumentInstance,
        openInstrumentDataModal: state.actions.openInstrumentDataModal,
        removeInstrumentInstance: state.actions.removeInstrumentInstance,
        updateInstrumentParam: state.actions.updateInstrumentParam,
        updateInstrumentDataSource: state.actions.updateInstrumentDataSource,
        updateUI: state.actions.updateUI,
        updateNodeParam: state.actions.updateNodeParam,
    }), shallow);
    
    const [selectedInstrumentName, setSelectedInstrumentName] = useState<string>('');
    const [expandedInstances, setExpandedInstances] = useState<Record<string, boolean>>({});

    const toggleInstance = (id: string) => {
        setExpandedInstances(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const instanceCounts: Record<string, number> = {};
    activeInstrumentInstances.forEach(inst => {
        instanceCounts[inst.instrumentName] = (instanceCounts[inst.instrumentName] || 0) + 1;
    });
    const instanceDisplayIndices: Record<string, number> = {};

    // Identify nodes that are NOT part of any instrument instance (i.e., the Main Canvas scratchpad)
    const instancePrefixes = activeInstrumentInstances.map(i => i.prefix);
    const mainCanvasNodes = graph.nodes.filter(n => n.id !== 'MASTER_OUTPUT' && !instancePrefixes.some(prefix => n.id.startsWith(prefix)));
    
    const mainCanvasParams = mainCanvasNodes.filter(n => n.type === 'Parameter');
    const mainCanvasDataSources = mainCanvasNodes.filter(n => n.type === 'DataSource');
    const hasMainCanvasControls = mainCanvasParams.length > 0 || mainCanvasDataSources.length > 0;

    // Default selection
    React.useEffect(() => {
        if (!selectedInstrumentName && instruments.length > 0) {
            setSelectedInstrumentName(instruments[0].name);
        }
    }, [instruments, selectedInstrumentName]);

    const handleAddInstrument = () => {
        if (selectedInstrumentName) {
            addInstrumentInstance(selectedInstrumentName);
            // Auto expand the new instance logic could go here if we had the new ID easily
        }
    };

    return (
        <LayerItem
            label={<>AstroSound™ Pro <sup className="text-xs font-semibold tracking-wider opacity-80">BETA</sup></>}
            icon={<SoundOnIcon />}
            isVisible={isSoundEnabled}
            onToggleVisibility={() => toggleSound(!isSoundEnabled)}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
        >
            <div className="pt-2 px-2 pb-3">
                <Slider
                    label="Master Volume"
                    value={masterVolume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => updateSound({ masterVolume: v })}
                    onReset={() => updateSound({ masterVolume: 0.5 })}
                    disabled={!isSoundEnabled}
                />

                <div className="my-3 py-2 border-t border-white/10 space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Add Instrument</h3>
                    
                    {instruments.length === 0 ? (
                        <div className="px-2 pb-2 text-center text-xs text-gray-500">
                            No instruments saved. Use "Save as Instrument" in the Sound Creator.
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <select
                                    value={selectedInstrumentName}
                                    onChange={(e) => setSelectedInstrumentName(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white text-sm appearance-none focus:outline-none focus:border-indigo-500"
                                >
                                    {instruments.map((inst) => (
                                        <option key={inst.name} value={inst.name}>
                                            {inst.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <button 
                                onClick={handleAddInstrument} 
                                disabled={!selectedInstrumentName}
                                className="px-3 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Add Instrument"
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    )}
                    {selectedInstrumentName && (
                         <p className="text-[10px] text-gray-400 px-1 truncate">
                            {instruments.find(i => i.name === selectedInstrumentName)?.description}
                         </p>
                    )}
                </div>

                <div className="my-3 py-2 border-t border-white/10 space-y-2">
                     <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Active Instances</h3>
                     
                     {/* Main Canvas "Virtual Instance" */}
                     {hasMainCanvasControls && (
                        <LayerItem
                            label="Main Canvas"
                            isVisible={true}
                            hideVisibilityToggle={true}
                            isExpandable={true}
                            isExpanded={expandedInstances['main_canvas']}
                            onToggleExpand={() => toggleInstance('main_canvas')}
                            className="mb-2 bg-indigo-900/20 border border-indigo-500/30"
                            rightAccessory={
                                <button onClick={(e) => { e.stopPropagation(); updateUI({ isSoundCreator2Open: true }); }} className="p-1 hover:bg-white/10 rounded-md text-gray-400" title="Edit Graph"><NodeIcon /></button>
                            }
                        >
                            <div className="p-2 space-y-2">
                                {mainCanvasParams.map(node => (
                                    <Slider
                                        key={node.id}
                                        label={node.params.customName || 'Parameter'}
                                        value={node.params.value}
                                        min={node.params.min}
                                        max={node.params.max}
                                        step={node.params.step}
                                        onChange={v => updateNodeParam(node.id, 'value', v)}
                                        logarithmic={node.params.log}
                                    />
                                ))}
                                {mainCanvasDataSources.map(node => (
                                    <div key={node.id} className="flex justify-between items-center">
                                        <label className="text-sm">{node.params.customName || 'Data Source'}</label>
                                        <select
                                            value={node.params.connectionIndex === null ? 'none' : node.params.connectionIndex}
                                            onChange={e => updateNodeParam(node.id, 'connectionIndex', e.target.value === 'none' ? null : parseInt(e.target.value))}
                                            className="w-32 px-2 py-1 bg-black/20 border border-white/20 rounded-md text-white text-xs"
                                        >
                                            <option value="none">None</option>
                                            {connections.map((conn, i) => {
                                                const from = planetNodes.find(n => n.id === conn.from)?.name;
                                                const to = planetNodes.find(n => n.id === conn.to)?.name;
                                                return <option key={i} value={i}>{`${from} ↔ ${to}`}</option>
                                            })}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </LayerItem>
                     )}

                     {activeInstrumentInstances.length === 0 && !hasMainCanvasControls ? (
                         <div className="px-2 pb-2 text-center text-xs text-gray-500">No active instruments.</div>
                     ) : (
                        <div className="space-y-2">
                            {activeInstrumentInstances.map(instance => {
                                const instrument = instruments.find(i => i.name === instance.instrumentName);
                                if (!instrument) return null;

                                instanceDisplayIndices[instance.instrumentName] = (instanceDisplayIndices[instance.instrumentName] || 0) + 1;
                                const displayName = instanceCounts[instance.instrumentName] > 1
                                    ? `${instance.instrumentName} #${instanceDisplayIndices[instance.instrumentName]}`
                                    : instance.instrumentName;

                                return (
                                    <LayerItem
                                        key={instance.id}
                                        label={displayName}
                                        isVisible={true}
                                        hideVisibilityToggle={true}
                                        isExpandable={true}
                                        isExpanded={expandedInstances[instance.id]}
                                        onToggleExpand={() => toggleInstance(instance.id)}
                                        className="bg-black/20 border border-white/10"
                                        rightAccessory={
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); openInstrumentDataModal(instrument); }} className="p-1 hover:bg-white/10 rounded-md text-gray-400" title="View Blueprint"><NodeIcon /></button>
                                                <button onClick={(e) => { e.stopPropagation(); removeInstrumentInstance(instance.id); }} className="p-1 hover:bg-red-500/20 text-red-300 rounded-md" title="Remove instance"><TrashIcon /></button>
                                            </>
                                        }
                                    >
                                        <div className="p-2 space-y-2">
                                            {instrument.parameters.map(param => {
                                                const paramNode = graph.nodes.find(n => n.id === `${instance.prefix}${param.nodeId}`);
                                                if (!paramNode) return null;
                                                return (
                                                        <Slider
                                                        key={param.nodeId}
                                                        label={param.label}
                                                        value={paramNode.params.value}
                                                        min={param.min}
                                                        max={param.max}
                                                        step={param.step}
                                                        onChange={v => updateInstrumentParam(instance.id, param.nodeId, v)}
                                                        onReset={() => updateInstrumentParam(instance.id, param.nodeId, param.defaultValue)}
                                                    />
                                                )
                                            })}
                                            {instrument.dataSources.map(ds => {
                                                const dsNode = graph.nodes.find(n => n.id === `${instance.prefix}${ds.nodeId}`);
                                                if (!dsNode) return null;
                                                return (
                                                    <div key={ds.nodeId} className="flex justify-between items-center">
                                                        <label className="text-sm text-gray-300">{ds.label}</label>
                                                        <select
                                                            value={dsNode.params.connectionIndex === null ? 'none' : dsNode.params.connectionIndex}
                                                            onChange={e => updateInstrumentDataSource(instance.id, ds.nodeId, e.target.value === 'none' ? -1 : parseInt(e.target.value))}
                                                            className="w-32 px-2 py-1 bg-black/20 border border-white/20 rounded-md text-white text-xs"
                                                        >
                                                            <option value="none">None</option>
                                                            {connections.map((conn, i) => {
                                                                const from = planetNodes.find(n => n.id === conn.from)?.name;
                                                                const to = planetNodes.find(n => n.id === conn.to)?.name;
                                                                return <option key={i} value={i}>{`${from} ↔ ${to}`}</option>
                                                            })}
                                                        </select>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </LayerItem>
                                );
                            })}
                        </div>
                     )}
                </div>

                 <div className="p-2 space-y-2">
                    <button
                        id="sound-creator-btn"
                        onClick={() => {
                            updateUI({ isSoundCreator2Open: true });
                            if (!isSoundEnabled) {
                                toggleSound(true);
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-[#667eea]/80 to-[#764ba2]/80 text-white font-semibold transition-transform hover:-translate-y-0.5 text-sm"
                    >
                        <>Open AstroSound™ Pro <sup className="text-[10px] font-semibold tracking-wider opacity-80 ml-0.5">BETA</sup></>
                    </button>
                </div>
            </div>
        </LayerItem>
    );
};

export default SoundLayer;
