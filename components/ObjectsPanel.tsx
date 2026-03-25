
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import LayerItem from './layers/LayerItem';
import BackgroundLayer from './layers/BackgroundLayer';
import CameraLayer from './layers/CameraLayer';
import LinesLayer from './layers/LinesLayer';
import OrbitsLayer from './layers/OrbitsLayer';
import ConnectionsLayer from './layers/ConnectionsLayer';
import SoundLayer from '../AstroSound/components/SoundLayer';
import AdvancedLayer from './layers/AdvancedLayer';
import RealismLayer from './layers/RealismLayer'; // New Import
import { useAppStore, AppStoreState } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { useCollapseAnimation } from '../hooks/useCollapseAnimation';

// --- Panel Icons ---
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

interface ObjectsPanelProps {
    showConnectionsLayer: boolean;
    showLinesLayer: boolean;
    showOrbitsLayer: boolean;
    showBackgroundLayer: boolean;
    showCameraLayer: boolean;
    areConnectionsExpandable: boolean;
    showConnectionColor: boolean;
    showConnectionDelete: boolean;
    showPlanetSettings: boolean;
    animateLayer: 'lines' | 'orbits' | 'background' | 'advanced' | null;
    isLinesActivationRequired: boolean;
    onLinesActivate: () => void;
    showLinesAdvancedOptions?: boolean;
    showLineDrawAngle?: boolean;
}

