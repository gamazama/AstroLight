
import type { PlanetNode } from './simulation';
import type { Instrument, SoundNode } from '../AstroSound/types';
import type { ColorPickerInfo, TooltipInfo, ConnectionLineInfo, ConnectionSuccessAnimation, PlanetConnectionDragInfo } from './common';
import type { Connection, CelestialBodyData, SimulationState, VisualsState } from './index';

export interface PlanetEditorPanelState {
  planetId: number;
  position: { x: number; y: number };
}

export interface PresetTransitionState {
  isActive: boolean;
  startTime: number;
  duration: number;
  fromState: Partial<VisualsState & SimulationState>;
  toState: Partial<VisualsState & SimulationState>;
  connectionsToRemove: Connection[];
  connectionsToAdd: Connection[];
  connectionsToUpdate: { from: Connection, to: Connection }[];
  endConfig: {
    system: string;
    connections: Connection[];
    planetNodes: PlanetNode[];
    planetDataOverrides: Record<string, Partial<CelestialBodyData>>;
    documentName: string;
    startDate?: Date;
    endDate?: Date | null;
    useRealisticPhysics: boolean;
    ellipticalOrbits: boolean;
    logarithmicOrbits: boolean;
    orbitalInclination: boolean;
    renderMode: 'orthographic' | 'perspective';
    ambientMotionMode: 'none' | 'orbit' | 'wobble' | 'drift';
    lineBlendMode: GlobalCompositeOperation;
    lineDriftAxis: 'x' | 'z';
    enableLineZDrift: boolean;
    isSkyboxEnabled: boolean;
    skyboxImage: string;
  };
}

export interface BeginnerModeState {
    isActive: boolean;
    featureUsage: Record<string, boolean>; // Tracks if a feature has been used/discovered
    dismissedHints: string[]; // IDs of hints the user explicitly dismissed
    currentHintId: string | null;
    interactionCounts: Record<string, number>;
}

/**
 * Contains all state related to the application's UI, panels, modals, and transient interactions.
 */
export interface UIState {
  // --- App Lifecycle ---
  showIntroScreen: boolean;
  isIntroTransitioning: boolean;
  hasSystemBeenChanged: boolean;
  documentName: string;
  
  // --- Beginner Mode ---
  beginnerMode: BeginnerModeState;

  // --- Panels & Modals ---
  isControlPanelCollapsed: boolean;
  isTimeDatePanelCollapsed: boolean;
  isPresetsPanelCollapsed: boolean;
  isPlanetInfoPanelCollapsed: boolean;
  isBottomControlsCollapsed: boolean;
  isShortcutsModalOpen: boolean;
  isAboutModalOpen: boolean;
  isStartDatePickerOpen: boolean;
  isEndDatePickerOpen: boolean;
  isBrushPanelCollapsed: boolean;
  isSettingsPanelOpen: boolean;
  isJplPanelOpen: boolean;
  uiBackgroundOpacity: number;
  uiBlurAmount: number;
  isPerformanceMode: boolean;
  isSoundCreator2Open: boolean;
  isSaveInstrumentModalOpen: boolean;
  instrumentToSaveInfo: { name: string; description: string } | null;
  instrumentDataModalContent: Instrument | null;
  openTopMenuDropdown: string | null;
  objectsPanelPosition: { x: number; y: number } | null;
  settingsPanelPosition: { x: number; y: number } | null;
  jplPanelPosition: { x: number; y: number } | null;
  confirmationDialog: {
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  isPlanetModificationMode: boolean;
  planetEditorPanels: PlanetEditorPanelState[];
  isAdvancedSettingsMode: boolean;
  
  // --- Layer State (Global for Tutorial Access) ---
  expandedLayers: Record<string, boolean>;
  selectedConnectionId: number | null;
  
  // --- Sound Creator UI ---
  soundCreator: {
    transform: { x: number; y: number; k: number }; // Pan and zoom state
    selectedNodeIds: string[];
    drawingConnection: {
        type: 'forward'; // from output to input
        fromNodeId: string;
        fromOutput: string;
        to?: { x: number, y: number };
    } | {
        type: 'backward'; // from input to output
        toNodeId: string;
        toInput: string;
        from?: { x: number, y: number };
    } | null;
  };
  duplicationPreviewNodes: SoundNode[] | null;
  soundUiUpdateRate: number;

  // --- Transient UI Elements ---
  backgroundLoadingProgress: number | null; // 0-100, null if hidden
  colorPicker: ColorPickerInfo | null;
  notification: string;
  tooltip: TooltipInfo | null;
  connectionLine: ConnectionLineInfo | null;
  connectionSuccessAnimation: ConnectionSuccessAnimation | null;
  planetConnectionDragInfo: PlanetConnectionDragInfo | null;
  shareSnapshotEffect: { startTime: number } | null;
  
  // --- Interaction & Performance ---
  connectingNodeId: number | null;
  selectedPlanet: PlanetNode | null;
  frameTime: number; // The smoothed time in ms to render a single frame.
  isFullscreen: boolean;
  isCameraDragging: boolean;
  isCameraPanning: boolean;
  isResettingCamera: boolean;
  isSpeedScrubbing: boolean;
  isZOffsetScrubbing: boolean;
  isDriftScrubbing: boolean;
  isFovScrubbing: boolean;
  isMouseDown: boolean;
  adjustmentPending: boolean;

  // --- Tutorial State ---
  tutorialStep: number | null;
  tutorialConnectionId: number | null;
  tutorialForcedHoverPlanetId: number | null;

  // --- Game UI State (Cleaned up) ---
  controlCircle: {
    visible: boolean;
    x: number;
    y: number;
    size: number;
  } | null;
  uiGuidePulse: {
    targetId: string;
    loop?: boolean;
  } | null;

  // --- Orbit Interaction State ---
  hoveredPlanetId: number | null;
  hoveredPlanetPosition: { x: number; y: number } | null;
  hoveredPlanetAnimation: {
    growing?: { startTime: number; planetId: number };
    shrinking?: { startTime: number; planetId: number };
  } | null;
  infoPanelPlanetId: number | null;
  canvasConnectingFromNodeId: number | null;
  mousePosition: { x: number; y: number; };
  canvasHoverState: {
    planetId: number;
    mouseX: number;
    mouseY: number;
  } | null;

  // --- Sound Engine Status ---
  soundEngineStatus: {
    isLoading: boolean;
    error: string | null;
  };

  // --- JPL HORIZONS ---
  jplFetchStatus: Record<string, 'idle' | 'fetching' | 'success' | 'error'>;
  jplPrecision: number;
  jplFetchSelection: string[];
  jplTargetType: 'barycenter' | 'planet_center';
  jplDebugData: {
    planetName: string;
    rawData: string;
  } | null;
  
  // --- Debugging ---
  debugShowOrbitMask: boolean;
  presetTransition: PresetTransitionState | null;
  isPresetTransitioning: boolean;
}
