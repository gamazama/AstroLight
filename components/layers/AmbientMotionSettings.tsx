
import React from 'react';
import Slider from '../shared/Slider';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

const AmbientMotionSettings: React.FC = () => {
    const { ambientMotionMode, ambientMotionSpeed, adjustParameter } = useAppStore(state => ({
        ambientMotionMode: state.ambientMotionMode,
        ambientMotionSpeed: state.ambientMotionSpeed,
        adjustParameter: state.actions.adjustParameter,
    }), shallow);

    const modes = [
        { id: 'none', label: 'Off' },
        { id: 'orbit', label: 'Orbit' },
        { id: 'wobble', label: 'Wobble' },
        { id: 'drift', label: 'Drift' },
        { id: 'figure8', label: 'Figure 8' },
        { id: 'spiral', label: 'Spiral' },
        { id: 'survey', label: 'Survey' },
        { id: 'float', label: 'Float' },
    ];

    return (
        <div className="mt-0 py-0">
             <Slider
                label="Motion Speed"
                value={ambientMotionSpeed}
                min={0.1}
                max={20}
                step={0.05}
                onChange={(v) => adjustParameter({ ambientMotionSpeed: v })}
                onHighFrequencyChange={v => adjustParameter({ ambientMotionSpeed: v })}
                onReset={() => adjustParameter({ ambientMotionSpeed: 0.5 })}
                disabled={ambientMotionMode === 'none'}
            />
            <div className="grid grid-cols-2 gap-2 mt-3">
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => adjustParameter({ ambientMotionMode: mode.id as any })}
                        className={`px-2 py-1.5 text-xs rounded-md transition-colors ${ambientMotionMode === mode.id ? 'bg-indigo-500 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AmbientMotionSettings;
