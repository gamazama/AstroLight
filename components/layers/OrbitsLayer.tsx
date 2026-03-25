
import React from 'react';
import LayerItem from './LayerItem';
import Slider from '../shared/Slider';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../../initialState';

// Icons
const OrbitsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93L17.66 6.34C18.17 6.85 18.5 7.55 18.5 8.32C18.5 10.53 15.59 12.32 12 12.32C8.41 12.32 5.5 10.53 5.5 8.32C5.5 7.55 5.83 6.85 6.34 6.34L4.93 4.93C3.73 6.13 3 7.79 3 9.62C3 13.49 7.03 16.62 12 16.62C16.97 16.62 21 13.49 21 9.62C21 7.79 20.27 6.13 19.07 4.93Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.93 19.07L6.34 17.66C5.83 17.15 5.5 16.45 5.5 15.68C5.5 13.47 8.41 11.68 12 11.68C15.59 11.68 18.5 13.47 18.5 15.68C18.5 16.45 18.17 17.15 17.66 17.66L19.07 19.07C20.27 17.87 21 16.21 21 14.38C21 10.51 16.97 7.38 12 7.38C7.03 7.38 3 10.51 3 14.38C3 16.21 3.73 17.87 4.93 19.07Z" />
    </svg>
);

const PlanetsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 12h16.8M12 3.6v16.8" style={{ opacity: 0.3 }} />
    </svg>
);

const LabelsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;

const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>; // Slider icon


interface OrbitsLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
    isPlanetsExpanded: boolean;
    onTogglePlanetsExpand: () => void;
    isLabelsExpanded: boolean;
    onToggleLabelsExpand: () => void;
    // New Props
    isOrbitSettingsExpanded: boolean;
    onToggleOrbitSettingsExpand: () => void;
    
    tooltips: { [key: string]: string };
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
    animate: boolean;
}

const OrbitsLayer: React.FC<OrbitsLayerProps> = (props) => {
    const { 
        isExpanded, onToggleExpand, onHeaderClick, 
        isPlanetsExpanded, onTogglePlanetsExpand, 
        isLabelsExpanded, onToggleLabelsExpand, 
        isOrbitSettingsExpanded, onToggleOrbitSettingsExpand,
        tooltips, handleMouseEnter, handleMouseLeave, animate 
    } = props;

    const {
        visuals,
        adjustParameter,
        openColorPicker,
    } = useAppStore(state => ({
        visuals: {
            showOrbits: state.showOrbits,
            orbitColor: state.orbitColor,
            targetZOffset: state.targetZOffset,
            showPlanets: state.showPlanets,
            planetSizeMultiplier: state.planetSizeMultiplier,
            planetOpacity: state.planetOpacity,
            showUnconnectedPlanets: state.showUnconnectedPlanets,
            showLabels: state.showLabels,
            labelColor: state.labelColor,
            labelFontSize: state.labelFontSize,
            labelOpacity: state.labelOpacity,
            showUnconnectedLabels: state.showUnconnectedLabels,
            // New properties
            orbitLineWidth: state.orbitLineWidth,
            orbitOpacity: state.orbitOpacity,
            connectedOrbitOpacity: state.connectedOrbitOpacity,
            orbitBlendMode: state.orbitBlendMode,
        },
        adjustParameter: state.actions.adjustParameter,
        openColorPicker: state.actions.openColorPicker,
    }), shallow);
    
    const blendOptions: Record<string, string> = {
        'lighter': 'Lighter (Additive)',
        'multiply': 'Multiply',
        'source-over': 'Normal',
        'screen': 'Screen',
    };

    return (
        <LayerItem
            label="Orbits"
            icon={<OrbitsIcon />}
            isVisible={visuals.showOrbits}
            onToggleVisibility={() => adjustParameter({ showOrbits: !visuals.showOrbits })}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
            className={animate ? 'animate-layer-reveal' : ''}
            rightAccessory={
                <div 
                    className="w-6 h-6 rounded-md border border-white/30 cursor-pointer"
                    style={{ backgroundColor: visuals.orbitColor }}
                    onClick={(e) => { e.stopPropagation(); openColorPicker({ type: 'background', key: 'orbitColor' }, e, visuals.orbitColor); }}
                ></div>
            }
        >
            <div className="p-2 pb-3 space-y-1">
                {/* Moved Z Offset to main layer */}
                <div id="orbit-z-offset-control" className="px-2 pb-2 mb-2 border-b border-white/10">
                    <Slider
                        label="Orbit Offset (Z)"
                        value={visuals.targetZOffset}
                        min={-2000} max={2000}
                        onChange={(v) => adjustParameter({ targetZOffset: v })}
                        onHighFrequencyChange={(v) => adjustParameter({ targetZOffset: v })}
                        onReset={() => adjustParameter({ targetZOffset: initialVisualsState.targetZOffset })}
                    />
                </div>

                <LayerItem
                    label="Planets"
                    icon={<PlanetsIcon />}
                    isVisible={visuals.showPlanets}
                    onToggleVisibility={() => adjustParameter({ showPlanets: !visuals.showPlanets })}
                    isExpandable
                    isExpanded={isPlanetsExpanded}
                    onToggleExpand={onTogglePlanetsExpand}
                >
                    <div className="pt-2 px-2 pb-3">
                        <Slider
                            label="Planet Size"
                            value={visuals.planetSizeMultiplier}
                            min={0.1} max={5} step={0.1}
                            onChange={(v) => adjustParameter({ planetSizeMultiplier: v })}
                            onReset={() => adjustParameter({ planetSizeMultiplier: initialVisualsState.planetSizeMultiplier })}
                        />
                        <Slider
                            label="Planet Opacity"
                            value={visuals.planetOpacity}
                            min={0} max={1} step={0.01}
                            onChange={(v) => adjustParameter({ planetOpacity: v })}
                            onReset={() => adjustParameter({ planetOpacity: initialVisualsState.planetOpacity })}
                        />
                        
                         <div className="flex items-center justify-between py-2 mt-2 border-t border-white/10">
                            <label className="text-sm text-gray-300">Show Unconnected</label>
                             <div 
                                onClick={() => adjustParameter({ showUnconnectedPlanets: !visuals.showUnconnectedPlanets })}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${visuals.showUnconnectedPlanets ? 'bg-indigo-500' : 'bg-white/20'}`}
                             >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${visuals.showUnconnectedPlanets ? 'translate-x-5' : 'translate-x-0'}`} />
                             </div>
                         </div>
                    </div>
                </LayerItem>

                <LayerItem
                    label="Labels"
                    icon={<LabelsIcon />}
                    isVisible={visuals.showLabels}
                    onToggleVisibility={() => adjustParameter({ showLabels: !visuals.showLabels })}
                    isExpandable
                    isExpanded={isLabelsExpanded}
                    onToggleExpand={onToggleLabelsExpand}
                    rightAccessory={
                        <div 
                            className="w-6 h-6 rounded-md border border-white/30 cursor-pointer"
                            style={{ backgroundColor: visuals.labelColor }}
                            onClick={(e) => { e.stopPropagation(); openColorPicker({ type: 'background', key: 'labelColor' }, e, visuals.labelColor); }}
                        ></div>
                    }
                >
                    <div className="pt-2 px-2 pb-3">
                        <Slider
                            label="Font Size"
                            value={visuals.labelFontSize}
                            min={6} max={24} step={1}
                            onChange={(v) => adjustParameter({ labelFontSize: v })}
                            onReset={() => adjustParameter({ labelFontSize: initialVisualsState.labelFontSize })}
                        />
                        <Slider
                            label="Label Opacity"
                            value={visuals.labelOpacity}
                            min={0} max={1} step={0.01}
                            onChange={(v) => adjustParameter({ labelOpacity: v })}
                            onReset={() => adjustParameter({ labelOpacity: initialVisualsState.labelOpacity })}
                        />
                        <div className="flex items-center justify-between py-2 border-t border-white/10 mt-2">
                            <label className="text-sm text-gray-300">Show Unconnected</label>
                             <div 
                                onClick={() => adjustParameter({ showUnconnectedLabels: !visuals.showUnconnectedLabels })}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${visuals.showUnconnectedLabels ? 'bg-indigo-500' : 'bg-white/20'}`}
                             >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${visuals.showUnconnectedLabels ? 'translate-x-5' : 'translate-x-0'}`} />
                             </div>
                        </div>
                    </div>
                </LayerItem>

                <LayerItem
                    label="Orbit Line Settings"
                    icon={<SettingsIcon />}
                    isVisible={true}
                    hideVisibilityToggle={true}
                    isExpandable
                    isExpanded={isOrbitSettingsExpanded}
                    onToggleExpand={onToggleOrbitSettingsExpand}
                >
                    <div className="pt-2 px-2 pb-3">
                        <Slider
                            label="Line Width"
                            value={visuals.orbitLineWidth}
                            min={0.1} max={10} step={0.1}
                            onChange={(v) => adjustParameter({ orbitLineWidth: v })}
                            onReset={() => adjustParameter({ orbitLineWidth: initialVisualsState.orbitLineWidth })}
                        />
                         <Slider
                            label="Unconnected Opacity"
                            value={visuals.orbitOpacity}
                            min={0} max={1} step={0.01}
                            onChange={(v) => adjustParameter({ orbitOpacity: v })}
                            onReset={() => adjustParameter({ orbitOpacity: initialVisualsState.orbitOpacity })}
                        />
                        <Slider
                            label="Connected Opacity"
                            value={visuals.connectedOrbitOpacity}
                            min={0} max={1} step={0.01}
                            onChange={(v) => adjustParameter({ connectedOrbitOpacity: v })}
                            onReset={() => adjustParameter({ connectedOrbitOpacity: initialVisualsState.connectedOrbitOpacity })}
                        />
                         <div className="mt-3">
                            <label className="text-sm flex justify-between items-center mb-2 text-gray-300">
                                <span>Blend Mode</span>
                            </label>
                            <select
                                value={visuals.orbitBlendMode}
                                onChange={(e) => adjustParameter({ orbitBlendMode: e.target.value as GlobalCompositeOperation })}
                                className="w-full px-2 py-1.5 bg-black/30 border border-white/20 rounded-md text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#667eea]"
                            >
                                {Object.entries(blendOptions).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </LayerItem>
            </div>
        </LayerItem>
    );
};

export default OrbitsLayer;
