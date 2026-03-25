
import React from 'react';
import type { AppState, CelestialBodyData } from '../../types';
import { idToRgb, rgbToId, hexToRgb, lerpRGB } from '../../utils/colorUtils';
import { lerp } from '../../utils/mathUtils';
import { calculatePlanetPosition, project2D } from './calculations';
import { drawGizmo } from './gizmoDrawing';

export type AnimatingOrbit = {
    intensity: number;
    target: number;
};

type ProjectedPath = { x: number; y: number; scale: number; behind?: boolean };

const LERP_FACTOR = 0.15;

/**
 * Updates the animation states for orbit highlighting and the cursor bloom effect.
 */
export const updateAnimationStates = (
    state: AppState,
    animatingOrbitsRef: React.MutableRefObject<Map<number, AnimatingOrbit>>,
    cursorHighlightRef: React.MutableRefObject<{ x: number; y: number; intensity: number }>
) => {
    const planetIdToHighlight = state.hoveredPlanetId ?? state.tutorialForcedHoverPlanetId;

    if (planetIdToHighlight !== null) {
        if (!animatingOrbitsRef.current.has(planetIdToHighlight)) {
            animatingOrbitsRef.current.set(planetIdToHighlight, { intensity: 0, target: 1 });
        } else {
            animatingOrbitsRef.current.get(planetIdToHighlight)!.target = 1;
        }
    }

    for (const [id, anim] of animatingOrbitsRef.current.entries()) {
        if (id !== planetIdToHighlight) anim.target = 0;
    }

    const entriesToDelete: number[] = [];
    for (const [id, anim] of animatingOrbitsRef.current.entries()) {
        anim.intensity = lerp(anim.intensity, anim.target, LERP_FACTOR);
        if (anim.target === 0 && anim.intensity < 0.01) entriesToDelete.push(id);
    }
    entriesToDelete.forEach(id => animatingOrbitsRef.current.delete(id));

    let cursorTargetIntensity = 0;
    if (state.canvasHoverState && !state.isPlanetModificationMode) {
        cursorTargetIntensity = 1;
        cursorHighlightRef.current.x = state.canvasHoverState.mouseX;
        cursorHighlightRef.current.y = state.canvasHoverState.mouseY;
    }
    cursorHighlightRef.current.intensity = lerp(cursorHighlightRef.current.intensity, cursorTargetIntensity, LERP_FACTOR);
};

/**
 * Draws an orbit path on the visible canvas and draws a unique color ID on the hidden mask canvas for mouse picking.
 */
export const drawOrbitAndMask = (
    ctxDisplay: CanvasRenderingContext2D,
    ctxId: CanvasRenderingContext2D,
    path2D: ProjectedPath[],
    nodeId: number,
    state: AppState,
    animatingOrbitsRef: React.MutableRefObject<Map<number, AnimatingOrbit>>,
    idToNodeIdMapRef: React.MutableRefObject<Map<number, number>>,
    animationTime: number
) => {
    // --- 1. Draw Pick Mask (Hidden) ---
    const animStateForId = animatingOrbitsRef.current.get(nodeId);
    const intensityForId = animStateForId ? animStateForId.intensity : 0;
    
    // Mask line is thicker to make clicking easier
    ctxId.lineWidth = lerp(12, 64, intensityForId);
    
    const [r, g, b] = idToRgb(nodeId);
    ctxId.strokeStyle = `rgb(${r},${g},${b})`;
    idToNodeIdMapRef.current.set(rgbToId(r,g,b), nodeId);
    ctxId.beginPath();
    ctxId.moveTo(path2D[0].x, path2D[0].y);
    for(let i = 1; i < path2D.length; i++) ctxId.lineTo(path2D[i].x, path2D[i].y);
    ctxId.stroke();

    // --- 2. Draw Visible Orbit ---
    const isConnected = state.connections.some(c => c.from === nodeId || c.to === nodeId);
    const baseOpacity = isConnected ? state.connectedOrbitOpacity : state.orbitOpacity;
    const baseWidth = state.orbitLineWidth;
    const orbitColorRgb = hexToRgb(state.orbitColor);
    
    ctxDisplay.save();
    // Force solid blending (source-over) so CSS mix-blend-mode can work on the canvas element,
    // EXCEPT for 'lighter' (additive), which needs to accumulate within the canvas itself.
    ctxDisplay.globalCompositeOperation = state.orbitBlendMode === 'lighter' ? 'lighter' : 'source-over';
    
    if (intensityForId > 0.01 && orbitColorRgb) {
        // Highlight effect: Draw 3 overlapping strokes for a neon glow
        
        // Force highlight to show on top with brighter blend
        ctxDisplay.globalCompositeOperation = 'screen';

        // 1. Outer glow
        ctxDisplay.lineWidth = lerp(baseWidth, 12, intensityForId);
        ctxDisplay.strokeStyle = `rgba(${orbitColorRgb.r}, ${orbitColorRgb.g}, ${orbitColorRgb.b}, ${baseOpacity + (0.1 - baseOpacity) * intensityForId})`;
        ctxDisplay.beginPath();
        ctxDisplay.moveTo(path2D[0].x, path2D[0].y);
        for(let i = 1; i < path2D.length; i++) ctxDisplay.lineTo(path2D[i].x, path2D[i].y);
        ctxDisplay.stroke();
        
        // 2. Mid glow
        ctxDisplay.lineWidth = lerp(baseWidth, 6, intensityForId);
        ctxDisplay.strokeStyle = `rgba(${orbitColorRgb.r}, ${orbitColorRgb.g}, ${orbitColorRgb.b}, ${baseOpacity + (0.3 - baseOpacity) * intensityForId})`;
        ctxDisplay.beginPath();
        ctxDisplay.moveTo(path2D[0].x, path2D[0].y);
        for(let i = 1; i < path2D.length; i++) ctxDisplay.lineTo(path2D[i].x, path2D[i].y);
        ctxDisplay.stroke();

        // 3. Core line
        ctxDisplay.lineWidth = lerp(baseWidth, 2, intensityForId);
        ctxDisplay.strokeStyle = `rgba(${orbitColorRgb.r}, ${orbitColorRgb.g}, ${orbitColorRgb.b}, ${baseOpacity + (0.8 - baseOpacity) * intensityForId})`;
        ctxDisplay.beginPath();
        ctxDisplay.moveTo(path2D[0].x, path2D[0].y);
        for(let i = 1; i < path2D.length; i++) ctxDisplay.lineTo(path2D[i].x, path2D[i].y);
        ctxDisplay.stroke();

    } else {
        // Default non-highlighted orbit
        ctxDisplay.lineWidth = baseWidth;
        ctxDisplay.strokeStyle = orbitColorRgb ? `rgba(${orbitColorRgb.r}, ${orbitColorRgb.g}, ${orbitColorRgb.b}, ${baseOpacity})` : `rgba(255, 255, 255, ${baseOpacity})`;
        ctxDisplay.beginPath();
        ctxDisplay.moveTo(path2D[0].x, path2D[0].y);
        for(let i = 1; i < path2D.length; i++) ctxDisplay.lineTo(path2D[i].x, path2D[i].y);
        ctxDisplay.stroke();
    }
    
    ctxDisplay.restore();
};

export const drawCursorHighlight = (ctxDisplay: CanvasRenderingContext2D, cursorHighlightRef: React.MutableRefObject<{ x: number; y: number; intensity: number }>) => {
    if (cursorHighlightRef.current.intensity > 0.01) {
        const { intensity, x, y } = cursorHighlightRef.current;
        ctxDisplay.beginPath();
        ctxDisplay.arc(x, y, lerp(0, 16, intensity), 0, 2 * Math.PI);
        ctxDisplay.fillStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
        ctxDisplay.fill();
    }
};

