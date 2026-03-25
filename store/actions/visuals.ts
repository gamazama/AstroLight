
import type { StoreSet, StoreGet } from '../appStore';
import type { AppState, CelestialBodyData } from '../../types';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { EPOCH_DATE, MS_PER_DAY } from '../../constants';
import { lerp } from '../../utils/mathUtils';
import { interactionState } from '../interactionState';
import { rgbToHex, lerpRGB, hexToRgb, sampleGradient } from '../../utils/colorUtils';

export const createVisualsAndPhysicsActions = (set: StoreSet, get: StoreGet) => ({
    // --- VISUALS ---
    toggleRenderMode: () => {
        const s = get();
        if (s.isResettingCamera) return;

        // Tracking for Beginner Mode
        get().actions.markFeatureUsed('render_mode_toggled');

        if (s.renderMode === 'perspective') {
            // --- PERSPECTIVE to ORTHOGRAPHIC ---
            const fromFov = s.actualFov;
            const fromZoom = s.actualZoom;
            const toFov = 29.9; // Formerly s.orthoHandoverFov

            const tanTo = Math.tan((toFov * Math.PI / 180) / 2);
            const tanFrom = Math.tan((fromFov * Math.PI / 180) / 2);
            let toZoom = fromZoom * (tanFrom > 0.001 ? (tanTo / tanFrom) : 1);
            toZoom *= 0.75; // Formerly s.orthoZoomMultiplier
            
            set({
                transitionFov: { from: fromFov, to: toFov },
                transitionZoom: { from: fromZoom, to: toZoom },
            });

        } else {
            // --- ORTHOGRAPHIC to PERSPECTIVE ---
            const toFov = s.perspectiveFov; // Use the stored value
        
            // Set the new target FOV for the simulation loop to use. This is important.
            set({ targetFov: toFov });
            
            // Switch mode immediately
            set({ renderMode: 'perspective' });
            
            // Set up the transition. Re-read state as it has changed.
            const s_after = get(); 
            const fromFov = s_after.actualFov;
            const fromZoom = s_after.actualZoom;
            
            const tanTo = Math.tan((toFov * Math.PI / 180) / 2);
            const tanFrom = Math.tan((fromFov * Math.PI / 180) / 2);
            let toZoom = (fromZoom) * (tanFrom > 0.001 ? (tanTo / tanFrom) : 1);
            toZoom *= 1.333; // Formerly s.perspZoomMultiplier

            set({
                transitionFov: { from: fromFov, to: toFov },
                transitionZoom: { from: fromZoom, to: toZoom },
            });
        }
    },
    setFov: (fov: number) => {
        const s = get();
        const tanNew = Math.tan((fov * Math.PI / 180) / 2);
        
        if (s.transitionFov && s.transitionZoom) {
            const newFromFov = s.actualFov;
            const newFromZoom = s.actualZoom;
            
            const tanFrom = Math.tan((newFromFov * Math.PI / 180) / 2);
            let newToZoom = newFromZoom * (tanFrom > 0.001 ? (tanNew / tanFrom) : 1);
            newToZoom *= 1.333; // Formerly s.perspZoomMultiplier
    
            set({
                targetFov: fov,
                perspectiveFov: fov,
                transitionFov: { from: newFromFov, to: fov },
                transitionZoom: { from: newFromZoom, to: newToZoom },
            });
        } else {
            const tanOld = Math.tan((s.targetFov * Math.PI / 180) / 2);
            const ratio = (tanOld > 0.001 ? (tanNew / tanOld) : 1);
            const newZoom = s.targetZoom * ratio;
            get().actions.adjustParameter({ targetFov: fov, perspectiveFov: fov, targetZoom: newZoom });
        }
    },
    updateLineWidth: (delta: number) => {
        get().actions.adjustParameter({ lineWidth: Math.max(0.01, Math.min(20, get().lineWidth * (1 + delta))) });
    },
    updateLineBrightness: (delta: number) => {
        const currentBrightness = get().webglLineBrightness;
        let newBrightness;
        if (currentBrightness === 0 && delta > 0) {
            newBrightness = 0.01;
        } else {
            newBrightness = currentBrightness * (1 + delta);
        }
        newBrightness = Math.max(0.0, Math.min(2.0, newBrightness));
        get().actions.adjustParameter({ webglLineBrightness: newBrightness });
    },
    toggleBrushMode: () => {
        get().actions.markFeatureUsed('brush_mode_toggled');
        set(state => ({ isBrushMode: !state.isBrushMode }));
    },
    toggleMyceliumMode: () => {
        get().actions.adjustParameter({ isMyceliumMode: !get().isMyceliumMode });
    },
    
    // --- UNDOABLE HOTKEY ACTIONS ---
    toggleShowOrbits: () => get().actions.adjustParameter({ showOrbits: !get().showOrbits }),
    toggleShowPlanets: () => get().actions.adjustParameter({ showPlanets: !get().showPlanets }),
    toggleShowLiveConnections: () => get().actions.adjustParameter({ showLiveConnections: !get().showLiveConnections }),
    toggleIsSparkleMode: () => get().actions.adjustParameter({ isSparkleMode: !get().isSparkleMode }),
    resetTargetZOffset: () => get().actions.adjustParameter({ targetZOffset: 0 }),

    toggleDriftMode: () => {
        const s = get();
        const willEnable = !s.enableLineZDrift;
        
        if (s.lineDriftAxis === 'x') {
            get().actions.adjustParameter({ enableLineZDrift: willEnable, rotation: -s.rotation });
        } else {
            get().actions.adjustParameter({ enableLineZDrift: willEnable });
        }
    },
    disableDriftMode: () => {
        const s = get();
        if (!s.enableLineZDrift) return; 

        if (s.lineDriftAxis === 'x') {
             get().actions.adjustParameter({ enableLineZDrift: false, rotation: -s.rotation });
        } else {
             get().actions.adjustParameter({ enableLineZDrift: false });
        }
    },

    removePivot: () => {
        const s = get();
        if (!s.pivotPoint) return;
        
        // 1. Set start time for UI shrinking
        set({ pivotClosingStartTime: performance.now() });
        
        // 2. Animate world parameters to 0
        const startRot = { ...s.worldRotation };
        const startOffset = { ...s.pivotOffset };
        const startTime = performance.now();
        const duration = 400; // ms
        
        const animatePivotClosing = () => {
            const now = performance.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            
            // Interpolate towards 0
            const newRot = {
                x: startRot.x * (1 - eased),
                y: startRot.y * (1 - eased),
                z: startRot.z * (1 - eased),
            };
            const newOffset = {
                x: startOffset.x * (1 - eased),
                y: startOffset.y * (1 - eased),
                z: startOffset.z * (1 - eased),
            };
            
            if (progress < 1) {
                // Use direct state update for animation to avoid history spam
                get().actions.updateVisuals({ worldRotation: newRot, pivotOffset: newOffset });
                requestAnimationFrame(animatePivotClosing);
            } else {
                // Finalize and commit to history
                get().actions.adjustParameter({ 
                    worldRotation: {x:0,y:0,z:0}, 
                    pivotOffset: {x:0,y:0,z:0},
                    pivotPoint: null,
                    showPivot: true, // Reset show flag for next time
                    pivotClosingStartTime: null
                });
            }
        };
        requestAnimationFrame(animatePivotClosing);
    },

    // --- GRADIENT ACTIONS ---
    setGradientStop: (id: string, position: number) => {
        const stops = get().lineGradient.map(s => s.id === id ? { ...s, position } : s);
        get().actions.adjustParameter({ lineGradient: stops });
    },
    addGradientStop: (position: number, color: string) => {
        const newStop = { id: Date.now().toString(), position, color, bias: 0.5, interpolation: 'linear' as const };
        const stops = [...get().lineGradient, newStop].sort((a, b) => a.position - b.position);
        get().actions.adjustParameter({ lineGradient: stops });
    },
    removeGradientStop: (id: string) => {
        const stops = get().lineGradient.filter(s => s.id !== id);
        get().actions.adjustParameter({ lineGradient: stops });
    },
    updateGradientStopColor: (id: string, color: string) => {
        const stops = get().lineGradient.map(s => s.id === id ? { ...s, color } : s);
        set({ lineGradient: stops });
    },

    // --- PHYSICS ---
    updatePlanetOverride: (planetName: string, property: keyof Pick<CelestialBodyData, 'orbitRadius' | 'eccentricity' | 'inclination' | 'period' | 'phaseOffset'>, value: number) => {
        const s = get();
        const getCelestialBodyFromState = (name: string): CelestialBodyData | undefined => {
            const systemData = STAR_SYSTEMS[s.currentSystem];
            const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
            if (!basePlanetData) return undefined;
            return { ...basePlanetData, ...s.planetDataOverrides[name] };
        };

        const newOverrides = { ...s.planetDataOverrides };
        const currentOverrides: Partial<CelestialBodyData> = { ...(newOverrides[planetName] || {}) };

        if (property === 'period') {
            const oldPlanetData = getCelestialBodyFromState(planetName);
            if (oldPlanetData && oldPlanetData.period !== value) {
                const oldPhaseOffset = oldPlanetData.phaseOffset || 0;
                const totalTime = ((s.startDate.getTime() - EPOCH_DATE.getTime()) / MS_PER_DAY) + s.time;
                const oldPhaseOffsetRad = oldPhaseOffset * (Math.PI / 180);
                let newPhaseOffset = (((totalTime * 2 * Math.PI * (1 / oldPlanetData.period - 1 / value)) + oldPhaseOffsetRad) * (180 / Math.PI)) % 360;
                if (newPhaseOffset < 0) newPhaseOffset += 360;
                currentOverrides.phaseOffset = newPhaseOffset;
            }
        }
        currentOverrides[property] = value;
        newOverrides[planetName] = currentOverrides;
        set({ planetDataOverrides: newOverrides });
    },
    resetPlanetOverrides: (planetName: string) => {
        const newOverrides = { ...get().planetDataOverrides };
        delete newOverrides[planetName];
        set({ planetDataOverrides: newOverrides });
        get().actions.showNotification(`**${planetName}** properties reset to default.`);
    },
    resetPlanetPropertyOverride: (planetName: string, property: keyof Pick<CelestialBodyData, 'orbitRadius' | 'eccentricity' | 'inclination' | 'period' | 'phaseOffset'>) => {
        const newOverrides = { ...get().planetDataOverrides };
        const planetOverrides = { ...newOverrides[planetName] };
        if (planetOverrides && property in planetOverrides) {
            delete planetOverrides[property];
            if (Object.keys(planetOverrides).length === 0) delete newOverrides[planetName];
            else newOverrides[planetName] = planetOverrides;
            set({ planetDataOverrides: newOverrides });
        }
        const prettyPropName = property.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        get().actions.showNotification(`**${prettyPropName}** for ${planetName} has been reset.`);
    },
    toggleRealisticPhysics: (enabled: boolean) => {
        get().actions.markFeatureUsed('physics_toggled');

        get().actions.adjustParameter({}); 
        if (enabled) {
            const s = get();
            interactionState.physics.preRealisticState = { ellipticalOrbits: s.ellipticalOrbits, orbitalInclination: s.orbitalInclination, logarithmicOrbits: s.logarithmicOrbits };
            set({ useRealisticPhysics: true, ellipticalOrbits: true, orbitalInclination: true, logarithmicOrbits: false });
            get().actions.showNotification("**Realistic Physics ON**: Using real-time orbital data.");
        } else {
            const preRealisticState = interactionState.physics.preRealisticState || {};
            set({ useRealisticPhysics: false, ...preRealisticState });
            get().actions.showNotification("**Realistic Physics OFF**: Switched to customizable simulation.");
        }
        get().actions.adjustParameter({});
    },

    // --- SCRUB ---
    startSpeedScrub: () => {
        const s = get();
        interactionState.scrub.startY = s.mousePosition.y;
        interactionState.scrub.startX = s.mousePosition.x;
        interactionState.scrub.startSpeed = s.timeSpeed;
        set({ isSpeedScrubbing: true });
    },
    stopSpeedScrub: () => {
        const s = get();
        if (s.isSpeedScrubbing) {
            set({ isSpeedScrubbing: false });
            if (s.adjustmentPending) {
                get().actions.adjustParameter({});
                set({ adjustmentPending: false });
            }
        }
    },
    startZOffsetScrub: () => {
        const s = get();
        interactionState.scrub.startY = s.mousePosition.y;
        interactionState.scrub.startZOffset = s.targetZOffset;
        set({ isZOffsetScrubbing: true });
    },
    stopZOffsetScrub: () => {
        const s = get();
        if (s.isZOffsetScrubbing) {
            set({ isZOffsetScrubbing: false });
            if (s.adjustmentPending) {
                get().actions.adjustParameter({});
                set({ adjustmentPending: false });
            }
        }
    },
    startDriftScrub: () => {
        const s = get();
        interactionState.scrub.startX = s.mousePosition.x;
        interactionState.scrub.startY = s.mousePosition.y;
        interactionState.scrub.startDriftSpeed = s.lineZDriftSpeed;
        interactionState.scrub.isAxisLocked = false;
        set({ isDriftScrubbing: true, enableLineZDrift: true });
    },
    stopDriftScrub: () => {
        const s = get();
        if (s.isDriftScrubbing) {
            set({ isDriftScrubbing: false });
            if (s.adjustmentPending) {
                get().actions.adjustParameter({});
                set({ adjustmentPending: false });
            }
        }
    },
    startFovScrub: () => {
        const s = get();
        interactionState.scrub.startY = s.mousePosition.y;
        interactionState.scrub.startFov = s.targetFov;
        set({ isFovScrubbing: true, renderMode: 'perspective' });
    },
    stopFovScrub: () => {
        const s = get();
        if (s.isFovScrubbing) {
            set({ isFovScrubbing: false });
            if (s.adjustmentPending) {
                get().actions.adjustParameter({});
                set({ adjustmentPending: false });
            }
        }
    },
    updateScrub: () => {
        const s = get();
        const startY = interactionState.scrub.startY || s.mousePosition.y;
        const startX = interactionState.scrub.startX || s.mousePosition.x;
        const currentY = s.mousePosition.y;
        const currentX = s.mousePosition.x;
        const totalDeltaY = startY - currentY; 
        const totalDeltaX = currentX - startX; 

        if (s.isSpeedScrubbing) {
            const startSpeed = interactionState.scrub.startSpeed || 1;
            const ySensitivity = 1.025;
            const xSensitivity = 1.005;
            const dampeningThreshold = 50; 
            const dampeningExponent = 0.6; 
            const dampeningStrength = 0.3; 
            
            let dampeningFactor = 1;
            if (startSpeed > dampeningThreshold) {
                dampeningFactor = 1 + Math.pow(startSpeed - dampeningThreshold, dampeningExponent) * dampeningStrength;
            }

            const effectiveDeltaY = totalDeltaY / dampeningFactor;
            const effectiveDeltaX = totalDeltaX / dampeningFactor;
            const yFactor = Math.pow(ySensitivity, effectiveDeltaY);
            const xFactor = Math.pow(xSensitivity, effectiveDeltaX);
            const newSpeed = startSpeed * yFactor * xFactor;

            set({ timeSpeed: Math.max(0.01, Math.min(100000, newSpeed)) });
        }
        if (s.isZOffsetScrubbing) {
            const startOffset = interactionState.scrub.startZOffset || 0;
            get().actions.adjustParameter({ targetZOffset: Math.max(-2000, Math.min(2000, startOffset + totalDeltaY * 5)) });
        }
        if (s.isDriftScrubbing) {
            const isAxisLocked = interactionState.scrub.isAxisLocked;
            const deadzone = 10;

            if (!isAxisLocked) {
                if (Math.abs(totalDeltaX) > deadzone || Math.abs(totalDeltaY) > deadzone) {
                    const dominantAxis = Math.abs(totalDeltaX) > Math.abs(totalDeltaY) ? 'x' : 'z';
                    if (s.lineDriftAxis !== dominantAxis) {
                        get().actions.setDriftAxis(dominantAxis);
                        set({ lineZDriftSpeed: 0 });
                        interactionState.scrub.startX = currentX;
                        interactionState.scrub.startY = currentY;
                        interactionState.scrub.startDriftSpeed = 0;
                    }
                    interactionState.scrub.isAxisLocked = true;
                }
            } else {
                const startDriftSpeed = interactionState.scrub.startDriftSpeed || 0;
                const delta = s.lineDriftAxis === 'x' ? totalDeltaX : totalDeltaY;
                
                const sensitivity = Math.min(1, 10 / (10+s.timeSpeed/2));
                const newSpeed = startDriftSpeed + delta * sensitivity;
                
                get().actions.adjustParameter({ lineZDriftSpeed: Math.max(-10000, Math.min(10000, newSpeed)) });
            }
        }
        if (s.isFovScrubbing) {
            const startFov = interactionState.scrub.startFov || 30;
            const newFov = Math.max(30, Math.min(170, startFov + totalDeltaY * 0.25));
            get().actions.setFov(newFov);
        }
    },
    setDriftAxis: (axis: 'x' | 'z') => {
        const s = get();
        if (s.lineDriftAxis !== axis) {
            const shouldFlip = s.enableLineZDrift;
            const updates: Partial<AppState> = { lineDriftAxis: axis };
            if (shouldFlip) {
                updates.rotation = -s.rotation;
            }
            get().actions.adjustParameter(updates);
        }
    },
});
