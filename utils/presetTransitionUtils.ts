
import { AppState, VisualsState, SimulationState, Connection } from '../types';
import { lerp } from './mathUtils';
import { hexToRgb, lerpRGB, rgbToHex } from './colorUtils';

export const ORTHO_HANDOVER_FOV = 29.9;
export const ORTHO_ZOOM_MULTIPLIER = 1;

const animatedVisibilityMap: { [key: string]: (keyof (VisualsState & SimulationState))[] } = {
    showOrbits: ['orbitOpacity', 'connectedOrbitOpacity'],
    showPlanets: ['planetOpacity'],
    showLines: ['webglLineBrightness'],
    showLabels: ['labelOpacity'],
    showNebula: ['nebulaOpacity'],
    showStars: ['starOpacity'],
    showLiveConnections: ['liveLineOpacity'],
    isMyceliumMode: ['myceliumVisualActivity', 'myceliumFlowIntensity', 'myceliumDisplacement', 'myceliumGlow'],
    ambientMotionMode: ['ambientMotionSpeed'],
};

const animatedSizeMap: { [key: string]: (keyof (VisualsState & SimulationState))[] } = {
    showPlanets: ['planetSizeMultiplier'],
    showLines: ['lineWidth'],
    showNebula: ['nebulaParticleSize'],
    showLabels: ['labelFontSize'],
    showStars: ['starSize'],
    showLiveConnections: ['liveLineWidth'],
    isSparkleMode: ['particleSize'],
};

export const setupFadeAnimations = (
    fromState: Partial<AppState>,
    endConfig: any,
    toState: Partial<AppState>
) => {
    const effectiveFromState = { ...fromState };
    const effectiveToState = { ...toState };
    const initialUpdates: Partial<AppState> = {};

    const isTruthy = (val: any) => {
        if (typeof val === 'string') return val !== 'none';
        return !!val;
    };

    const processAnimatedProperty = (
        map: Record<string, (keyof (VisualsState & SimulationState))[]>,
        defaultValue: number
    ) => {
        for (const key in map) {
            const boolKey = key as keyof typeof map;
            const propKeys = map[boolKey];
            const fromVal = fromState[boolKey as keyof typeof fromState];
            const toVal = endConfig[boolKey as keyof typeof endConfig];

            if (!isTruthy(fromVal) && isTruthy(toVal)) { // Turning ON (fade-in / grow)
                (initialUpdates as any)[boolKey] = toVal;
                propKeys.forEach(opKey => {
                    // Force start at 0 so it lerps up to target
                    (effectiveFromState as any)[opKey] = defaultValue;
                });
            } else if (isTruthy(fromVal) && !isTruthy(toVal)) { // Turning OFF (fade-out / shrink)
                propKeys.forEach(opKey => {
                    // Force target to 0 so it lerps down from current
                    (effectiveToState as any)[opKey] = defaultValue;
                });
            }
        }
    };

    processAnimatedProperty(animatedVisibilityMap, 0);
    processAnimatedProperty(animatedSizeMap, 0); // New: animate sizes to 0

    return { effectiveFromState, effectiveToState, initialUpdates };
};

export const calculateCameraModeUpdates = (
    fromState: Partial<AppState>,
    endConfig: any,
    currentState: AppState,
    elapsed: number
) => {
    const updates: Partial<AppState> = {};
    const fromRenderMode = fromState.renderMode ?? currentState.renderMode;
    const toRenderMode = endConfig.renderMode;
    const isSwitchingToOrtho = fromRenderMode === 'perspective' && toRenderMode === 'orthographic';
    const isSwitchingToPersp = fromRenderMode === 'orthographic' && toRenderMode === 'perspective';

    if (isSwitchingToPersp) {
        updates.renderMode = 'perspective';
    }
    
    if (isSwitchingToOrtho && elapsed < 30 && !currentState.transitionFov) {
        const fromFov = currentState.actualFov;
        const fromZoom = currentState.actualZoom;
        const toFov = ORTHO_HANDOVER_FOV;

        const tanTo = Math.tan((toFov * Math.PI / 180) / 2);
        const tanFrom = Math.tan((fromFov * Math.PI / 180) / 2);
        let toZoom = fromZoom * (tanFrom > 0.001 ? (tanTo / tanFrom) : 1);
        toZoom *= ORTHO_ZOOM_MULTIPLIER;
        
        updates.transitionFov = { from: fromFov, to: toFov };
        updates.transitionZoom = { from: fromZoom, to: toZoom };
    }

    return { updates, isSwitchingToOrtho };
};

export const calculateDriftUpdates = (
    fromState: Partial<AppState>,
    toState: Partial<AppState>,
    endConfig: any,
    currentState: AppState,
    easedProgress: number
) => {
    const updates: Partial<AppState> = {};
    const fromDriftOn = fromState.enableLineZDrift ?? false;
    const toDriftOn = endConfig.enableLineZDrift ?? false;
    const fromDriftSpeed = fromState.lineZDriftSpeed ?? 0;
    const toDriftSpeed = toState.lineZDriftSpeed ?? 0;

    if (fromDriftOn !== toDriftOn) {
        if (toDriftOn) { // OFF -> ON
            if (!currentState.enableLineZDrift) {
                updates.enableLineZDrift = true;
            }
            updates.lineZDriftSpeed = lerp(0, toDriftSpeed, easedProgress);
        } else { // ON -> OFF
            updates.lineZDriftSpeed = lerp(fromDriftSpeed, 0, easedProgress);
        }
    } else if (fromDriftOn && toDriftOn && fromDriftSpeed !== toDriftSpeed) {
        updates.lineZDriftSpeed = lerp(fromDriftSpeed, toDriftSpeed, easedProgress);
    }

    return updates;
};

