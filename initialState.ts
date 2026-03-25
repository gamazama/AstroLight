
import type { SimulationState, CoreVisualsState, UIState, BackgroundState, VisualsState, HistoryState, TemporalState, PlanetEditorPanelState, UndoableVisualsState, UndoableSimulationState, SoundNode } from './types/index';
import type { SoundState } from './AstroSound/types';
import { STAR_SYSTEMS } from './data/starSystems';
import { initialSoundState } from './AstroSound/soundStore';

const solSystem = STAR_SYSTEMS['Sol'];

export const initialSimulationState: SimulationState = {
    currentSystem: 'Sol',
    planetNodes: solSystem.celestialBodies.map((p, i) => ({ id: i + 1, name: p.name, color: p.color })),
    planetsToRender: solSystem.celestialBodies.map((p, i) => ({ id: i + 1, name: p.name, color: p.color })),
    connections: [],
    time: 0,
    startDate: new Date(),
    endDate: null,
    planetDataOverrides: {},
    isPlaying: true,
    timeSpeed: 1,
    useRealisticPhysics: true,
    useJplHorizons: false,
    ellipticalOrbits: true,
    logarithmicOrbits: false,
    orbitalInclination: true,
    sceneScale: 1,
    logarithmicOrbitsT: 0, // Matches logarithmicOrbits: false
    ellipticalOrbitsT: 1, // Matches ellipticalOrbits: true
    orbitalInclinationT: 1, // Matches orbitalInclination: true
    lineHistory: [],
    particles: [],
    highPrecisionPaths: {},
};

export const initialVisualsState: CoreVisualsState = {
    targetZoom: 1,
    actualZoom: 1,
    tilt: 0,
    rotation: 0,
    viewOffsetX: 0,
    viewOffsetY: 0,
    
    // --- World Transform ---
    pivotPoint: null,
    pivotOffset: { x: 0, y: 0, z: 0 },
    worldRotation: { x: 0, y: 0, z: 0 },
    showPivot: true,
    pivotStartTime: 0,
    pivotClosingStartTime: null,
    
    showOrbits: true,
    orbitColor: '#ffffff',
    orbitLineWidth: 1.5,
    orbitBlendMode: 'source-over',
    showLabels: true,
    labelColor: '#e0e6ed',
    labelFontSize: 12,
    labelOpacity: 0.8,
    showUnconnectedLabels: false,
    showPlanets: true,
    planetSizeMultiplier: 1.0,
    planetOpacity: 1.0,
    showUnconnectedPlanets: false,
    showLines: true,
    showLiveConnections: true,
    liveLineWidth: 0.75,
    liveLineOpacity: 1.0,
    showNebula: true,
    lineOpacityMultiplier: 1,
    lineWidth: 0.3333,
    lineDrawAngle: 3,
    
    lineColorMode: 'constant',
    lineColorByDistance: false, // Deprecated
    lineColorMinDist: '#4ECDC4', // Deprecated
    lineColorMaxDist: '#C34A36', // Deprecated
    lineGradient: [
        { id: '1', position: 0, color: '#4ECDC4' },
        { id: '2', position: 1, color: '#C34A36' }
    ],

    maxLines: 50000,
    isSparkleMode: true,
    isMyceliumMode: false,
    // Mycelium Defaults (Updated)
    myceliumFlowSpeed: 2.5,
    myceliumFlowIntensity: 0.3,
    myceliumWiggleSpeed: 0.2,
    myceliumPulseDensity: 1.0,
    myceliumDisplacement: 0.15,
    myceliumDisplacementScale: 0.5,
    myceliumNoiseScale: 30.0,
    myceliumTextureSpeed: 4.0,
    myceliumTextureStretch: 15.0, 
    myceliumPulseWidth: 0.02,
    myceliumVisualActivity: 0.3,
    myceliumGlow: 1.0,
    
    dofStrength: 0,
    dofFocusDistance: 0, // Center focus
    dofExponent: 1.5, 
    dofBlurBrightness: 0.2,
    dofBlurType: 'bokeh',
    debugDoFMode: 'none',

    particleQuantity: 10,
    particleSize: 1.3,
    particleSpeed: 1,
    particleLifespan: 0.8,
    particleDrag: 1.5,
    particleDiamondRatio: 0,
    particleGlowGamma: 3.5,
    renderMode: 'orthographic',
    targetFov: 31,
    perspectiveFov: 75,
    actualFov: 30,
    lineBlendMode: 'screen',
    targetZOffset: 0,
    actualZOffsets: {},
    enableLineZDrift: false,
    lineZDriftSpeed: 10,
    lineDriftAxis: 'z',
    orbitOpacity: 0.06,
    connectedOrbitOpacity: 0.5,
    isBrushMode: false,
    brushColor: '#FF6B6B',
    brushSize: 50,
    brushStrength: 0.5,
    ambientMotionMode: 'none',
    ambientMotionSpeed: 0.5,
    debugDisableLines: false,
    debugDisableStars: false,
    debugDisableParticles: false,
    webglLineBrightness: 0.333,
    minLineAlpha: 0.001,
    lineSoftness: 0.5,
    disableCameraSmoothing: false,
    transitionFov: null,
    transitionZoom: null,
};

