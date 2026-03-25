


import React from 'react';
import type { PlanetNode, Connection } from '../../types/simulation';
import { calculateSynodicPeriod } from '../../utils/celestialCalculations';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

interface ConnectionItemProps {
    connection: Connection;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    isExpandable: boolean;
    showDelete: boolean;
    showColor: boolean;
}

const ConnectionItem: React.FC<ConnectionItemProps> = (props) => {
    const { connection, index, isSelected, onSelect, isExpandable, showDelete, showColor } = props;
    
    const {
        planetNodes,
        removeConnection,
        openColorPicker,
        updateConnectionPersistence,
        resetConnectionToHarmonic,
        getCelestialBody,
        updateUI,
    } = useAppStore(state => ({
        planetNodes: state.planetNodes,
        removeConnection: state.actions.removeConnection,
        openColorPicker: state.actions.openColorPicker,
        updateConnectionPersistence: state.actions.updateConnectionPersistence,
        resetConnectionToHarmonic: state.actions.resetConnectionToHarmonic,
        getCelestialBody: state.actions.getCelestialBody,
        updateUI: state.actions.updateUI,
    }), shallow);
    
    const fromNode = planetNodes.find(n => n.id === connection.from);
    const toNode = planetNodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) return null;

    const fromPlanet = getCelestialBody(fromNode.name);
    const toPlanet = getCelestialBody(toNode.name);
    
    const synodicPeriod = fromPlanet && toPlanet ? calculateSynodicPeriod(fromPlanet.period, toPlanet.period) : 0;
    const tooltip = "The Synodic Period. This is the time it takes for the two planets to return to the same relative position. The pattern will start to repeat after this duration.";

    const onMouseEnter = (e: React.MouseEvent, content: string) => {
        updateUI({ tooltip: { x: e.pageX, y: e.pageY, content } });
    };
    const onMouseLeave = () => {
        updateUI({ tooltip: null });
    };

    return (
        <div className="flex flex-col p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200" >
            <div 
                className={`flex items-center justify-between ${isExpandable ? 'cursor-pointer' : ''}`}
                onClick={isExpandable ? onSelect : undefined}
            >
                <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1.5" id={`connection-from-${connection.id}`}><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: fromNode.color}}></div>{fromNode.name}</span>
                    <span>↔</span>
                    <span className="flex items-center gap-1.5" id={`connection-to-${connection.id}`}><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: toNode.color}}></div>{toNode.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {showColor && (
                        <div 
                            className="w-6 h-6 rounded-md cursor-pointer border border-white/30"
                            style={{ backgroundColor: connection.color }}
                            onClick={(e) => { e.stopPropagation(); openColorPicker({ type: 'connection', index }, e, connection.color); }}
                        ></div>
                    )}
                    {showDelete && (
                        <button 
                            id={`trash-icon-${connection.id}`}
                            onClick={(e) => { e.stopPropagation(); removeConnection(index); }} 
                            className="w-6 h-6 bg-transparent rounded-md flex items-center justify-center text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            
            {isSelected && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-white/10">
                     <span 
                        className="text-gray-400 underline decoration-dotted cursor-help"
                        onMouseEnter={(e) => { e.stopPropagation(); onMouseEnter(e, tooltip); }}
                        onMouseLeave={(e) => { e.stopPropagation(); onMouseLeave(); }}
                    >
                        Sync: {synodicPeriod.toFixed(0)}d
                    </span>
                     <div className="flex items-center gap-1.5">
                        <label className="text-gray-400">Persistence:</label>
                        <input
                            type="number"
                            id="connection-persistence-input"
                            value={connection.persistenceMultiplier}
                            onChange={(e) => updateConnectionPersistence(index, Math.max(0, parseFloat(e.target.value) || 0))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-1 py-0.5 bg-white/10 border border-white/20 rounded-md text-white text-center"
                            step="0.1"
                            min="0"
                            title="Multiplier of the synodic period. Higher values make lines stay longer."
                        />
                         <span className="text-gray-400">x</span>
                         <button 
                            id="harmonic-wand-btn"
                            onClick={(e) => { e.stopPropagation(); resetConnectionToHarmonic(index); }} 
                            className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center text-xs hover:bg-indigo-500/50" 
                            title="Magic Wand: Reset to ideal harmonic value based on orbital resonance."
                        >
                            ✨
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionItem;