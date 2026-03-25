
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
        { id: 'none' as const, label: 'Off' },
        { id: 'orbit' as const, label: 'Orbit' },
        { id: 'wobble' as const, label: 'Wobble' },
        { id: 'drift' as const, label: 'Drift' },
        { id: 'figure8' as const, label: 'Figure 8' },
        { id: 'spiral' as const, label: 'Spiral' },
        { id: 'survey' as const, label: 'Survey' },
        { id: 'float' as const, label: 'Float' },
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
                        onClick={() => adjustParameter({ ambientMotionMode: mode.id })}
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