const ObjectsPanel: React.FC<ObjectsPanelProps> = (props) => {
    const {
        showConnectionsLayer, showLinesLayer, showOrbitsLayer,
        showBackgroundLayer, showCameraLayer, areConnectionsExpandable,
        showConnectionColor, showConnectionDelete,
        showPlanetSettings, animateLayer, isLinesActivationRequired, onLinesActivate,
        showLinesAdvancedOptions, showLineDrawAngle
    } = props;

    const { 
        connections, 
        objectsPanelPosition, 
        isAdvancedSettingsMode, 
        expandedLayers,
        updateUI, 
        clearUIGuidePulse, 
        uiGuidePulse, 
        markFeatureUsed,
        toggleLayer,
        expandLayerExclusively
    } = useAppStore(state => ({
        connections: state.connections,
        objectsPanelPosition: state.objectsPanelPosition,
        isAdvancedSettingsMode: state.isAdvancedSettingsMode,
        expandedLayers: state.expandedLayers,
        updateUI: state.actions.updateUI,
        clearUIGuidePulse: state.actions.clearUIGuidePulse,
        uiGuidePulse: state.uiGuidePulse,
        markFeatureUsed: state.actions.markFeatureUsed,
        toggleLayer: state.actions.toggleLayer,
        expandLayerExclusively: state.actions.expandLayerExclusively,
    }), shallow);
    
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const { handleMouseDown, handleTouchStart } = useDraggablePanel({
        panelRef,
        position: objectsPanelPosition,
        onPositionChange: (pos) => updateUI({ objectsPanelPosition: pos })
    });
    
    const contentStyle = useCollapseAnimation(isPanelCollapsed, contentRef);

    const hasAutoExpandedConnections = useRef(false);

    useEffect(() => {
        if (objectsPanelPosition === null) {
            const initialPos = {
                x: 20,
                y: Math.max(20, Math.min(window.innerHeight - 500, 60)),
            };
            updateUI({ objectsPanelPosition: initialPos });
        }
    }, [objectsPanelPosition, updateUI]);

    useEffect(() => {
        const currentCount = connections.length;
        
        // Only auto-expand if we go from 0 to > 0 connections, and only if we haven't done it yet in this session context.
        if (currentCount > 0 && !hasAutoExpandedConnections.current) {
            if (!expandedLayers.connections) {
                 toggleLayer('connections');
            }
            hasAutoExpandedConnections.current = true;
        }
        
        if (currentCount === 0) {
            hasAutoExpandedConnections.current = false;
        }
    }, [connections.length, expandedLayers.connections, toggleLayer]);

    const tooltips = {
        driftMode: "Creates a continuous parallax effect by slowly moving the entire scene (lines and stars) along a chosen axis, simulating motion through space.",
        driftAxisX: "Drift along the horizontal axis, creating a sideways panning effect.",
        driftAxisZ: "Drift along the depth axis, creating a fly-through effect.",
        fov: "Field of View (degrees). Controls the extent of the scene seen in perspective mode. Higher values are like a wide-angle lens.",
        lineDrawAngle: "Controls how often a line segment is drawn. Lower values create denser, smoother patterns but are more performance-intensive. Higher values create sparser, more geometric patterns.",
        realisticOrbits: "Orbits are scaled linearly based on real astronomical units (AU). Outer planets will be very far away. Enables realistic physics.",
        logarithmicOrbits: "Compresses the vast distances of outer planets to fit them comfortably in view. Good for seeing the whole system at once. Disables realistic physics.",
        circularOrbits: "Forces all orbits to be perfect circles, ignoring eccentricity. Creates more symmetrical, geometric patterns.",
        ellipticalOrbits: "Orbits are drawn as ellipses based on each planet's real eccentricity, resulting in more organic, realistic patterns.",
        flatOrbits: "All orbits are drawn on the same flat plane (the ecliptic), creating a 2D-like view.",
        orbitalInclination: "Each orbit is tilted according to its real inclination, creating a more complex, 3D structure.",
    };

    const handleMouseEnter = (e: React.MouseEvent, content: string) => {
        updateUI({ tooltip: { x: e.pageX, y: e.pageY, content } });
    };

    const handleMouseLeave = () => {
        updateUI({ tooltip: null });
    };

    // --- Layer Visibility & Animation Logic ---
    const animateLines = animateLayer === 'lines';
    const animateOrbits = animateLayer === 'orbits';
    const animateBackground = animateLayer === 'background';
    
    return (
        <div
            ref={panelRef}
            id="objects-panel"
            className={`fixed flex flex-col dynamic-blur border border-white/10 rounded-xl shadow-2xl text-white select-none z-10 w-80 pointer-events-auto overflow-hidden`}
            style={{
                top: `${objectsPanelPosition?.y ?? 0}px`,
                left: `${objectsPanelPosition?.x ?? 0}px`,
                visibility: objectsPanelPosition ? 'visible' : 'hidden',
                maxHeight: `calc(100vh - ${(objectsPanelPosition?.y ?? 0) + 20}px)`,
                minHeight: '40px',
            }}
            onMouseDown={() => {
                markFeatureUsed('objects_panel_interaction');
            }}
        >
            <div
                className="bg-white/5 px-3 py-2 rounded-t-xl cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-between"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">ASTRAL™ OBJECTS</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); updateUI({ isAdvancedSettingsMode: !isAdvancedSettingsMode }); }}
                        className={`p-1 rounded-md hover:bg-white/10 cursor-pointer ${isAdvancedSettingsMode ? 'bg-indigo-500/50' : ''}`}
                        title="Toggle Advanced Settings"
                    >
                        <SettingsIcon />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsPanelCollapsed(!isPanelCollapsed); }}
                        className="p-1 rounded-md hover:bg-white/10 cursor-pointer"
                        title={isPanelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
                    >
                        {isPanelCollapsed ? <PlusIcon/> : <MinusIcon/>}
                    </button>
                </div>
            </div>

                <div
                ref={contentRef}
                className="overflow-y-auto custom-scroll flex-1 min-h-0"
                style={contentStyle}
            >
                <div className="p-2 space-y-1">
                    {showConnectionsLayer && (
                        <div id="connections-layer">
                            <ConnectionsLayer
                                isExpanded={expandedLayers.connections}
                                onToggleExpand={() => toggleLayer('connections')}
                                onHeaderClick={() => expandLayerExclusively('connections')}
                                areConnectionsExpandable={areConnectionsExpandable}
                                showConnectionColor={showConnectionColor}
                                showConnectionDelete={showConnectionDelete}
                                showPlanetSettings={showPlanetSettings}
                            />
                        </div>
                    )}
                    {showLinesLayer && (
                        <div 
                            id="lines-layer" 
                            onClick={uiGuidePulse?.targetId === 'lines-layer' ? () => {
                                clearUIGuidePulse();
                                if(!expandedLayers.lines) expandLayerExclusively('lines');
                            } : undefined}
                        >
                            <LinesLayer
                                animate={animateLines}
                                isExpanded={expandedLayers.lines}
                                onToggleExpand={() => toggleLayer('lines')}
                                onHeaderClick={() => expandLayerExclusively('lines')}
                                isLiveLinesExpanded={expandedLayers.liveLines}
                                onToggleLiveLinesExpand={() => toggleLayer('liveLines')}
                                isSparklesExpanded={expandedLayers.sparkles}
                                onToggleSparklesExpand={() => toggleLayer('sparkles')}
                                tooltips={tooltips}
                                handleMouseEnter={handleMouseEnter}
                                handleMouseLeave={handleMouseLeave}
                                isActivationRequired={isLinesActivationRequired}
                                onActivate={onLinesActivate}
                                showAdvancedOptions={showLinesAdvancedOptions}
                                showLineDrawAngle={showLineDrawAngle}
                            />
                        </div>
                    )}
                    {showOrbitsLayer && (
                        <div id="orbits-layer">
                            <OrbitsLayer
                                animate={animateOrbits}
                                isExpanded={expandedLayers.orbits}
                                onToggleExpand={() => toggleLayer('orbits')}
                                onHeaderClick={() => expandLayerExclusively('orbits')}
                                isPlanetsExpanded={expandedLayers.planets}
                                onTogglePlanetsExpand={() => toggleLayer('planets')}
                                isLabelsExpanded={expandedLayers.labels}
                                onToggleLabelsExpand={() => toggleLayer('labels')}
                                isOrbitSettingsExpanded={expandedLayers.orbitSettings}
                                onToggleOrbitSettingsExpand={() => toggleLayer('orbitSettings')}
                                tooltips={tooltips}
                                handleMouseEnter={handleMouseEnter}
                                handleMouseLeave={handleMouseLeave}
                            />
                        </div>
                    )}
                    {/* New Realism Layer inserted here */}
                    <RealismLayer
                        isExpanded={expandedLayers.realism}
                        onToggleExpand={() => toggleLayer('realism')}
                        onHeaderClick={() => expandLayerExclusively('realism')}
                        tooltips={tooltips}
                        handleMouseEnter={handleMouseEnter}
                        handleMouseLeave={handleMouseLeave}
                        isJplExpanded={expandedLayers.jpl}
                        onToggleJplExpand={() => toggleLayer('jpl')}
                    />
                    
                    {showBackgroundLayer && (
                        <BackgroundLayer
                            animate={animateBackground}
                            isExpanded={expandedLayers.background}
                            onToggleExpand={() => toggleLayer('background')}
                            onHeaderClick={() => expandLayerExclusively('background')}
                            isStarsExpanded={expandedLayers.stars}
                            onToggleStarsExpand={() => toggleLayer('stars')}
                            isNebulaExpanded={expandedLayers.nebula}
                            onToggleNebulaExpand={() => toggleLayer('nebula')}
                            isSkyboxExpanded={expandedLayers.skybox}
                            onToggleSkyboxExpand={() => toggleLayer('skybox')}
                            isBgColorExpanded={expandedLayers.bgColor}
                            onToggleBgColorExpand={() => toggleLayer('bgColor')}
                        />
                    )}
                    {showCameraLayer && (
                        <div id="camera-layer">
                            <CameraLayer
                                isExpanded={expandedLayers.camera}
                                onToggleExpand={() => toggleLayer('camera')}
                                onHeaderClick={() => expandLayerExclusively('camera')}
                                tooltips={tooltips}
                                handleMouseEnter={handleMouseEnter}
                                handleMouseLeave={handleMouseLeave}
                            />
                        </div>
                    )}
                    <SoundLayer
                        isExpanded={expandedLayers.sound}
                        onToggleExpand={() => toggleLayer('sound')}
                        onHeaderClick={() => expandLayerExclusively('sound')}
                    />
                    {isAdvancedSettingsMode && (
                        <AdvancedLayer
                            isExpanded={expandedLayers.advanced}
                            onToggleExpand={() => toggleLayer('advanced')}
                            onHeaderClick={() => expandLayerExclusively('advanced')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ObjectsPanel;
