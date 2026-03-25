import React, { useCallback } from 'react';
import Slider from './shared/Slider';
import EmbeddedColorPicker from './shared/EmbeddedColorPicker';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../initialState';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const BrushPanel: React.FC = () => {
    const { brushColor, brushSize, brushStrength, actions } = useAppStore(state => ({
        brushColor: state.brushColor,
        brushSize: state.brushSize,
        brushStrength: state.brushStrength,
        actions: state.actions,
    }), shallow);
    
    const { updateVisuals, toggleBrushMode } = actions;

    const handleColorChange = useCallback((color: string) => {
        updateVisuals({ brushColor: color });
    }, [updateVisuals]);

    return (
        <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center">
            <div className="w-[460px]">
                <div className="dynamic-blur border border-white/10 rounded-xl p-3 text-sm shadow-2xl mb-1">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            Brush Mode
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="text-[10px] text-gray-500 font-medium">
                                [Alt + Drag] Rotate <span className="mx-1">•</span> [Mid-Drag] Size
                            </div>
                            <button
                                onClick={toggleBrushMode}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Exit Brush Mode"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Left Column: Sliders */}
                        <div className="flex-1 flex flex-col justify-center gap-1 pt-1">
                            <Slider 
                                label="Size"
                                value={brushSize}
                                min={10}
                                max={300}
                                onChange={(v) => updateVisuals({ brushSize: v })}
                                onHighFrequencyChange={v => updateVisuals({ brushSize: v })}
                                onReset={() => updateVisuals({ brushSize: initialVisualsState.brushSize })}
                            />
                            <Slider 
                                label="Strength"
                                value={brushStrength}
                                min={0.01}
                                max={1}
                                step={0.01}
                                onChange={(v) => updateVisuals({ brushStrength: v })}
                                onHighFrequencyChange={v => updateVisuals({ brushStrength: v })}
                                onReset={() => updateVisuals({ brushStrength: initialVisualsState.brushStrength })}
                            />
                        </div>

                        {/* Vertical Divider */}
                        <div className="w-px bg-white/10 self-stretch mx-1"></div>

                        {/* Right Column: Color Picker */}
                        <div className="flex-1 pt-1">
                            <EmbeddedColorPicker 
                                color={brushColor}
                                onColorChange={handleColorChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrushPanel;