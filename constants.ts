
import type { CelestialBodyData } from './types/celestial';
import type { VisualsState, SimulationState } from './types';

declare const __APP_VERSION__: string;
export const APP_VERSION = __APP_VERSION__;

/** Dynamically resolved from the current deployment URL (no trailing slash). */
export const APP_URL = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}`;

export const PIKACHU_GIF_URL = "https://gifdb.com/images/high/sad-tearful-pikachu-xiy9fai77rsazyy4.webp";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const EPOCH_DATE = new Date('2000-01-01T12:00:00Z');

export const COLOR_PALETTE: string[] = [
    '#FF6B6B', '#FF9E7D', '#FFD93D', '#6BCF7F', '#4ECDC4', '#45B7D1', '#5C7CFA', '#845EC2',
    '#C34A36', '#E67E22', '#F39C12', '#27AE60', '#1ABC9C', '#2980B9', '#3498DB', '#9B59B6',
    '#E74C3C', '#D35400', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
    '#8C7853', '#FFC649', '#4A90E2', '#CD5C5C', '#DAA520', '#F4E4C1', '#4FD0E0', '#4B70DD',
    '#D2B48C', '#A9A9A9', '#8A2BE2', '#FF4500', '#8B0000', '#2E8B57', '#D2691E', '#F0F8FF',
    // TRAPPIST-1 Colors
    '#c78d52', '#c7a352', '#52c78d', '#528dc7', '#8d52c7', '#c7528d', '#c75252',
    // Kepler-90 Colors
    '#a6a6a6', '#bfbfbf', '#d9d9d9', '#55a1b2', '#5da493', '#73bf82', '#e5de73', '#e5b373',
];


// =================================================================================================
// --- APPLICATION BEHAVIOR & SENSITIVITY CONSTANTS ---
// =================================================================================================

// --- UI & Animation ---
export const FULLSCREEN_IDLE_TIMEOUT_MS = 2500;
export const CAMERA_RESET_DURATION_MS = 800;
export const NOTIFICATION_DURATION_MS = 2700;
export const SCRUB_HOLD_DELAY_MS = 200;
export const PLANET_HOVER_ANIMATION_MS = 250;
export const COLOR_PICKER_DEBOUNCE_MS = 50;
export const INTERPOLATABLE_PRESET_KEYS: (keyof (VisualsState & SimulationState))[] = [
    'timeSpeed', 'sceneScale', 'targetZoom', 'tilt', 'rotation', 'viewOffsetX', 'viewOffsetY', 'orbitColor',
    'labelColor', 'labelFontSize', 'labelOpacity', 'planetSizeMultiplier', 'planetOpacity', 'lineOpacityMultiplier',
    'lineWidth', 'lineDrawAngle', 'particleQuantity', 'particleSize', 'particleSpeed',
    'particleLifespan', 'particleDrag', 'targetFov', 'perspectiveFov', 'targetZOffset', 'lineZDriftSpeed', 'ambientMotionSpeed',
    'backgroundColor1', 'backgroundColor2', 'skyboxOpacity',
    'nebulaOpacity', 'nebulaParticleSize', 'nebulaYOffset', 'starCount', 'starSize', 'starOpacity',
    'starTwinkleAmount', 'webGLStarSpeed', 'webGLStarColor', 'liveLineWidth', 'liveLineOpacity',
    'particleDiamondRatio', 'particleGlowGamma', 'webglLineBrightness', 'lineSoftness', 'orbitOpacity',
    'connectedOrbitOpacity', 'lineColorMinDist', 'lineColorMaxDist', 'orbitLineWidth',
    // Mycelium
    'myceliumFlowSpeed', 'myceliumFlowIntensity', 'myceliumWiggleSpeed', 'myceliumPulseDensity', 'myceliumDisplacement', 
    'myceliumDisplacementScale', 'myceliumNoiseScale', 'myceliumTextureSpeed', 'myceliumTextureStretch', 'myceliumPulseWidth', 'myceliumVisualActivity', 'myceliumGlow',
    // DoF
    'dofStrength', 'dofFocusDistance', 'dofExponent', 'dofBlurBrightness'
];


// --- UI Layout ---
export const COLOR_PICKER_WIDTH = 220;
export const COLOR_PICKER_UI_MARGIN = 10;
export const COLOR_PICKER_SOURCE_MARGIN = 15;
export const TOOLTIP_MARGIN = 15;
export const MAX_PLANET_HOVER_RADIUS_PX = 15;
export const CONTROL_CIRCLE_SIZE_PX = 50;


// --- Input Sensitivity ---
export const CAMERA_DRAG_SENSITIVITY = 0.2;
export const CAMERA_DRAG_LERP_FACTOR = 0.15;
export const CAMERA_ZOOM_FACTOR = 0.1; // as 1 +/- this value
export const SLIDER_DRAG_SENSITIVITY_LOG_BASE = 200; // lower is more sensitive
export const SLIDER_DRAG_SENSITIVITY_LINEAR_BASE = 4; // lower is more sensitive
export const SLIDER_DRAG_FINE_TUNE_DIVISOR = 10;
export const SLIDER_DRAG_ULTRA_FINE_TUNE_DIVISOR = 100;

// --- Camera & View Limits ---
export const MIN_ZOOM = 0.01;
export const MAX_ZOOM = 100;
export const MIN_TILT = -180;
export const MAX_TILT = 180;

// --- Brush Limits ---
export const BRUSH_SIZE_MIN = 10;
export const BRUSH_SIZE_MAX = 300;

// --- Rendering ---
export const LINE_FADE_SECONDS = 2.0;
export const ORBIT_SEGMENTS_DEFAULT = 120;
export const ORBIT_SEGMENTS_MOON = 360;

// --- Physics & Simulation ---
export const ZOOM_LERP_FACTOR = 0.1;
export const FOV_LERP_FACTOR = 0.1;
export const Z_OFFSET_LERP_FACTOR = 0.05;
export const FRAME_TIME_SMOOTHING_FACTOR = 0.05;
export const PERTURBATION_DAMPING_CENTURIES = 1500; // 150,000 years

// --- Game ---
export const GAME_OVERLAY_PARALLAX_STRENGTH = 1.5;
export const GAME_OVERLAY_MIN_SCALE = 0.25;
export const GAME_OVERLAY_MAX_SCALE = 5.0;
export const GAME_STAGE_1_TARGET_CONNECTIONS = 3;
export const GAME_STAGE_3_TARGET_COLORS = 3;
export const GAME_STAGE_4_TARGET_SPEED = 4;
export const GAME_STAGE_5_TARGET_ZOOM = 0.4;
export const GAME_STAGE_6_TARGET_LINE_WIDTH = 0.5;
