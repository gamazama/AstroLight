
import type { AppState, CelestialBodyData, Line, Particle, PlanetNode, Vector3D } from '../../types/index';
import { project2D, calculatePlanetPosition } from './calculations';
import { MAX_PLANET_HOVER_RADIUS_PX, PLANET_HOVER_ANIMATION_MS } from '../../constants';
import { hexToRgb } from '../../utils/colorUtils';
import { getGeocentricOrbitParams } from './orbitGeometry';

/**
 * A helper function to centralize the complex boolean logic for determining
 * whether a planet or its label should be rendered in the current frame.
 */
const shouldDisplayItem = (
    isPlanetConnected: boolean,
    hasNoConnections: boolean,
    isCreatingConnection: boolean,
    state: AppState,
    itemType: 'planet' | 'label'
): boolean => {
    const masterToggle = itemType === 'planet' ? state.showPlanets : state.showLabels;
    const showUnconnectedToggle = itemType === 'planet' ? state.showUnconnectedPlanets : state.showUnconnectedLabels;

    // Item is visible if the master toggle is on OR if in planet modification mode.
    if (state.isPlanetModificationMode || masterToggle) {
        // Then, check if any of the specific conditions for visibility are met.
        if (state.isPlanetModificationMode || hasNoConnections || isCreatingConnection || isPlanetConnected || showUnconnectedToggle) {
            return true;
        }
    }
    return false;
};


