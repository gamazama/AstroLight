
import React, { useState, useEffect } from 'react';
import LayerItem from './LayerItem';
import Slider from '../shared/Slider';
import ToggleSwitch from '../shared/ToggleSwitch';
import AdvancedGradientEditor from '../shared/AdvancedGradientEditor'; // Replaced import
import MyceliumSettings from './MyceliumSettings';
import SparkleSettings from './SparkleSettings';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../../initialState';

// Updated Cleaner Icon
const LinesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.8 16L9 19L8.2 16C7.8 14.5 6.5 13.2 5 12.8L2 12L5 11.2C6.5 10.8 7.8 9.5 8.2 8L9 5L9.8 8C10.2 9.5 11.5 10.8 13 11.2L16 12L13 12.8C11.5 13.2 10.2 14.5 9.8 16Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 7L17 9L16.5 7C16.2 6.2 15.8 5.8 15 5.5L13 5L15 4.5C15.8 4.2 16.2 3.8 16.5 3L17 1L17.5 3C17.8 3.8 18.2 4.2 19 4.5L21 5L19 5.5C18.2 5.8 17.8 6.2 17.5 7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 18L19 20L18.5 18C18.2 17.2 17.8 16.8 17 16.5L15 16L17 15.5C17.8 15.2 18.2 14.8 18.5 14L19 12L19.5 14C19.8 14.8 20.2 15.2 21 15.5L23 16L21 16.5C20.2 16.8 19.8 17.2 19.5 18Z" />
    </svg>
);
const MyceliumIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16C12 16 8 15 6 12C4 9 5 5 5 5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16C12 16 16 15 18 12C20 9 19 5 19 5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12C6 12 3 11 2 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12C18 12 21 11 22 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V12C12 12 10 10 10 8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12C12 12 14 10 14 8" />
    </svg>
);
const LiveLinesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

interface LinesLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
    isLiveLinesExpanded: boolean;
    onToggleLiveLinesExpand: () => void;
    isSparklesExpanded: boolean;
    onToggleSparklesExpand: () => void;
    tooltips: { [key: string]: string };
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
    animate: boolean;
    isActivationRequired?: boolean;
    onActivate?: () => void;
    showAdvancedOptions?: boolean;
    showLineDrawAngle?: boolean;
}

