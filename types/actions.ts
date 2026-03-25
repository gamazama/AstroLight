
import React from 'react';
import type { CelestialBodyData, Star, Line, Particle } from './celestial';
import type { ColorPickerInfo, ConnectionSuccessAnimation } from './common';
import type { SoundNode, SoundConnection, Instrument } from '../AstroSound/types';
import type { SimulationState } from './simulation';
import type { VisualsState, CoreVisualsState } from './visuals';
import type { UIState } from './uiState';
import type { SoundState } from '../AstroSound/types';
import type { AppState } from './state';

type FrameData = Pick<SimulationState, 'time' | 'lineHistory' | 'particles'> &
                 Pick<CoreVisualsState, 'actualZoom' | 'actualFov' | 'actualZOffsets'>;

// This interface consolidates all handler functions into a single, strongly-typed object.
// This object is provided via context, allowing any component to call any action without prop drilling.
export interface CoreActions {
    // State updaters for legacy context consumers
    updateSimulation: (data: Partial<SimulationState>) => void;
    updateVisuals: (data: Partial<VisualsState>) => void;
    updateUI: (data: Partial<UIState>) => void;
    updateSound: (data: Partial<SoundState>) => void;
    updateFrameData: (data: FrameData) => void;
    adjustParameter: (data: Partial<AppState>) => void;
    getCelestialBody: (name: string) => CelestialBodyData | undefined;
    
    // Core Handlers
    handleReset: () => void;
    handleStop: () => void;
    togglePlay: () => void;
    handleNew: () => void;
    setStartDateAndReset: (newDate: Date) => void;
    setEndDateAndReset: (newEndDate: Date) => void;
    openStartDatePicker: () => void;
    closeStartDatePicker: () => void;
    openEndDatePicker: () => void;
    closeEndDatePicker: () => void;
    clearEndDate: () => void;
    changeSystem: (systemName: string) => void;
    toggleBrushMode: () => void;
    toggleFullscreen: () => void;
    updateLineWidth: (delta: number) => void;
    updateLineBrightness: (delta: number) => void;
    
    // Scrub Handlers
    startSpeedScrub: () => void;
    stopSpeedScrub: () => void;
    startZOffsetScrub: () => void;
    stopZOffsetScrub: () => void;
    startDriftScrub: () => void;
    stopDriftScrub: () => void;
    startFovScrub: () => void;
    stopFovScrub: () => void;
    updateScrub: () => void;
    setDriftAxis: (axis: 'x' | 'z') => void;
    
    // Misc AppController Actions
    toggleRenderMode: () => void;
    setFov: (fov: number) => void;
    handleStartSandbox: (options?: { skipTransition?: boolean }) => void;
    handleGlobalMouseUp: () => void;

    // History Actions
    undo: () => void;
    redo: () => void;
    resetHistory: () => void;
    
    // Physics Handlers
    updatePlanetOverride: (planetName: string, property: keyof Pick<CelestialBodyData, 'orbitRadius' | 'eccentricity' | 'inclination' | 'period' | 'phaseOffset'>, value: number) => void;
    resetPlanetOverrides: (planetName: string) => void;
    resetPlanetPropertyOverride: (planetName: string, property: keyof Pick<CelestialBodyData, 'orbitRadius' | 'eccentricity' | 'inclination' | 'period' | 'phaseOffset'>) => void;
    toggleRealisticPhysics: (enabled: boolean) => void;
    
    // Connection Handlers
    handleNodeClick: (nodeId: number, e: React.MouseEvent<HTMLDivElement>) => void;
    removeConnection: (index: number, options?: { commitHistory?: boolean; notify?: boolean }) => void;
    clearConnections: () => void;
    updateConnectionPersistence: (index: number, multiplier: number) => void;
    resetConnectionToHarmonic: (index: number) => void;
    clearConnectionLine: () => void;
    createCanvasConnection: (fromNodeId: number, toNodeId: number) => void;
    createUiConnection: (fromNodeId: number, toNodeId: number) => void;
    startPlanetConnection: (fromNodeId: number, fromNodeColor: string, startX: number, startY: number, mode: 'drag' | 'click') => void;
    updatePlanetConnection: (position: { x: number, y: number }) => void;
    promotePlanetConnectionToClickMode: () => void;
    clearPlanetConnection: () => void;
    startConnectionSuccessAnimation: (animInfo: Omit<ConnectionSuccessAnimation, 'startTime'>) => void;
    
    // Color Picker Handlers
    openColorPicker: (target: ColorPickerInfo['target'], e: React.MouseEvent, initialColor: string) => void;
    closeColorPicker: (revert: boolean) => void;
    updateColor: (color: string) => void;
    closeConfirmationDialog: () => void;
    
    // Gradient Actions
    setGradientStop: (id: string, position: number) => void;
    addGradientStop: (position: number, color: string) => void;
    removeGradientStop: (id: string) => void;
    updateGradientStopColor: (id: string, color: string) => void;