const drawPlanets = (
    ctx: CanvasRenderingContext2D,
    state: AppState,
    planetNodesToDraw: PlanetNode[],
    getCelestialBody: (name: string) => CelestialBodyData | undefined,
    zOffsets: Record<string, number>,
    canvas: HTMLCanvasElement
) => {
    // These conditions are global for the frame, can be calculated once.
    const isCreatingConnection = state.connectingNodeId !== null || state.canvasConnectingFromNodeId !== null;
    const hasNoConnections = state.connections.length === 0;

    const now = performance.now(); // Cache once per frame for hover animations

    // Build a Set of connected planet IDs for O(1) lookup instead of O(n) .some() per planet
    const connectedPlanetIds = new Set<number>();
    for (let i = 0; i < state.connections.length; i++) {
        connectedPlanetIds.add(state.connections[i].from);
        connectedPlanetIds.add(state.connections[i].to);
    }

    planetNodesToDraw.forEach(node => {
        const planet = getCelestialBody(node.name);
        if (!planet) return;

        const isPlanetConnected = connectedPlanetIds.has(node.id);

        // --- Use the centralized helper function for visibility logic ---
        if (!shouldDisplayItem(isPlanetConnected, hasNoConnections, isCreatingConnection, state, 'planet')) {
            return; // Don't draw this planet if it's not visible
        }

        let pos = calculatePlanetPosition(planet, state.time, state);
        pos.z += zOffsets[planet.name] ?? 0;
        
        const proj = project2D(pos, canvas, state);
        if (proj.behind) return;

        const basePixelRadius = planet.radius * state.planetSizeMultiplier * proj.scale * 0.5;
        let finalRadius = basePixelRadius;
        const maxRadius = MAX_PLANET_HOVER_RADIUS_PX;
        const animDuration = PLANET_HOVER_ANIMATION_MS;

        const anim = state.hoveredPlanetAnimation;

        const growingAnim = anim?.growing;
        const shrinkingAnim = anim?.shrinking;

        if (growingAnim && node.id === growingAnim.planetId) {
            const elapsedTime = now - growingAnim.startTime;
            if (elapsedTime < animDuration) {
                const progress = elapsedTime / animDuration;
                const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                finalRadius = basePixelRadius + (maxRadius - basePixelRadius) * easedProgress;
            } else {
                finalRadius = maxRadius;
            }
        } else if (shrinkingAnim && node.id === shrinkingAnim.planetId) {
            const elapsedTime = now - shrinkingAnim.startTime;
            if (elapsedTime < animDuration) {
                const progress = elapsedTime / animDuration;
                const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                finalRadius = maxRadius - (maxRadius - basePixelRadius) * easedProgress;
            } else {
                finalRadius = basePixelRadius;
            }
        } else if (state.hoveredPlanetId === node.id) {
            finalRadius = maxRadius;
        }
        
        const rgb = hexToRgb(planet.color);
        if (rgb) {
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.planetOpacity})`;
        } else {
            ctx.fillStyle = planet.color;
        }

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, finalRadius, 0, Math.PI * 2);
        ctx.fill();

        // --- Use the centralized helper function for label visibility logic ---
        if (shouldDisplayItem(isPlanetConnected, hasNoConnections, isCreatingConnection, state, 'label')) {
            const labelRgb = hexToRgb(state.labelColor);
            if (labelRgb) {
                ctx.fillStyle = `rgba(${labelRgb.r}, ${labelRgb.g}, ${labelRgb.b}, ${state.labelOpacity})`;
            } else {
                 ctx.fillStyle = `rgba(255, 255, 255, ${state.labelOpacity})`;
            }

            ctx.font = `${state.labelFontSize}px Segoe UI`;
            ctx.textAlign = 'center';
            ctx.fillText(planet.name, proj.x, proj.y - finalRadius - 10);
        }
    });
};

/**
 * Renders the orbit lines for all visible planets onto a 2D canvas.
 * This function is primarily used for the high-resolution export feature.
 */
export const drawOrbits = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: AppState,
    getCelestialBody: (name: string) => CelestialBodyData | undefined,
    zOffsets: Record<string, number>,
    forceSolid: boolean = false
) => {
    if (!state.showOrbits && !state.isPlanetModificationMode) {
        return;
    }

    const isGeocentric = state.currentSystem === 'Geo-centric';

    for (const node of state.planetsToRender) {
        const planet = getCelestialBody(node.name);
        if (!planet) continue;

        // --- Calculate 3D path ---
        const path3D: Vector3D[] = [];
        
        let segments = 120;
        let duration = planet.period;
        let startTime = 0;
        
        if (isGeocentric) {
            // Use shared logic for duration and segment count to match hit-test geometry
            const params = getGeocentricOrbitParams(planet.name, planet.period);
            duration = params.durationInDays;
            segments = params.segmentCount;
            // For trail effect, start time moves with simulation time
            startTime = state.time - duration;
        }
        
        for (let i = 0; i <= segments; i++) {
            const timeAtAngle = startTime + duration * (i / segments);
            const pos = calculatePlanetPosition(planet, timeAtAngle, state);
            path3D.push(pos);
        }

        // --- Project 3D path to 2D ---
        const offset = zOffsets[node.name] ?? 0;
        const finalPath3D = path3D.map(p => ({ ...p, z: p.z + offset }));
        const path2D = finalPath3D.map(pos => project2D(pos, canvas, state));

        if (path2D.length < 2) continue;

        // --- Draw the path ---
        const isConnected = state.connections.some(c => c.from === node.id || c.to === node.id);
        const baseOpacity = isConnected ? state.connectedOrbitOpacity : state.orbitOpacity;
        const orbitColorRgb = hexToRgb(state.orbitColor);
        
        ctx.save();
        ctx.lineWidth = state.orbitLineWidth;
        
        if (forceSolid) {
            ctx.globalCompositeOperation = state.orbitBlendMode === 'lighter' ? 'lighter' : 'source-over';
        } else {
            ctx.globalCompositeOperation = state.orbitBlendMode;
        }

        // Default stroke color if not using gradient
        ctx.strokeStyle = orbitColorRgb ? `rgba(${orbitColorRgb.r}, ${orbitColorRgb.g}, ${orbitColorRgb.b}, ${baseOpacity})` : `rgba(255, 255, 255, ${baseOpacity})`;

        if (isGeocentric && orbitColorRgb && !forceSolid) {
            // --- GEOCENTRIC TRAIL RENDERING ---
            // Instead of one solid line, we draw the trail in batches with increasing opacity.
            // This simulates the "fading tail" effect without needing per-segment stroke calls (which is slow).
            // We divide the path into 20 batches.
            const BATCHES = 20;
            const pointsPerBatch = Math.ceil(path2D.length / BATCHES);

            for (let b = 0; b < BATCHES; b++) {
                // Opacity ramps from 0 at tail (b=0) to baseOpacity at head (b=BATCHES-1)
                // We use a quadratic curve (t^2) for a smoother fade-out visual.
                const t = (b + 1) / BATCHES;
                const batchOpacity = baseOpacity * (t * t);
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${orbitColorRgb.r}, ${orbitColorRgb.g}, ${orbitColorRgb.b}, ${batchOpacity})`;
                
                const startIndex = b * pointsPerBatch;
                // Ensure we overlap by 1 point to connect batches seamlessly
                const endIndex = Math.min(path2D.length, (b + 1) * pointsPerBatch + 1);
                
                // Need at least 2 points to draw a line
                if (endIndex <= startIndex + 1) continue;

                let hasStarted = false;
                for (let i = startIndex; i < endIndex; i++) {
                    const curr = path2D[i];
                    // Simple behind-camera check. For trails, we might want to skip gaps, 
                    // but simple moveTo/lineTo logic works fine if we just skip drawing 'to' behind points.
                    if (!curr.behind) {
                        if (!hasStarted) {
                            ctx.moveTo(curr.x, curr.y);
                            hasStarted = true;
                        } else {
                            ctx.lineTo(curr.x, curr.y);
                        }
                    } else {
                        hasStarted = false; // Reset if we hit a behind point (break the line)
                    }
                }
                ctx.stroke();
            }

        } else {
            // --- STANDARD STATIC RENDERING ---
            ctx.beginPath();
            
            let firstVisiblePointIndex = -1;
            for (let i = 0; i < path2D.length; i++) {
                if (!path2D[i].behind) {
                    ctx.moveTo(path2D[i].x, path2D[i].y);
                    firstVisiblePointIndex = i;
                    break;
                }
            }
            
            if (firstVisiblePointIndex !== -1) {
                for (let i = firstVisiblePointIndex + 1; i < path2D.length; i++) {
                    const prev = path2D[i - 1];
                    const curr = path2D[i];
                    
                    if (!curr.behind) {
                        if (prev.behind) {
                            ctx.moveTo(curr.x, curr.y);
                        } else {
                            ctx.lineTo(curr.x, curr.y);
                        }
                    }
                }
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
};

export const drawScene = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: AppState,
    getCelestialBody: (name: string) => CelestialBodyData | undefined,
    zOffsets: Record<string, number>,
    clear: boolean = true,
) => {
    let planetNodesToDraw: PlanetNode[] = state.planetsToRender;
    
    if (clear) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (state.showPlanets || state.isPlanetModificationMode) {
        drawPlanets(ctx, state, planetNodesToDraw, getCelestialBody, zOffsets, canvas);
    }
};