const LinesLayer: React.FC<LinesLayerProps> = ({ 
    isExpanded, onToggleExpand, onHeaderClick, 
    isLiveLinesExpanded, onToggleLiveLinesExpand,
    isSparklesExpanded, onToggleSparklesExpand,
    tooltips, handleMouseEnter, handleMouseLeave, animate,
    isActivationRequired, onActivate, showAdvancedOptions = true, showLineDrawAngle = true
}) => {
    const { visuals, expandedMycelium, adjustParameter, openColorPicker, markFeatureUsed, toggleLayer } = useAppStore(state => ({
        visuals: {
            showLines: state.showLines,
            lineWidth: state.lineWidth,
            lineDrawAngle: state.lineDrawAngle,
            lineBlendMode: state.lineBlendMode,
            webglLineBrightness: state.webglLineBrightness,
            lineSoftness: state.lineSoftness,
            showLiveConnections: state.showLiveConnections,
            liveLineWidth: state.liveLineWidth,
            liveLineOpacity: state.liveLineOpacity,
            isSparkleMode: state.isSparkleMode,
            isMyceliumMode: state.isMyceliumMode,
            lineColorMode: state.lineColorMode,
            lineGradient: state.lineGradient,
        },
        expandedMycelium: state.expandedLayers.mycelium,
        adjustParameter: state.actions.adjustParameter,
        openColorPicker: state.actions.openColorPicker,
        markFeatureUsed: state.actions.markFeatureUsed,
        toggleLayer: state.actions.toggleLayer,
    }), shallow);

    const [animationClass, setAnimationClass] = useState('');
    useEffect(() => {
        if (animate) {
            setAnimationClass('animate-layer-reveal');
        }
    }, [animate]);

    const blendOptions: Record<string, string> = {
        'lighter': 'Lighter (Additive)',
        'multiply': 'Multiply',
        'source-over': 'Normal',
        'screen': 'Screen',
    };

    const colorModes = [
        { value: 'constant', label: 'Solid Color' },
        { value: 'distance', label: 'Distance Gradient' },
        { value: 'orbit', label: 'Orbit Completion' },
    ];

    return (
        <LayerItem
            label="Lines"
            icon={<LinesIcon />}
            isVisible={visuals.showLines}
            onToggleVisibility={() => adjustParameter({ showLines: !visuals.showLines })}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
            className={animationClass}
            onAnimationEnd={() => setAnimationClass('')}
        >
            {isActivationRequired ? (
                <div className="p-4 flex justify-center">
                    <button 
                        onClick={onActivate}
                        className="w-full px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium transition-transform hover:-translate-y-0.5"
                    >
                        Activate Line Controls
                    </button>
                </div>
            ) : (
                <div className="pt-2 px-2 pb-3">
                    {/* Core Sliders */}
                    <Slider
                        label="Line Width"
                        value={visuals.lineWidth}
                        min={0.01} max={20} step={0.01}
                        onChange={(v) => adjustParameter({ lineWidth: v })}
                        onHighFrequencyChange={(v) => adjustParameter({ lineWidth: v })}
                        onInputDragEnd={() => markFeatureUsed('line_width_tweaked')}
                        onReset={() => adjustParameter({ lineWidth: initialVisualsState.lineWidth })}
                        logarithmic logMin={0.01} logMax={20}
                    />
                    <Slider 
                        label="Line Brightness"
                        value={visuals.webglLineBrightness}
                        min={0}
                        max={2.0}
                        step={0.01}
                        onChange={(v) => adjustParameter({ webglLineBrightness: v })}
                        onHighFrequencyChange={v => adjustParameter({ webglLineBrightness: v })}
                        onReset={() => adjustParameter({ webglLineBrightness: initialVisualsState.webglLineBrightness })}
                        logarithmic
                        logMin={0.01}
                        logMax={2.0}
                        tooltip="Adjusts the final brightness of all lines. Acts as a multiplier on the automatically calculated opacity."
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                    <Slider
                        label="Line Softness"
                        value={visuals.lineSoftness}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => adjustParameter({ lineSoftness: v })}
                        onHighFrequencyChange={(v) => adjustParameter({ lineSoftness: v })}
                        onReset={() => adjustParameter({ lineSoftness: initialVisualsState.lineSoftness })}
                        tooltip="Controls the feathering on the edges of lines. 0 is a hard edge, 1 is a very soft edge."
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                    {showAdvancedOptions && showLineDrawAngle && (
                        <Slider
                            label="Line Draw Angle (°)"
                            value={visuals.lineDrawAngle}
                            min={0.1} max={10} step={0.1}
                            onChange={(v) => adjustParameter({ lineDrawAngle: v })}
                            onHighFrequencyChange={(v) => adjustParameter({ lineDrawAngle: v })}
                            onReset={() => adjustParameter({ lineDrawAngle: initialVisualsState.lineDrawAngle })}
                            tooltip={tooltips.lineDrawAngle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                    )}

                    {/* Color & Blend Section */}
                    <div className="mt-2 pt-3 border-t border-white/10">
                        <div className="mb-3">
                            <label className="text-sm flex justify-between items-center mb-2 text-gray-300">
                                <span>Color Mode</span>
                            </label>
                            <select
                                value={visuals.lineColorMode}
                                onChange={(e) => adjustParameter({ lineColorMode: e.target.value as any })}
                                className="w-full px-2 py-1.5 bg-black/30 border border-white/20 rounded-md text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#667eea]"
                            >
                                {colorModes.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {visuals.lineColorMode !== 'constant' && (
                            <AdvancedGradientEditor
                                stops={visuals.lineGradient}
                                onChange={(newStops) => adjustParameter({ lineGradient: newStops })}
                                openColorPicker={(id, e, color) => openColorPicker({ type: 'gradientStop', stopId: id }, e, color)}
                            />
                        )}
                        
                        {showAdvancedOptions && (
                            <div className="mb-4 mt-3">
                                <label className="text-sm flex justify-between items-center mb-2 text-gray-300">
                                    <span>Line Blending</span>
                                </label>
                                <select
                                    value={visuals.lineBlendMode}
                                    onChange={(e) => adjustParameter({ lineBlendMode: e.target.value as GlobalCompositeOperation })}
                                    className="w-full px-2 py-1.5 bg-black/30 border border-white/20 rounded-md text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#667eea]"
                                >
                                    {Object.entries(blendOptions).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* Sub-Layers */}
                    <div className="space-y-1 pt-2 border-t border-white/10">
                        <LayerItem
                            label="Live Lines"
                            icon={<LiveLinesIcon />}
                            isVisible={visuals.showLiveConnections}
                            onToggleVisibility={() => adjustParameter({ showLiveConnections: !visuals.showLiveConnections })}
                            isExpandable
                            isExpanded={isLiveLinesExpanded}
                            onToggleExpand={onToggleLiveLinesExpand}
                        >
                            <div className="pt-2 px-2 pb-3">
                                <Slider
                                    label="Width"
                                    value={visuals.liveLineWidth}
                                    min={0.1} max={10} step={0.1}
                                    onChange={(v) => adjustParameter({ liveLineWidth: v })}
                                    onReset={() => adjustParameter({ liveLineWidth: initialVisualsState.liveLineWidth })}
                                />
                                <Slider
                                    label="Opacity"
                                    value={visuals.liveLineOpacity}
                                    min={0} max={1} step={0.01}
                                    onChange={(v) => adjustParameter({ liveLineOpacity: v })}
                                    onReset={() => adjustParameter({ liveLineOpacity: initialVisualsState.liveLineOpacity })}
                                />
                            </div>
                        </LayerItem>

                         <LayerItem
                            label="Mycelium Network"
                            icon={<MyceliumIcon />}
                            isVisible={visuals.isMyceliumMode}
                            onToggleVisibility={() => adjustParameter({ isMyceliumMode: !visuals.isMyceliumMode })}
                            isExpandable
                            isExpanded={expandedMycelium}
                            onToggleExpand={() => toggleLayer('mycelium')}
                        >
                             <MyceliumSettings handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave} />
                        </LayerItem>

                        <LayerItem
                            label="Sparkles"
                            icon={<SparklesIcon />}
                            isVisible={visuals.isSparkleMode}
                            onToggleVisibility={() => adjustParameter({ isSparkleMode: !visuals.isSparkleMode })}
                            isExpandable
                            isExpanded={isSparklesExpanded}
                            onToggleExpand={onToggleSparklesExpand}
                            headerId="sparkles-header"
                        >
                            <SparkleSettings />
                        </LayerItem>
                    </div>
                </div>
            )}
        </LayerItem>
    );
};

export default LinesLayer;