    // Config Handlers
    loadPreset: (presetName: string) => void;
    loadPresetStatically: (presetName: string) => void;
    importConfig: (file: File) => void;
    exportConfig: (presetName?: string) => void;
    export3DModel: () => void;
    exportSVG: () => void; // NEW
    loadFromUrl: (configData: string) => void;
    
    // Share/Save Handlers
    saveImage: (options?: { showWatermark?: boolean; use8k?: boolean }) => void;
    getCanvasImageData: () => string | null;
    shareConfiguration: () => void;
    
    // Tutorial Handlers
    startTutorial: () => void;
    endTutorial: () => void;
    nextTutorialStep: () => void;
    prevTutorialStep: () => void;

    // Planet Modification Actions
    enterPlanetModificationMode: () => void;
    exitPlanetModificationMode: () => void;
    addPlanetEditorPanel: (planetId: number, position?: { x: number; y: number }) => void;
    removePlanetEditorPanel: (planetId: number) => void;
    updatePlanetEditorPanelPosition: (planetId: number, position: { x: number; y: number }) => void;
    
    // JPL HORIZONS Actions
    fetchJplPaths: () => Promise<void>;
    clearJplPaths: () => void;
    openJplDebugModal: (planetName: string) => void;
    closeJplDebugModal: () => void;
    
    // Sound Graph Handlers
    addNode: (type: string, position: { x: number; y: number }) => void;
    addNodePrefab: (prefabName: string, position: { x: number, y: number }) => void;
    deleteNodes: (nodeIds: string[]) => void;
    deleteConnection: (connectionId: string) => void;
    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
    updateNodePositions: (positions: { nodeId: string, position: { x: number; y: number; } }[]) => void;
    updateNodeParam: (nodeId: string, paramName: string, value: any) => void;
    selectNode: (nodeId: string | null, additive: boolean) => void;
    selectNodes: (nodeIds: string[], additive: boolean) => void;
    clearNodeSelection: () => void;
    startConnection: (fromNodeId: string, fromOutput: string) => void;
    startBackwardConnection: (toNodeId: string, toInput: string) => void;
    moveConnection: (to: { x: number, y: number }) => void;
    endConnection: (endTarget: { toNodeId: string; toInput: string } | { fromNodeId: string; fromOutput: string } | null) => void;
    reconnectFromInput: (toNodeId: string, toInput: string) => void;
    startRewireFromInputEnd: (connectionId: string) => void;
    startRewireFromOutputEnd: (connectionId: string) => void;
    createRerouterNode: (connectionId: string, position: { x: number; y: number }) => void;
    panAndZoomCanvas: ( { dx, dy, dZoom, mouseX, mouseY }: { dx: number, dy: number, dZoom: number, mouseX?: number, mouseY?: number } ) => void;
    newSoundGraph: () => void;
    exportSoundGraph: () => void;
    importSoundGraph: (file: File) => void;
    addNodesAndConnections: (payload: { nodes: SoundNode[], connections: SoundConnection[] }) => void;
    toggleNodeInput: (nodeId: string, paramName: string) => void;
    handleDuplicateSelection: (delta: { dx: number, dy: number }, initialPositions?: Map<string, { x: number; y: number }>) => void;
    openSaveInstrumentModal: () => void;
    closeSaveInstrumentModal: () => void;
    updateInstrumentToSaveInfo: (field: 'name' | 'description', value: string) => void;
    saveInstrument: () => void;
    addInstrumentInstance: (instrumentName: string) => void;
    removeInstrumentInstance: (instanceId: string) => void;
    updateInstrumentParam: (instanceId: string, paramNodeId: string, value: number) => void;
    updateInstrumentDataSource: (instanceId: string, dataSourceNodeId: string, connectionIndex: number) => void;
    openInstrumentDataModal: (instrument: Instrument) => void;
    closeInstrumentDataModal: () => void;
    setSoundUiUpdateRate: (rate: number) => void;

    // Sound Handlers
    toggleSound: (enabled?: boolean) => void;

    // Misc
    showNotification: (message: string, duration?: number) => void;
    clearUIGuidePulse: () => void;
    setHoveredPlanetId: (id: number | null) => void;
    clearShareSnapshotEffect: () => void;

    // New actions for undoable hotkeys
    toggleShowOrbits: () => void;
    toggleShowPlanets: () => void;
    toggleShowLiveConnections: () => void;
    toggleIsSparkleMode: () => void;
    toggleMyceliumMode: () => void; // Added
    resetTargetZOffset: () => void;
    toggleDriftMode: () => void;
    disableDriftMode: () => void;
    removePivot: () => void; // Added

    // Beginner Mode / Layer Management
    toggleBeginnerMode: () => void;
    markFeatureUsed: (featureId: string) => void;
    dismissHint: (hintId: string) => void;
    setCurrentHint: (hintId: string | null) => void;
    toggleLayer: (layer: string) => void;
    expandLayerExclusively: (layerToExpand: string, forceOpen?: boolean) => void;
    
    onSaveImage: () => void;
}
