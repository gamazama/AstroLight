import React from 'react';
import LayerItem from './LayerItem';
import Slider from '../shared/Slider';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState, initialSimulationState } from '../../initialState';

const AdvancedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l-1.414-1.414M6.05 6.05l-1.414-1.414m12.728 0l-1.414 1.414M6.05 17.95l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

interface AdvancedLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
}

const AdvancedLayer: React.FC<AdvancedLayerProps> = ({ isExpanded, onToggleExpand, onHeaderClick }) => {
    const { visuals, simulation, adjustParameter } = useAppStore(state => ({
        visuals: {
            targetZoom: state.targetZoom,
            tilt: state.tilt,
            rotation: state.rotation,
            lineOpacityMultiplier: state.lineOpacityMultiplier,
            orbitOpacity: state.orbitOpacity,
            connectedOrbitOpacity: state.connectedOrbitOpacity,
        },
        simulation: {
            sceneScale: state.sceneScale,
        },
        adjustParameter: state.actions.adjustParameter,
    }), shallow);

    return (
        <LayerItem
            label="Advanced"
            icon={<AdvancedIcon />}
            isVisible={true}
            hideVisibilityToggle={true}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
        >
            <div className="pt-2 px-2 pb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Camera Overrides</h3>
                <Slider
                    label="Zoom"
                    value={visuals.targetZoom}
                    min={0.01} max={100}
                    onChange={(v) => adjustParameter({ targetZoom: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ targetZoom: v })}
                    onReset={() => adjustParameter({ targetZoom: initialVisualsState.targetZoom })}
                    logarithmic
                />
                <Slider
                    label="Tilt"
                    value={visuals.tilt}
                    min={-180} max={180} step={0.1}
                    onChange={(v) => adjustParameter({ tilt: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ tilt: v })}
                    onReset={() => adjustParameter({ tilt: initialVisualsState.tilt })}
                />
                <Slider
                    label="Rotation"
                    value={visuals.rotation}
                    min={-180} max={180} step={0.1}
                    onChange={(v) => adjustParameter({ rotation: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ rotation: v })}
                    onReset={() => adjustParameter({ rotation: initialVisualsState.rotation })}
                />
                 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Advanced Line Properties</h3>
                <Slider
                    label="Line Opacity Multiplier"
                    value={visuals.lineOpacityMultiplier}
                    min={0.01} max={2} step={0.01}
                    onChange={(v) => adjustParameter({ lineOpacityMultiplier: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ lineOpacityMultiplier: v })}
                    onReset={() => adjustParameter({ lineOpacityMultiplier: initialVisualsState.lineOpacityMultiplier })}
                    logarithmic
                    logMin={0.01}
                    logMax={2}
                />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Advanced Orbit Properties</h3>
                <Slider
                    label="Orbit Opacity"
                    value={visuals.orbitOpacity}
                    min={0} max={1} step={0.01}
                    onChange={(v) => adjustParameter({ orbitOpacity: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ orbitOpacity: v })}
                    onReset={() => adjustParameter({ orbitOpacity: initialVisualsState.orbitOpacity })}
                />
                <Slider
                    label="Connected Orbit Opacity"
                    value={visuals.connectedOrbitOpacity}
                    min={0} max={1} step={0.01}
                    onChange={(v) => adjustParameter({ connectedOrbitOpacity: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ connectedOrbitOpacity: v })}
                    onReset={() => adjustParameter({ connectedOrbitOpacity: initialVisualsState.connectedOrbitOpacity })}
                />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Physics</h3>
                 <Slider
                    label="Scene Scale"
                    value={simulation.sceneScale}
                    min={0.1} max={10} step={0.01}
                    onChange={(v) => adjustParameter({ sceneScale: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ sceneScale: v })}
                    onReset={() => adjustParameter({ sceneScale: initialSimulationState.sceneScale })}
                    logarithmic
                />
            </div>
        </LayerItem>
    );
};

export default AdvancedLayer;