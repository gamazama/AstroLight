import React, { useState, useEffect, useRef } from 'react';
import { sliderToLogValue, logToSliderValue, sliderToSymmetricLogValue, symmetricLogToSliderValue } from '../../utils/mathUtils';
import { SLIDER_DRAG_FINE_TUNE_DIVISOR, SLIDER_DRAG_SENSITIVITY_LINEAR_BASE, SLIDER_DRAG_SENSITIVITY_LOG_BASE, SLIDER_DRAG_ULTRA_FINE_TUNE_DIVISOR } from '../../constants';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    hardMin?: number; // Optional absolute limit for text input/scrubbing
    hardMax?: number; // Optional absolute limit for text input/scrubbing
    step?: number;
    onChange: (value: number, source?: 'slider' | 'input') => void;
    onHighFrequencyChange?: (value: number) => void;
    onInputDragStart?: () => void;
    onInputDragEnd?: () => void;
    onReset?: () => void;
    overrideInputText?: string;
    logarithmic?: boolean;
    logMin?: number;
    logMax?: number;
    disabled?: boolean;
    sliderOnlyDisabled?: boolean;
    tooltip?: string;
    onMouseEnter?: (e: React.MouseEvent, content: string) => void;
    onMouseLeave?: () => void;
    id?: string;
    labelPrefix?: React.ReactNode;
    parameterName?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value: valueProp, min, max, hardMin, hardMax, step = 1, onChange, onHighFrequencyChange, onInputDragStart, onInputDragEnd, onReset, logarithmic = false, logMin = 0.01, logMax = 1000, disabled = false, sliderOnlyDisabled = false, tooltip, onMouseEnter, onMouseLeave, id, labelPrefix, parameterName, overrideInputText }) => {
    const value = valueProp ?? min ?? 0;
    
    // Determine effective limits for text input and scrubbing
    const effectiveMin = hardMin ?? min;
    const effectiveMax = hardMax ?? max;

    const [isEditing, setIsEditing] = useState(false);
    
    const showSliderBar = min !== undefined && max !== undefined;

    const valueRef = useRef(value);
    useEffect(() => {
        valueRef.current = value;
    }, [value]);
    
    const isSymmetricLog = logarithmic && min < 0;

    // For the visual slider position, we clamp the value to the visual min/max
    const visualValue = Math.max(min, Math.min(max, value));

    const sliderValue = isSymmetricLog
        ? symmetricLogToSliderValue(visualValue, max)
        : (logarithmic ? logToSliderValue(visualValue, logMin, logMax) : visualValue);
    
    const sliderMax = isSymmetricLog ? 1000 : (logarithmic ? 1000 : max);
    const sliderMin = isSymmetricLog ? -1000 : (logarithmic ? 0 : min);
    const sliderStep = isSymmetricLog ? 1 : (logarithmic ? 1 : step);
    
    // Display full precision in text box
    const displayValue = parseFloat(value.toFixed(4)).toString();

    const [inputValue, setInputValue] = useState(overrideInputText ?? displayValue);

    useEffect(() => {
        if (!isEditing) {
            setInputValue(overrideInputText ?? displayValue);
        }
    }, [displayValue, isEditing, overrideInputText]);


    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSliderValue = parseFloat(e.target.value);
        let newValue;
        if (isSymmetricLog) {
            newValue = sliderToSymmetricLogValue(newSliderValue, max);
        } else if (logarithmic) {
            newValue = sliderToLogValue(newSliderValue, logMin, logMax);
        } else {
            newValue = newSliderValue;
        }

        if (onHighFrequencyChange) {
            onHighFrequencyChange(newValue);
        } else {
            onChange(newValue, 'slider');
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const commitInputChange = () => {
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue)) {
            // Use effectiveMin/effectiveMax (hard limits) for text input validation
            onChange(Math.max(effectiveMin, Math.min(effectiveMax, newValue)), 'input');
        } else {
            setInputValue(overrideInputText ?? displayValue);
        }
        setIsEditing(false);
    };

    const handleInputBlur = () => {
        commitInputChange();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            commitInputChange();
        } else if (e.key === 'Escape') {
            setInputValue(overrideInputText ?? displayValue);
            setIsEditing(false);
        }
    };


    const handleMouseEnter = (e: React.MouseEvent) => {
        if (tooltip && onMouseEnter) {
            onMouseEnter(e, tooltip);
        }
    };

    const handleMouseLeave = () => {
        if (tooltip && onMouseLeave) {
            onMouseLeave();
        }
    };
    
    const handleMouseDownOnNumberInput = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || e.button !== 0) return;

        onInputDragStart?.();

        e.preventDefault();
        document.body.style.cursor = 'ew-resize';

        let didDrag = false;
        const liveValueRef = { current: valueRef.current };
        let lastClientX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            didDrag = true;
            const deltaX = moveEvent.clientX - lastClientX;
            lastClientX = moveEvent.clientX;

            let newValue;

            if (logarithmic) {
                // Log scrubbing not fully adapted for hard limits yet, defaults to visual limits for feel
                const sliderMaxVal = isSymmetricLog ? 1000 : 1000;
                const sliderMinVal = isSymmetricLog ? -1000 : 0;
                
                const currentSliderPos = isSymmetricLog 
                    ? symmetricLogToSliderValue(Math.max(min, Math.min(max, liveValueRef.current)), max, sliderMaxVal) 
                    : logToSliderValue(Math.max(logMin, Math.min(logMax, liveValueRef.current)), logMin, logMax, sliderMaxVal);
                
                const range = sliderMaxVal - sliderMinVal;
                const sensitivity = range / SLIDER_DRAG_SENSITIVITY_LOG_BASE;
                let sliderDelta = deltaX * sensitivity;

                if (moveEvent.altKey) sliderDelta /= SLIDER_DRAG_ULTRA_FINE_TUNE_DIVISOR;
                else sliderDelta /= SLIDER_DRAG_FINE_TUNE_DIVISOR;
                
                let newSliderPos = currentSliderPos + sliderDelta;
                newSliderPos = Math.max(sliderMinVal, Math.min(sliderMaxVal, newSliderPos));

                newValue = isSymmetricLog 
                    ? sliderToSymmetricLogValue(newSliderPos, max, sliderMaxVal)
                    : sliderToLogValue(newSliderPos, logMin, logMax, sliderMaxVal);
                
                // Clamp log values to hard limits if provided
                newValue = Math.max(effectiveMin, Math.min(effectiveMax, newValue));

            } else { // Linear scale
                const baseStep = step || 1;
                
                let multiplier = moveEvent.altKey ? 1 / SLIDER_DRAG_ULTRA_FINE_TUNE_DIVISOR : 1 / SLIDER_DRAG_FINE_TUNE_DIVISOR;
                const pixelValueRatio = baseStep / SLIDER_DRAG_SENSITIVITY_LINEAR_BASE;
                const valueDelta = deltaX * pixelValueRatio * multiplier;
                
                // Linear scrubbing allows going into the extended range
                newValue = liveValueRef.current + valueDelta;
                newValue = Math.max(effectiveMin, Math.min(effectiveMax, newValue));
            }
            
            liveValueRef.current = newValue;

            if (onHighFrequencyChange) {
                onHighFrequencyChange(newValue);
            } else {
                onChange(newValue, 'input');
            }
             setInputValue(parseFloat(newValue.toFixed(4)).toString());
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';

            onChange(liveValueRef.current, 'input');

            if (didDrag) onInputDragEnd?.();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };


    return (
        <div className={`py-2 relative ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
                <label className="text-sm flex items-center gap-2 text-gray-300">
                    {labelPrefix}
                    <span
                        className={tooltip ? 'underline decoration-dotted cursor-help' : ''}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {label}
                    </span>
                </label>
                {isEditing ? (
                    <input
                        type="number"
                        value={inputValue}
                        min={effectiveMin}
                        max={effectiveMax}
                        step={logarithmic ? 0.01 : step}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        disabled={disabled}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className="w-20 px-2 py-1 bg-black/30 border border-white/10 ring-2 ring-[#667eea] rounded-md text-white text-right text-sm outline-none"
                    />
                ) : (
                    <div
                        id={id}
                        onClick={(e) => {
                            if (disabled) return;
                            if (e.ctrlKey || e.metaKey) onReset?.();
                            else setIsEditing(true);
                        }}
                        onMouseDown={handleMouseDownOnNumberInput}
                        className={`w-20 px-2 py-1 bg-black/30 border border-white/10 rounded-md text-white text-right text-sm ${disabled ? 'opacity-50' : 'cursor-ew-resize'}`}
                        title={onReset ? "Click to edit, Ctrl+Click to reset, Drag to adjust" : "Click to edit, Drag to adjust"}
                    >
                        {overrideInputText ?? displayValue}
                    </div>
                )}
            </div>
            {label && showSliderBar && <input
                type="range"
                value={sliderValue}
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                onChange={handleSliderChange}
                disabled={disabled || sliderOnlyDisabled}
                className="w-full h-1.5 bg-white/10 rounded-full outline-none appearance-none disabled:opacity-50 mt-2"
            />}
             <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
};

export default Slider;