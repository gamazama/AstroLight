
import React from 'react';
import Slider from '../shared/Slider';
import StyledToggleSwitch from '../shared/StyledToggleSwitch';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../../initialState';

interface DriftSettingsProps {
    tooltips: {
        driftMode: string;
        driftAxisX: string;
        driftAxisZ: string;
    };
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
}

const DriftSettings: React.FC<DriftSettingsProps> = ({ tooltips, handleMouseEnter, handleMouseLeave }) => {
    const { visuals, adjustParameter, setDriftAxis, incrementInteractionCount } = useAppStore(state => ({
        visuals: {
            lineDriftAxis: state.lineDriftAxis,
            lineZDriftSpeed: state.lineZDriftSpeed,
        },
        adjustParameter: state.actions.adjustParameter,
        setDriftAxis: state.actions.setDriftAxis,
        incrementInteractionCount: state.actions.incrementInteractionCount,
    }), shallow);

    return (
        <div className="pt-2 px-2 pb-3">
            <StyledToggleSwitch
                labelLeft="Z-Axis (Depth)"
                labelRight="X-Axis (Side)"
                checked={visuals.lineDriftAxis === 'x'}
                onChange={v => setDriftAxis(v ? 'x' : 'z')}
                tooltipLeft={tooltips.driftAxisZ}
                tooltipRight={tooltips.driftAxisX}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            <Slider
                label="Drift Speed"
                value={visuals.lineZDriftSpeed}
                min={-500} max={500} step={0.1}
                onChange={(v) => adjustParameter({ lineZDriftSpeed: v })}
                onInputDragEnd={() => incrementInteractionCount('drift_slider')}
                onHighFrequencyChange={(v) => adjustParameter({ lineZDriftSpeed: v })}
                onReset={() => adjustParameter({ lineZDriftSpeed: initialVisualsState.lineZDriftSpeed })}
                logarithmic
            />
        </div>
    );
};

export default DriftSettings;