export const drawInteractionText = (ctxDisplay: CanvasRenderingContext2D, text: string, state: AppState) => {
    if (!text) return;
    const mousePos = state.canvasHoverState ? {x: state.canvasHoverState.mouseX, y: state.canvasHoverState.mouseY} : state.mousePosition;
    ctxDisplay.save();
    ctxDisplay.font = 'bold 14px Segoe UI';
    ctxDisplay.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctxDisplay.textAlign = 'center';
    ctxDisplay.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctxDisplay.shadowBlur = 8;
    ctxDisplay.fillText(text, mousePos.x, mousePos.y - 30);
    ctxDisplay.restore();
};

export const drawConnectionNoodle = (
    ctxDisplay: CanvasRenderingContext2D, 
    state: AppState, 
    actions: { getCelestialBody: (name: string) => CelestialBodyData | undefined }, 
    lineEndPointRef: React.MutableRefObject<{ x: number, y: number } | null>
) => {
    if (!state.canvasConnectingFromNodeId) {
        lineEndPointRef.current = null;
        return;
    }
    const fromNode = state.planetNodes.find(n => n.id === state.canvasConnectingFromNodeId);
    if (!fromNode) return;
    const fromPlanet = actions.getCelestialBody(fromNode.name);
    if (!fromPlanet) return;
    
    let fromPos3D = calculatePlanetPosition(fromPlanet, state.time, state);
    fromPos3D.z += state.actualZOffsets[fromPlanet.name] ?? 0;
    const fromProj = project2D(fromPos3D, ctxDisplay.canvas, state);

    if (lineEndPointRef.current === null) lineEndPointRef.current = { x: fromProj.x, y: fromProj.y };

    let targetX, targetY;
    const isHoveringValidTarget = state.hoveredPlanetId !== null && state.hoveredPlanetId !== state.canvasConnectingFromNodeId;

    if (isHoveringValidTarget && state.hoveredPlanetPosition) {
        targetX = state.hoveredPlanetPosition.x;
        targetY = state.hoveredPlanetPosition.y;
    } else {
        targetX = state.mousePosition.x;
        targetY = state.mousePosition.y;
    }
    
    lineEndPointRef.current.x = lerp(lineEndPointRef.current.x, targetX, 0.25);
    lineEndPointRef.current.y = lerp(lineEndPointRef.current.y, targetY, 0.25);

    ctxDisplay.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctxDisplay.lineWidth = 3.33;
    ctxDisplay.lineCap = 'round';
    ctxDisplay.beginPath();
    ctxDisplay.moveTo(fromProj.x, fromProj.y);
    ctxDisplay.lineTo(lineEndPointRef.current.x, lineEndPointRef.current.y);
    ctxDisplay.stroke();
};

export const drawPivotGizmo = (ctx: CanvasRenderingContext2D, state: AppState) => {
    drawGizmo(ctx, state);
};

export const drawSuccessAnimation = (ctxDisplay: CanvasRenderingContext2D, state: AppState, actions: { updateUI: (data: any) => void }) => {
    if (!state.connectionSuccessAnimation) return;
    const anim = state.connectionSuccessAnimation;
    const elapsed = performance.now() - anim.startTime;
    const DURATION = 200;

    if (elapsed >= DURATION) {
        actions.updateUI({ connectionSuccessAnimation: null });
        return;
    }
    
    const progress = elapsed / DURATION;
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);

    ctxDisplay.save();
    ctxDisplay.lineCap = 'round';
    
    const endColorRgb = hexToRgb(anim.color);
    if (endColorRgb) {
        const currentColor = lerpRGB({ r: 255, g: 255, b: 255 }, endColorRgb, progress);
        ctxDisplay.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${0.9 * (1 - progress * progress)})`;
    } else {
        ctxDisplay.strokeStyle = `rgba(255, 255, 255, ${0.9 * (1 - progress * progress)})`;
    }
    ctxDisplay.lineWidth = 1;

    ctxDisplay.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctxDisplay.shadowBlur = 30 * easeOutQuart;

    ctxDisplay.beginPath();
    ctxDisplay.moveTo(anim.fromScreenPos.x, anim.fromScreenPos.y);
    ctxDisplay.lineTo(anim.toScreenPos.x, anim.toScreenPos.y);
    ctxDisplay.stroke();
    
    ctxDisplay.restore();
};
