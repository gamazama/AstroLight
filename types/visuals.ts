
import { GradientStop } from "./common";

/**
 * Contains all state related to the core visual presentation, excluding background elements.
 * This includes camera, line rendering, orbit rendering, and interaction effects.
 */
export interface CoreVisualsState {
    targetZoom: number;
    actualZoom: number;
    tilt: number;
    rotation: number;
    viewOffsetX: number;
    viewOffsetY: number;
    
    // --- World Transform (New Gizmo System) ---
    pivotPoint: { x: number, y: number, z: number } | null;
    pivotOffset: { x: number, y: number, z: number }; // Compensation for pivot moves
    worldRotation: { x: number, y: number, z: number };
    showPivot: boolean;
    pivotStartTime: number;
    pivotClosingStartTime: number | null;
    
    showOrbits: boolean;
    orbitColor: string;
    orbitLineWidth: number;
    orbitBlendMode: GlobalCompositeOperation;

    showLabels: boolean;
    labelColor: string;
    labelFontSize: number;
    labelOpacity: number;
    showUnconnectedLabels: boolean;

    showPlanets: boolean;
    planetSizeMultiplier: number;
    planetOpacity: number;
    showUnconnectedPlanets: boolean;

    showLines: boolean;
    showLiveConnections: boolean;
    liveLineWidth: number;
    liveLineOpacity: number;
    showNebula: boolean;
    lineOpacityMultiplier: number;
    lineWidth: number;
    lineDrawAngle: number;
    
    // Coloring
    lineColorMode: 'constant' | 'distance' | 'orbit';
    lineColorByDistance: boolean; // Deprecated, kept for preset compatibility (mapped to mode)
    lineColorMinDist: string;     // Deprecated, kept for preset compatibility
    lineColorMaxDist: string;     // Deprecated, kept for preset compatibility
    lineGradient: GradientStop[];

    maxLines: number;
    isSparkleMode: boolean;
    isMyceliumMode: boolean; 
    // Mycelium Controls
    myceliumFlowSpeed: number;
    myceliumFlowIntensity: number;
    myceliumWiggleSpeed: number;
    myceliumPulseDensity: number;
    myceliumDisplacement: number;
    myceliumDisplacementScale: number;
    myceliumNoiseScale: number; // effectively Texture Scale
    myceliumTextureSpeed: number;
    myceliumTextureStretch: number; // New: Controls radial/angular stretching
    myceliumPulseWidth: number;
    myceliumVisualActivity: number; // effectively Texture Intensity
    myceliumGlow: number;

    // Depth of Field
    dofStrength: number; // Aperture Size
    dofFocusDistance: number; // View space units
    dofExponent: number; // Blur falloff curve
    dofBlurBrightness: number; // 0 (Physical) to 1 (Boosted)
    dofBlurType: 'gaussian' | 'bokeh'; // Profile shape
    debugDoFMode: 'none' | 'coc' | 'depth' | 'cap'; // 0=None, 1=CoC Heatmap, 2=Depth Map, 3=Tip Fade

    particleQuantity: number;
    particleSize: number;
    particleSpeed: number;
    particleLifespan: number;
    particleDrag: number;
    particleDiamondRatio: number;
    particleGlowGamma: number;
    renderMode: 'orthographic' | 'perspective';
    targetFov: number;
    perspectiveFov: number;
    actualFov: number;
    lineBlendMode: GlobalCompositeOperation;
    targetZOffset: number;
    actualZOffsets: Record<string, number>;
    enableLineZDrift: boolean;
    lineZDriftSpeed: number;
    lineDriftAxis: 'x' | 'z';
    orbitOpacity: number;
    connectedOrbitOpacity: number;
    isBrushMode: boolean;
    brushColor: string;
    brushSize: number;
    brushStrength: number;
    ambientMotionMode: 'none' | 'orbit' | 'wobble' | 'drift' | 'figure8' | 'spiral' | 'survey' | 'float';
    ambientMotionSpeed: number;
    debugDisableLines: boolean;
    debugDisableStars: boolean;
    debugDisableParticles: boolean;
    webglLineBrightness: number;
    minLineAlpha: number;
    lineSoftness: number;
    disableCameraSmoothing: boolean;
    transitionFov: { from: number; to: number } | null;
    transitionZoom: { from: number; to: number } | null;
}

/**
 * Contains all state related to the background, including colors, stars, and skybox.
 */
export interface BackgroundState {
    backgroundColor1: string;
    backgroundColor2: string;
    useGradientBackground: boolean;
    showBackgroundColor: boolean;
    isSkyboxEnabled: boolean;
    skyboxOpacity: number;
    skyboxImage: string;
    nebulaOpacity: number;
    nebulaParticleSize: number;
    nebulaYOffset: number;
    showStars: boolean;
    starCount: number;
    starSize: number;
    starOpacity: number;
    showStarColors: boolean;
    starTwinkleAmount: number;
    webGLStarSpeed: number;
    webGLStarColor: string;
    webGLStarsOpposeDrift: boolean;
}

/**
 * The complete visual state, combining core visuals and background visuals.
 */
export type VisualsState = CoreVisualsState & BackgroundState;
