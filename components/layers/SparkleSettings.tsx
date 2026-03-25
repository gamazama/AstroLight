
import React from 'react';
import Slider from '../shared/Slider';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../../initialState';

const SparkleSettings: React.FC = () => {
    const { visuals, adjustParameter } = useAppStore(state => ({
        visuals: {
            particleQuantity: state.particleQuantity,
            particleSize: state.particleSize,
            particleSpeed: state.particleSpeed,
            particleLifespan: state.particleLifespan,
            particleDrag: state.particleDrag,
            particleDiamondRatio: state.particleDiamondRatio,
            particleGlowGamma: state.particleGlowGamma,
        },
        adjustParameter: state.actions.adjustParameter,
    }), shallow);

    return (
        <div className="pt-2 px-2 pb-3">
            <Slider
                label="Sparkle Quantity"
                value={visuals.particleQuantity}
                min={1} max={200} step={1}
                onChange={(v) => adjustParameter({ particleQuantity: v })}
                onReset={() => adjustParameter({ particleQuantity: initialVisualsState.particleQuantity })}
            />
            <Slider
                label="Sparkle Size"
                value={visuals.particleSize}
                min={0.1} max={5} step={0.1}
                onChange={(v) => adjustParameter({ particleSize: v })}
                onReset={() => adjustParameter({ particleSize: initialVisualsState.particleSize })}
            />
            <Slider
                label="Sparkle Velocity"
                value={visuals.particleSpeed}
                min={0} max={5} step={0.1}
                onChange={(v) => adjustParameter({ particleSpeed: v })}
                onReset={() => adjustParameter({ particleSpeed: initialVisualsState.particleSpeed })}
            />
                <Slider
                label="Sparkle Lifespan (s)"
                value={visuals.particleLifespan}
                min={0.1} max={3.0} step={0.1}
                onChange={(v) => adjustParameter({ particleLifespan: v })}
                onReset={() => adjustParameter({ particleLifespan: initialVisualsState.particleLifespan })}
            />
            <Slider
                label="Sparkle Drag"
                value={visuals.particleDrag}
                min={0} max={10} step={0.1}
                onChange={(v) => adjustParameter({ particleDrag: v })}
                onReset={() => adjustParameter({ particleDrag: initialVisualsState.particleDrag })}
            />
            <Slider
                label="Diamond Ratio"
                value={visuals.particleDiamondRatio}
                min={0} max={1} step={0.01}
                onChange={(v) => adjustParameter({ particleDiamondRatio: v })}
                onReset={() => adjustParameter({ particleDiamondRatio: initialVisualsState.particleDiamondRatio })}
            />
            <Slider
                label="Glow Gamma"
                value={visuals.particleGlowGamma}
                min={1} max={10} step={0.1}
                onChange={(v) => adjustParameter({ particleGlowGamma: v })}
                onReset={() => adjustParameter({ particleGlowGamma: initialVisualsState.particleGlowGamma })}
            />
        </div>
    );
};

export default SparkleSettings;
