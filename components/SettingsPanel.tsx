
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useAppStore } from '../store/appStore';
import Slider from './shared/Slider';
import ToggleSwitch from './shared/ToggleSwitch';
import { shallow } from 'zustand/shallow';
import { initialVisualsState } from '../initialState';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { useCollapseAnimation } from '../hooks/useCollapseAnimation';

// Icons for collapse/expand
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

const InfoItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between px-2 text-sm">
        <span className="text-gray-400">{label}:</span>
        <span className="font-medium text-white">{value}</span>
    </div>
);

const SettingsPanel: React.FC = () => {
    const {
        isSettingsPanelOpen,
        uiBackgroundOpacity,
        uiBlurAmount,
        frameTime,
        history,
        isPerformanceMode,
        settingsPanelPosition,
        debugShowOrbitMask,
        lineHistory,
        particles,
        starCount,
        maxLines,
        debugDisableLines,
        debugDisableStars,
        debugDisableParticles,
        minLineAlpha,
        debugDoFMode,
        disableCameraSmoothing,
        updateUI,
        adjustParameter,
    } = useAppStore(state => ({
        isSettingsPanelOpen: state.isSettingsPanelOpen,
        uiBackgroundOpacity: state.uiBackgroundOpacity,
        uiBlurAmount: state.uiBlurAmount,
        frameTime: state.frameTime,
        history: state.history,
        isPerformanceMode: state.isPerformanceMode,
        settingsPanelPosition: state.settingsPanelPosition,
        debugShowOrbitMask: state.debugShowOrbitMask,
        lineHistory: state.lineHistory,
        particles: state.particles,
        starCount: state.starCount,
        maxLines: state.maxLines,
        debugDisableLines: state.debugDisableLines,
        debugDisableStars: state.debugDisableStars,
        debugDisableParticles: state.debugDisableParticles,
        minLineAlpha: state.minLineAlpha,
        debugDoFMode: state.debugDoFMode,
        disableCameraSmoothing: state.disableCameraSmoothing,
        updateUI: state.actions.updateUI,
        adjustParameter: state.actions.adjustParameter,
    }), shallow);
    
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const { handleMouseDown, handleTouchStart } = useDraggablePanel({
        panelRef,
        position: settingsPanelPosition,
        onPositionChange: (pos) => updateUI({ settingsPanelPosition: pos })
    });
    
    const contentStyle = useCollapseAnimation(isPanelCollapsed, contentRef);

    useEffect(() => {
        if (!isSettingsPanelOpen || !panelRef.current) return;

        if (settingsPanelPosition === null) {
            const panelWidth = panelRef.current.offsetWidth;
            const defaultX = window.innerWidth - panelWidth - 20;
            
            // Default Y position
            // We want to avoid the TimeDatePanel which is at top: 60px and has variable height.
            // A safe starting point is lower down on the right.
            
            let defaultY = 180; // Below standard TimeDatePanel height

            const objectsPanel = document.getElementById('objects-panel');
            if (objectsPanel) {
                const objectsRect = objectsPanel.getBoundingClientRect();
                const settingsRect = {
                    left: defaultX,
                    top: defaultY,
                    right: defaultX + panelWidth,
                    bottom: defaultY + panelRef.current.offsetHeight,
                };
                
                // Check overlap with ObjectsPanel (usually on the left, but could be moved)
                const overlap = (
                    settingsRect.left < objectsRect.right &&
                    settingsRect.right > objectsRect.left &&
                    settingsRect.top < objectsRect.bottom &&
                    settingsRect.bottom > objectsRect.top
                );

                if (overlap) {
                    // If it overlaps ObjectsPanel, try to move below it, or just stick to defaultY
                    // Priority is avoiding the top-right corner where TimeDate lives.
                    defaultY = Math.max(defaultY, objectsRect.bottom + 20);
                }
            }
            
            // Ensure it fits on screen vertically
            if (defaultY + panelRef.current.offsetHeight > window.innerHeight - 20) {
                defaultY = Math.max(60, window.innerHeight - panelRef.current.offsetHeight - 20);
            }

            updateUI({ settingsPanelPosition: { x: defaultX, y: defaultY } });
        }
    }, [isSettingsPanelOpen, settingsPanelPosition, updateUI]);


    const handleMouseEnter = (e: React.MouseEvent, content: string) => {
        updateUI({ tooltip: { x: e.pageX, y: e.pageY, content } });
    };

    const handleMouseLeave = () => {
        updateUI({ tooltip: null });
    };

    const tooltips = {
        performanceMode: "Disables blur and transparency effects to improve frame rate on slower devices.",
        maxLines: "Sets a hard limit on the number of lines. Lowering this value is the most effective way to improve performance on slower devices by reducing CPU load.",
        minLineAlpha: "Sets the minimum alpha threshold for line segments. Any part of a line below this opacity will be discarded (culled) by the shader. Increase to improve performance by drawing fewer pixels.",
    };

    if (!isSettingsPanelOpen) {
        return null;
    }
    
    const costPer1kLines = lineHistory.length > 0 ? (frameTime / (lineHistory.length / 1000)) : 0;

    return (
        <div
            ref={panelRef}
            className="fixed flex flex-col dynamic-blur border border-white/10 rounded-xl shadow-2xl text-white select-none z-10 pointer-events-auto overflow-hidden"
            style={{
                top: `${settingsPanelPosition?.y ?? 0}px`,
                left: `${settingsPanelPosition?.x ?? 0}px`,
                minWidth: '250px',
                visibility: settingsPanelPosition ? 'visible' : 'hidden',
                maxHeight: `calc(100vh - ${(settingsPanelPosition?.y ?? 0) + 20}px)`,
            }}
        >
            <div
                className="bg-white/5 px-3 py-2 rounded-t-xl cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-between"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Dev & Stats</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                        className="p-1 rounded-md hover:bg-white/10 cursor-pointer"
                        title={isPanelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
                    >
                        {isPanelCollapsed ? <PlusIcon/> : <MinusIcon/>}
                    </button>
                    <button
                        onClick={() => updateUI({ isSettingsPanelOpen: false })}
                        className="text-gray-400 hover:text-white text-2xl -mt-1"
                        aria-label="Close settings"
                    >
                        &times;
                    </button>
                </div>
            </div>

            <div 
                ref={contentRef} 
                className="overflow-y-auto custom-scroll pointer-events-auto flex-1 min-h-0" 
                style={contentStyle}
            >
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">System Stats</h3>
                        <div className="space-y-2">
                            <InfoItem label="Frame Time" value={`${frameTime.toFixed(2)} ms`} />
                            <InfoItem label="Lines" value={lineHistory.length.toLocaleString()} />
                            <InfoItem label="ms / 1k lines" value={costPer1kLines.toFixed(3)} />
                            <InfoItem label="Particles" value={particles.length.toLocaleString()} />
                            <InfoItem label="Stars" value={starCount.toLocaleString()} />
                            <InfoItem label="Undo History Size" value={history.past.length} />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Performance Tuning</h3>
                        <Slider
                            label="Max Lines"
                            value={maxLines}
                            min={1000}
                            max={100000}
                            step={1000}
                            onChange={(v) => adjustParameter({ maxLines: v })}
                            onReset={() => adjustParameter({ maxLines: initialVisualsState.maxLines })}
                            tooltip={tooltips.maxLines}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                        <Slider
                            label="Min Line Alpha"
                            value={minLineAlpha}
                            min={0.0001}
                            max={0.1}
                            step={0.0001}
                            onChange={(v) => adjustParameter({ minLineAlpha: v })}
                            onReset={() => adjustParameter({ minLineAlpha: initialVisualsState.minLineAlpha })}
                            tooltip={tooltips.minLineAlpha}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            logarithmic
                            logMin={0.0001}
                            logMax={0.1}
                        />
                        <div className="py-2 relative">
                            <label className="text-sm flex items-center gap-2 text-gray-300 mb-2">
                                <span
                                    className="underline decoration-dotted cursor-help"
                                    onMouseEnter={(e) => handleMouseEnter(e, "Visualization modes for debugging Depth of Field settings.")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    DoF Debug View
                                </span>
                            </label>
                            <select
                                value={debugDoFMode}
                                onChange={(e) => adjustParameter({ debugDoFMode: e.target.value as any })}
                                className="w-full px-2 py-1.5 bg-black/30 border border-white/20 rounded-md text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#667eea]"
                            >
                                <option value="none">None (Normal)</option>
                                <option value="coc">CoC Heatmap (Red=Blur)</option>
                                <option value="depth">Depth Map</option>
                                <option value="cap">Tip Fade (Red=Tip)</option>
                            </select>
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Performance Analysis</h3>
                        <ToggleSwitch
                            label="Disable Camera Smoothing"
                            checked={disableCameraSmoothing}
                            onChange={(v) => adjustParameter({ disableCameraSmoothing: v })}
                            tooltip="Disables all lerping/smoothing on camera zoom, pan, and rotation for instant response. May feel jerky."
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                            <ToggleSwitch
                            label="Disable Line Drawing"
                            checked={debugDisableLines}
                            onChange={(v) => adjustParameter({ debugDisableLines: v })}
                        />
                        <ToggleSwitch
                            label="Disable Star Drawing"
                            checked={debugDisableStars}
                            onChange={(v) => adjustParameter({ debugDisableStars: v })}
                        />
                            <ToggleSwitch
                            label="Disable Particle System"
                            checked={debugDisableParticles}
                            onChange={(v) => adjustParameter({ debugDisableParticles: v })}
                        />
                        <ToggleSwitch
                            label="Show Orbit ID Mask"
                            checked={debugShowOrbitMask}
                            onChange={(v) => updateUI({ debugShowOrbitMask: v })}
                        />
                    </div>
                        <div className="pt-4 border-t border-white/10">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">UI Settings</h3>
                        <ToggleSwitch
                            label="Performance Mode"
                            checked={isPerformanceMode}
                            onChange={(v) => adjustParameter({ isPerformanceMode: v })}
                            tooltip={tooltips.performanceMode}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                        <Slider 
                            label="UI Opacity"
                            value={uiBackgroundOpacity}
                            min={0.1}
                            max={1}
                            step={0.01}
                            onChange={(v) => adjustParameter({ uiBackgroundOpacity: v })}
                            onHighFrequencyChange={v => adjustParameter({ uiBackgroundOpacity: v })}
                            disabled={isPerformanceMode}
                        />
                        <Slider 
                            label="UI Blur (px)"
                            value={uiBlurAmount}
                            min={0}
                            max={20}
                            step={1}
                            onChange={(v) => adjustParameter({ uiBlurAmount: v })}
                            onHighFrequencyChange={v => adjustParameter({ uiBlurAmount: v })}
                            disabled={isPerformanceMode}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
