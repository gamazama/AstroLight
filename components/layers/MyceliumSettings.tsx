
import React from 'react';
import Slider from '../shared/Slider';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../../initialState';

interface MyceliumSettingsProps {
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
}

const MyceliumSettings: React.FC<MyceliumSettingsProps> = ({ handleMouseEnter, handleMouseLeave }) => {
    const { visuals, adjustParameter } = useAppStore(state => ({
        visuals: {
            myceliumFlowSpeed: state.myceliumFlowSpeed,
            myceliumFlowIntensity: state.myceliumFlowIntensity,
            myceliumWiggleSpeed: state.myceliumWiggleSpeed,
            myceliumPulseDensity: state.myceliumPulseDensity,
            myceliumDisplacement: state.myceliumDisplacement,
            myceliumDisplacementScale: state.myceliumDisplacementScale,
            myceliumNoiseScale: state.myceliumNoiseScale,
            myceliumTextureSpeed: state.myceliumTextureSpeed,
            myceliumTextureStretch: state.myceliumTextureStretch,
            myceliumPulseWidth: state.myceliumPulseWidth,
            myceliumVisualActivity: state.myceliumVisualActivity,
            myceliumGlow: state.myceliumGlow,
        },
        adjustParameter: state.actions.adjustParameter,
    }), shallow);

    return (
        <div className="pt-2 px-2 pb-3 space-y-4">
            
            {/* Group 1: Displacement */}
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">1. Displacement</h3>
                <Slider
                    label="Amount"
                    value={visuals.myceliumDisplacement}
                    min={0} max={3} step={0.001}
                    onChange={(v) => adjustParameter({ myceliumDisplacement: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ myceliumDisplacement: v })}
                    onReset={() => adjustParameter({ myceliumDisplacement: initialVisualsState.myceliumDisplacement })}
                />
                {visuals.myceliumDisplacement > 0 && (
                    <div className="pl-2 border-l border-white/10 mt-1">
                         <Slider
                            label="Speed"
                            value={visuals.myceliumWiggleSpeed}
                            min={0} max={5} step={0.01}
                            onChange={(v) => adjustParameter({ myceliumWiggleSpeed: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumWiggleSpeed: v })}
                            onReset={() => adjustParameter({ myceliumWiggleSpeed: initialVisualsState.myceliumWiggleSpeed })}
                        />
                        <Slider
                            label="Scale"
                            value={visuals.myceliumDisplacementScale}
                            min={0.1} max={5} step={0.001}
                            onChange={(v) => adjustParameter({ myceliumDisplacementScale: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumDisplacementScale: v })}
                            onReset={() => adjustParameter({ myceliumDisplacementScale: initialVisualsState.myceliumDisplacementScale })}
                        />
                    </div>
                )}
            </div>

            {/* Group 2: Texture (Structure) */}
            <div className="border-t border-white/10 pt-3">
                 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">2. Strand Texture</h3>
                <Slider
                    label="Intensity"
                    value={visuals.myceliumVisualActivity}
                    min={0} max={2} step={0.01}
                    onChange={(v) => adjustParameter({ myceliumVisualActivity: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ myceliumVisualActivity: v })}
                    onReset={() => adjustParameter({ myceliumVisualActivity: initialVisualsState.myceliumVisualActivity })}
                />
                {visuals.myceliumVisualActivity > 0 && (
                    <div className="pl-2 border-l border-white/10 mt-1">
                        <Slider
                            label="Scale"
                            value={visuals.myceliumNoiseScale}
                            min={0.1} max={100} step={0.1}
                            onChange={(v) => adjustParameter({ myceliumNoiseScale: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumNoiseScale: v })}
                            onReset={() => adjustParameter({ myceliumNoiseScale: initialVisualsState.myceliumNoiseScale })}
                            logarithmic
                            logMin={0.1}
                            logMax={100}
                        />
                        <Slider
                            label="Stretch"
                            value={visuals.myceliumTextureStretch}
                            min={0.1} max={20} step={0.1}
                            onChange={(v) => adjustParameter({ myceliumTextureStretch: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumTextureStretch: v })}
                            onReset={() => adjustParameter({ myceliumTextureStretch: initialVisualsState.myceliumTextureStretch })}
                            logarithmic
                            logMin={0.1}
                            logMax={20}
                        />
                        <Slider
                            label="Morph Speed"
                            value={visuals.myceliumTextureSpeed}
                            min={0} max={5} step={0.01}
                            onChange={(v) => adjustParameter({ myceliumTextureSpeed: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumTextureSpeed: v })}
                            onReset={() => adjustParameter({ myceliumTextureSpeed: initialVisualsState.myceliumTextureSpeed })}
                        />
                    </div>
                )}
            </div>

            {/* Group 3: Flow (Pulses) */}
            <div className="border-t border-white/10 pt-3">
                 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">3. Nutrient Flow</h3>
                <Slider
                    label="Intensity"
                    value={visuals.myceliumFlowIntensity}
                    min={0} max={1} step={0.01}
                    onChange={(v) => adjustParameter({ myceliumFlowIntensity: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ myceliumFlowIntensity: v })}
                    onReset={() => adjustParameter({ myceliumFlowIntensity: initialVisualsState.myceliumFlowIntensity })}
                />
                {visuals.myceliumFlowIntensity > 0 && (
                    <div className="pl-2 border-l border-white/10 mt-1">
                         <Slider
                            label="Speed"
                            value={visuals.myceliumFlowSpeed}
                            min={0} max={20} step={0.01}
                            onChange={(v) => adjustParameter({ myceliumFlowSpeed: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumFlowSpeed: v })}
                            onReset={() => adjustParameter({ myceliumFlowSpeed: initialVisualsState.myceliumFlowSpeed })}
                        />
                        <Slider
                            label="Density"
                            value={visuals.myceliumPulseDensity}
                            min={0.1} max={3} step={0.01}
                            onChange={(v) => adjustParameter({ myceliumPulseDensity: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumPulseDensity: v })}
                            onReset={() => adjustParameter({ myceliumPulseDensity: initialVisualsState.myceliumPulseDensity })}
                        />
                        <Slider
                            label="Width"
                            value={visuals.myceliumPulseWidth}
                            min={0.001} max={1.0} step={0.001}
                            onChange={(v) => adjustParameter({ myceliumPulseWidth: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ myceliumPulseWidth: v })}
                            onReset={() => adjustParameter({ myceliumPulseWidth: initialVisualsState.myceliumPulseWidth })}
                            logarithmic
                            logMin={0.001}
                            logMax={1.0}
                        />
                    </div>
                )}
            </div>
            
             {/* Global Settings */}
             <div className="border-t border-white/10 pt-3">
                <Slider
                    label="Glow Boost"
                    value={visuals.myceliumGlow}
                    min={0} max={5} step={0.1}
                    onChange={(v) => adjustParameter({ myceliumGlow: v })}
                    onHighFrequencyChange={(v) => adjustParameter({ myceliumGlow: v })}
                    onReset={() => adjustParameter({ myceliumGlow: initialVisualsState.myceliumGlow })}
                />
             </div>
        </div>
    );
};

export default MyceliumSettings;