export const calculateSpeedUpdate = (
    fromState: Partial<AppState>,
    toState: Partial<AppState>,
    progress: number
) => {
    const fromSpeed = fromState.timeSpeed ?? 1;
    const toSpeed = toState.timeSpeed ?? 1;

    if (fromSpeed === toSpeed) return {};

    // Complete the speed transition in the first 50% of the timeline
    const speedProgress = Math.min(progress / 0.5, 1.0);
    const easedT = 0.5 - 0.5 * Math.cos(speedProgress * Math.PI);

    let newSpeed;
    // Use logarithmic interpolation for speed to match the slider feel,
    // unless values are too small/negative where log implies NaN.
    if (fromSpeed <= 0.01 || toSpeed <= 0.01) {
        newSpeed = lerp(fromSpeed, toSpeed, easedT);
    } else {
        const logFrom = Math.log(fromSpeed);
        const logTo = Math.log(toSpeed);
        const currentLog = lerp(logFrom, logTo, easedT);
        newSpeed = Math.exp(currentLog);
    }

    return { timeSpeed: newSpeed };
};

const isColor = (key: string): boolean => key.toLowerCase().includes('color');

export const interpolateProperties = (
    keys: (keyof (VisualsState & SimulationState))[],
    fromState: any,
    toState: any,
    easedProgress: number,
    excludedKeys: Set<string>
) => {
    const updates: any = {};
    for (const key of keys) {
        if (excludedKeys.has(key as string)) continue;

        const fromValue = fromState[key];
        const toValue = toState[key];

        if (fromValue !== undefined && toValue !== undefined && fromValue !== toValue) {
            if (isColor(key as string) && typeof fromValue === 'string' && typeof toValue === 'string') {
                const fromRgb = hexToRgb(fromValue);
                const toRgb = hexToRgb(toValue);
                if (fromRgb && toRgb) {
                    const interpolatedRgb = lerpRGB(fromRgb, toRgb, easedProgress);
                    updates[key] = rgbToHex(interpolatedRgb);
                }
            } else if (typeof fromValue === 'number' && typeof toValue === 'number') {
                updates[key] = lerp(fromValue, toValue, easedProgress);
            }
        }
    }
    return updates;
};

export const calculateConnectionTransition = (
    progress: number,
    connectionsToUpdate: { from: Connection; to: Connection }[],
    connectionsToRemove: Connection[],
    connectionsToAdd: Connection[]
) => {
    let currentConnections: Connection[] = [];
    
    // Destruction phase (0.0 to 0.5)
    const destructionProgress = Math.min(1, progress / 0.5);
    const numSharedToRemove = Math.floor(destructionProgress * connectionsToUpdate.length);
    currentConnections.push(...connectionsToUpdate.slice(numSharedToRemove).map(c => c.from));
    
    const numOldToRemove = Math.floor(destructionProgress * connectionsToRemove.length);
    currentConnections.push(...connectionsToRemove.slice(numOldToRemove));

    // Creation phase (0.5 to 1.0)
    if (progress >= 0.5) {
        const creationProgress = (progress - 0.5) / 0.5;
        const numToAdd = Math.ceil(creationProgress * connectionsToAdd.length);
        currentConnections.push(...connectionsToAdd.slice(0, numToAdd));
    }

    // Final phase (1.0)
    if (progress >= 1) {
        // Add the final versions of updated connections
        currentConnections.push(...connectionsToUpdate.map(c => c.to));
    }

    return currentConnections;
};

export const calculateMidpointUpdates = (currentState: AppState, endConfig: any) => {
    const updates: Partial<AppState> = {};
    
    if (currentState.currentSystem !== endConfig.system) {
        updates.currentSystem = endConfig.system;
        updates.planetNodes = endConfig.planetNodes;
        updates.planetsToRender = endConfig.planetNodes;
        updates.planetDataOverrides = endConfig.planetDataOverrides;
        updates.hasSystemBeenChanged = true;
    }
    
    const keysToSync = [
        'useRealisticPhysics', 'logarithmicOrbits', 'ellipticalOrbits', 'orbitalInclination',
        'showUnconnectedLabels', 'showUnconnectedPlanets', 'useGradientBackground',
        'showBackgroundColor', 'showStarColors', 'webGLStarsOpposeDrift',
        'lineColorMode', 'lineGradient', 'orbitBlendMode', 'debugDoFMode',
    ];

    keysToSync.forEach(key => {
        const val = endConfig[key];
        if (val !== undefined && JSON.stringify(currentState[key as keyof AppState]) !== JSON.stringify(val)) {
            (updates as any)[key] = val;
        }
    });

    if (endConfig.ambientMotionMode !== 'none' && currentState.ambientMotionMode !== endConfig.ambientMotionMode) {
        updates.ambientMotionMode = endConfig.ambientMotionMode;
    }

    return updates;
};
