import React from 'react';
import Slider from '../../../components/shared/Slider';
import type { SoundNodeParameter } from '../../types';

interface ParamSliderProps {
    param: SoundNodeParameter;
    value: number;
    onChange: (value: number) => void;
    onHighFrequencyChange?: (value: number) => void;
    labelPrefix?: React.ReactNode;
    overrideInputText?: string;
}

export const ParamSlider: React.FC<ParamSliderProps> = ({ param, value, onChange, onHighFrequencyChange, labelPrefix, overrideInputText }) => {
    return (
        <Slider
            label={param.label}
            value={value}
            min={param.min ?? 0}
            max={param.max ?? 1}
            hardMin={param.hardMin}
            hardMax={param.hardMax}
            step={param.step}
            onChange={onChange}
            onHighFrequencyChange={onHighFrequencyChange}
            logarithmic={param.log}
            labelPrefix={labelPrefix}
            overrideInputText={overrideInputText}
        />
    );
};