export const initialBackgroundState: BackgroundState = {
    backgroundColor1: '#0C1130',
    backgroundColor2: '#1a1f3a',
    useGradientBackground: true,
    showBackgroundColor: true,
    isSkyboxEnabled: false,
    skyboxOpacity: 1,
    skyboxImage: `${import.meta.env.BASE_URL}images/milkyway.jpg`,
    nebulaOpacity: 0.12,
    nebulaParticleSize: 100,
    nebulaYOffset: 0,
    showStars: true,
    starCount: 20000,
    starSize: 1.0,
    starOpacity: 0.5,
    showStarColors: true,
    starTwinkleAmount: 0.4,
    webGLStarSpeed: 0.3,
    webGLStarColor: '#ffffff',
    webGLStarsOpposeDrift: true,
};

export const fullInitialVisualsState: VisualsState = {
    ...initialVisualsState,
    ...initialBackgroundState,
};

export const initialUIState: UIState = {
  showIntroScreen: true,
  isIntroTransitioning: false,
  hasSystemBeenChanged: false,
  documentName: 'Untitled Creation',
  // --- Beginner Mode ---
  beginnerMode: {
      isActive: true,
      featureUsage: {},
      dismissedHints: [],
      currentHintId: null,
      interactionCounts: {},
  },
  // --- Layer State ---
  expandedLayers: {
    connections: false,
    camera: false,
    stars: false,
    nebula: false,
    liveLines: false,
    sparkles: false,
    mycelium: false,
    jpl: false, 
    background: false,
    lines: false,
    orbits: false,
    orbitSettings: false, // New
    realism: false, // New
    planets: false,
    labels: false,
    sound: false,
    skybox: false,
    bgColor: false,
    advanced: true,
    dof: false, // New Layer
  },
  selectedConnectionId: null,
  isControlPanelCollapsed: false,
  isTimeDatePanelCollapsed: false,
  isPresetsPanelCollapsed: false,
  isPlanetInfoPanelCollapsed: false,
  isBottomControlsCollapsed: true,
  isShortcutsModalOpen: false,
  isAboutModalOpen: false,
  isStartDatePickerOpen: false,
  isEndDatePickerOpen: false,
  isBrushPanelCollapsed: false,
  isSettingsPanelOpen: false,
  isJplPanelOpen: false,
  jplFetchStatus: {},
  jplPrecision: 5,
  jplFetchSelection: [],
  jplTargetType: 'barycenter',
  jplDebugData: null,
  jplPanelPosition: null,
  uiBackgroundOpacity: 0.2,
  uiBlurAmount: 10,
  isPerformanceMode: false,
  isSoundCreator2Open: false,
  isSaveInstrumentModalOpen: false,
  instrumentToSaveInfo: null,
  instrumentDataModalContent: null,
  openTopMenuDropdown: null,
  objectsPanelPosition: null,
  settingsPanelPosition: null,
  confirmationDialog: null,
  isPlanetModificationMode: false,
  planetEditorPanels: [],
  isAdvancedSettingsMode: false,
  soundCreator: {
    transform: { x: 0, y: 0, k: 1 },
    selectedNodeIds: [],
    drawingConnection: null,
  },
  duplicationPreviewNodes: null,
  soundUiUpdateRate: 10,
  backgroundLoadingProgress: null, // Initialized to null (hidden)
  colorPicker: null,
  notification: '',
  tooltip: null,
  connectionLine: null,
  connectionSuccessAnimation: null,
  planetConnectionDragInfo: null,
  shareSnapshotEffect: null,
  connectingNodeId: null,
  selectedPlanet: null,
  frameTime: 16.67, // The smoothed time in ms to render a single frame.
  isFullscreen: false,
  isCameraDragging: false,
  isCameraPanning: false,
  isResettingCamera: false,
  isSpeedScrubbing: false,
  isZOffsetScrubbing: false,
  isDriftScrubbing: false,
  isFovScrubbing: false,
  isMouseDown: false,
  adjustmentPending: false,
  tutorialStep: null,
  tutorialConnectionId: null,
  tutorialForcedHoverPlanetId: null,
  controlCircle: null,
  uiGuidePulse: null,
  hoveredPlanetId: null,
  hoveredPlanetPosition: null,
  hoveredPlanetAnimation: null,
  infoPanelPlanetId: null,
  canvasConnectingFromNodeId: null,
  mousePosition: { x: 0, y: 0 },
  canvasHoverState: null,
  soundEngineStatus: {
    isLoading: false,
    error: null,
  },
  debugShowOrbitMask: false,
  presetTransition: null,
  isPresetTransitioning: false,
};

const pluck = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        result[key] = obj[key];
    });
    return result;
}

const undoableSimKeys = (Object.keys(initialSimulationState) as (keyof SimulationState)[])
    .filter(k => k !== 'time' && k !== 'lineHistory' && k !== 'particles' && k !== 'highPrecisionPaths');

const transientVisualsKeys: (keyof VisualsState)[] = [
    'actualZoom',
    'actualFov',
    'actualZOffsets',
    'tilt',
    'rotation',
    'viewOffsetX',
    'viewOffsetY',
];
const undoableVisualsKeys = ([
    ...Object.keys(initialVisualsState),
    ...Object.keys(initialBackgroundState)
] as (keyof VisualsState)[]).filter(key => !transientVisualsKeys.includes(key));


export const getInitialTemporalState = (): TemporalState => ({
    simulationState: pluck(initialSimulationState, undoableSimKeys as (keyof UndoableSimulationState)[]),
    visualsState: pluck(fullInitialVisualsState, undoableVisualsKeys as (keyof UndoableVisualsState)[]),
    documentName: initialUIState.documentName,
});

export const initialHistoryState: HistoryState = {
    past: [],
    present: getInitialTemporalState(),
    future: [],
    isTimeTraveling: false,
};
