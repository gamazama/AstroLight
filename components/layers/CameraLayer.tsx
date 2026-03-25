
import React, { useState } from 'react';
import LayerItem from './LayerItem';
import Slider from '../shared/Slider';
import StyledToggleSwitch from '../shared/StyledToggleSwitch';
import DriftSettings from './DriftSettings';
import AmbientMotionSettings from './AmbientMotionSettings';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../../initialState';

// Updated Camera Icon
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 4.7865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

const DriftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);

const BlurIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" style={{ opacity: 0.5 }} />
    </svg>
);

const MotionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834-1.685l-1.591 1.591M20.25 12h-2.25m2.586 5.834l-1.591-1.591M12 18.75V21m-4.773-4.243l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const PivotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834-1.685l-1.591 1.591M20.25 12h-2.25m2.586 5.834l-1.591-1.591M12 18.75V21m-4.773-4.243l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
);

interface CameraLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
    tooltips: {
        fov: string;
        driftMode: string;
        driftAxisX: string;
        driftAxisZ: string;
    };
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
}

const CameraLayer: React.FC<CameraLayerProps> = ({ isExpanded, onToggleExpand, onHeaderClick, tooltips, handleMouseEnter, handleMouseLeave }) => {
    const { visuals, expandedDof, isAdvancedSettingsMode, adjustParameter, setFov, toggleRenderMode, toggleDriftMode, toggleLayer } = useAppStore(state => ({
        visuals: {
            renderMode: state.renderMode,
            targetFov: state.targetFov,
            enableLineZDrift: state.enableLineZDrift,
            dofStrength: state.dofStrength,
            dofFocusDistance: state.dofFocusDistance,
            dofExponent: state.dofExponent,
            dofBlurBrightness: state.dofBlurBrightness,
            dofBlurType: state.dofBlurType,
            ambientMotionMode: state.ambientMotionMode,
            pivotPoint: state.pivotPoint,
            worldRotation: state.worldRotation,
        },
        expandedDof: state.expandedLayers.dof,
        isAdvancedSettingsMode: state.isAdvancedSettingsMode,
        adjustParameter: state.actions.adjustParameter,
        setFov: state.actions.setFov,
        toggleRenderMode: state.actions.toggleRenderMode,
        toggleDriftMode: state.actions.toggleDriftMode,
        toggleLayer: state.actions.toggleLayer,
    }), shallow);

    const [isDriftExpanded, setIsDriftExpanded] = useState(false);
    const [isMotionExpanded, setIsMotionExpanded] = useState(false);

    return (
        <LayerItem
            label="Camera"
            icon={<CameraIcon />}
            isVisible={true}
            hideVisibilityToggle={true}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
        >
            <div id="camera-layer" className={`pt-2 px-2 pb-3`}>
                <div id="render-mode-toggle" className="mb-2">
                    <StyledToggleSwitch
                        labelLeft="Orthographic"
                        labelRight="Perspective"
                        checked={visuals.renderMode === 'perspective'}
                        onChange={() => toggleRenderMode()}
                    />
                </div>

                 {visuals.renderMode === 'perspective' && (
                    <Slider
                        label="Field of View (FOV)"
                        value={visuals.targetFov}
                        min={30} max={170} step={1}
                        onChange={setFov}
                        onHighFrequencyChange={setFov}
                        onReset={() => setFov(initialVisualsState.targetFov)}
                        tooltip={tooltips.fov}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                )}

                <div className="mt-1 space-y-1">
                    {/* World Pivot (Active only if Pivot is Set AND Advanced Settings is On) */}
                    {isAdvancedSettingsMode && visuals.pivotPoint && (
                         <LayerItem
                            label="World Pivot"
                            icon={<PivotIcon />}
                            isVisible={true}
                            hideVisibilityToggle={true}
                            isExpandable={true}
                            isExpanded={true} // Always expanded if active
                            onToggleExpand={() => {}}
                        >
                            <div className="pt-2 px-2 pb-3 border-t border-yellow-500/30 bg-yellow-500/5">
                                <p className="text-xs text-yellow-200 mb-2">World Rotation Active</p>
                                <Slider
                                    label="Rotation X"
                                    value={visuals.worldRotation.x}
                                    min={-180} max={180} step={0.1}
                                    onChange={(v) => adjustParameter({ worldRotation: { ...visuals.worldRotation, x: v } })}
                                    onHighFrequencyChange={(v) => adjustParameter({ worldRotation: { ...visuals.worldRotation, x: v } })}
                                    onReset={() => adjustParameter({ worldRotation: { ...visuals.worldRotation, x: 0 } })}
                                />
                                <Slider
                                    label="Rotation Y"
                                    value={visuals.worldRotation.y}
                                    min={-180} max={180} step={0.1}
                                    onChange={(v) => adjustParameter({ worldRotation: { ...visuals.worldRotation, y: v } })}
                                    onHighFrequencyChange={(v) => adjustParameter({ worldRotation: { ...visuals.worldRotation, y: v } })}
                                    onReset={() => adjustParameter({ worldRotation: { ...visuals.worldRotation, y: 0 } })}
                                />
                                <Slider
                                    label="Rotation Z"
                                    value={visuals.worldRotation.z}
                                    min={-180} max={180} step={0.1}
                                    onChange={(v) => adjustParameter({ worldRotation: { ...visuals.worldRotation, z: v } })}
                                    onHighFrequencyChange={(v) => adjustParameter({ worldRotation: { ...visuals.worldRotation, z: v } })}
                                    onReset={() => adjustParameter({ worldRotation: { ...visuals.worldRotation, z: 0 } })}
                                />
                                <button
                                    onClick={() => adjustParameter({ pivotPoint: null, pivotOffset: {x:0,y:0,z:0}, worldRotation: { x: 0, y: 0, z: 0 } })}
                                    className="w-full mt-2 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded border border-red-500/30 transition-colors"
                                >
                                    Clear Pivot
                                </button>
                            </div>
                        </LayerItem>
                    )}

                    <LayerItem
                        label="Drift Mode"
                        icon={<DriftIcon />}
                        isVisible={visuals.enableLineZDrift}
                        onToggleVisibility={toggleDriftMode}
                        isExpandable
                        isExpanded={isDriftExpanded}
                        onToggleExpand={() => setIsDriftExpanded(!isDriftExpanded)}
                        headerId="drift-slider-container"
                    >
                        <DriftSettings tooltips={tooltips} handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave} />
                    </LayerItem>

                     <LayerItem
                        label="Depth of Field"
                        icon={<BlurIcon />}
                        isVisible={visuals.dofStrength > 0}
                        hideVisibilityToggle={true} // Controlled by slider value 0
                        isExpandable
                        isExpanded={expandedDof}
                        onToggleExpand={() => toggleLayer('dof')}
                    >
                        <div className={`pt-2 px-2 pb-3`}>
                             <StyledToggleSwitch
                                labelLeft="Gaussian (Soft)"
                                labelRight="Bokeh (Hard)"
                                checked={visuals.dofBlurType === 'bokeh'}
                                onChange={(v) => adjustParameter({ dofBlurType: v ? 'bokeh' : 'gaussian' })}
                                tooltipLeft="Smooth, foggy blur."
                                tooltipRight="Simulates a camera aperture, creating flat, bright shapes."
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                            <Slider
                                label="Aperture (Blur)"
                                value={visuals.dofStrength}
                                min={0} max={200} step={1} 
                                onChange={(v) => adjustParameter({ dofStrength: v })}
                                onHighFrequencyChange={(v) => adjustParameter({ dofStrength: v })}
                                onReset={() => adjustParameter({ dofStrength: initialVisualsState.dofStrength })}
                            />
                            <Slider
                                label="Focus Offset"
                                value={visuals.dofFocusDistance}
                                min={-2000} max={2000} step={10}
                                onChange={(v) => adjustParameter({ dofFocusDistance: v })}
                                onHighFrequencyChange={(v) => adjustParameter({ dofFocusDistance: v })}
                                onReset={() => adjustParameter({ dofFocusDistance: 0 })}
                                tooltip="Adjusts the focal plane relative to the center of the solar system. 0 focuses on the sun."
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                            <Slider
                                label="Focus Range"
                                value={visuals.dofExponent}
                                min={0.1} max={3.0} step={0.1}
                                onChange={(v) => adjustParameter({ dofExponent: v })}
                                onHighFrequencyChange={(v) => adjustParameter({ dofExponent: v })}
                                onReset={() => adjustParameter({ dofExponent: initialVisualsState.dofExponent })}
                                tooltip="Adjusts how quickly things blur away from the focal plane. Higher values keep more of the scene in focus."
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                             <Slider
                                label="Blur Brightness"
                                value={visuals.dofBlurBrightness}
                                min={-1} max={1} step={0.01}
                                onChange={(v) => adjustParameter({ dofBlurBrightness: v })}
                                onHighFrequencyChange={(v) => adjustParameter({ dofBlurBrightness: v })}
                                onReset={() => adjustParameter({ dofBlurBrightness: initialVisualsState.dofBlurBrightness })}
                                tooltip="Controls brightness boosting for blurred objects. 0 = Physical (dimmer when blurred), 1 = Boosted (bright bokeh)."
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        </div>
                    </LayerItem>
                    
                    <LayerItem
                        label="Ambient Motion"
                        icon={<MotionIcon />}
                        isVisible={visuals.ambientMotionMode !== 'none'}
                        onToggleVisibility={() => adjustParameter({ ambientMotionMode: visuals.ambientMotionMode === 'none' ? 'orbit' : 'none' })}
                        isExpandable
                        isExpanded={isMotionExpanded}
                        onToggleExpand={() => setIsMotionExpanded(!isMotionExpanded)}
                    >
                         <div className="pt-2 px-2 pb-3">
                            <AmbientMotionSettings />
                        </div>
                    </LayerItem>
                </div>

            </div>
        </LayerItem>
    );
};

export default CameraLayer;
