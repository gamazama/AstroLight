
import type { AppState, Vector3D } from '../../types';
import { applyCameraTransform, applyWorldTransform, calculatePerspectiveProjection } from './calculations';

export const GIZMO_SCREEN_SIZE = 120; 
const HIT_THRESHOLD = 8; 
const BUTTON_RADIUS = 12;

export type GizmoPath = {
    axis: 'x' | 'y' | 'z';
    points: { x: number; y: number; behind: boolean }[];
    isHovered: boolean;
    center: { x: number; y: number };
};

export type GizmoHit = {
    axis: 'x' | 'y' | 'z';
    tangent: { x: number; y: number };
} | {
    type: 'button';
    action: 'close' | 'hide';
};

export type GizmoButtons = {
    close: { x: number, y: number, hovered: boolean };
    hide: { x: number, y: number, hovered: boolean };
};

// Helper for direct View-Space to Screen projection.
function manualProject(pView: Vector3D, canvas: HTMLCanvasElement, state: AppState): {x: number, y: number, behind: boolean, scale: number} {
    if (state.renderMode === 'perspective') {
        const proj = calculatePerspectiveProjection(pView, canvas, state.actualZoom, state.actualFov);
        if (!proj.behind) {
            proj.x += state.viewOffsetX;
            proj.y += state.viewOffsetY;
        }
        return { ...proj, behind: !!proj.behind };
    } else {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = state.actualZoom * 0.5;
        return {
            x: centerX + pView.x * scale + state.viewOffsetX,
            y: centerY + pView.y * scale + state.viewOffsetY,
            scale: scale,
            behind: false
        };
    }
}

// Ease Out Back function for pop-in animation
function easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Cubic Ease In for pop-out animation
function easeInCubic(x: number): number {
    return x * x * x;
}

export const getGizmoPaths = (
    state: AppState,
    canvas: HTMLCanvasElement,
    hoveredAxis: 'x' | 'y' | 'z' | null
): GizmoPath[] => {
    if (!state.pivotPoint || !state.showPivot) return [];

    // 1. Use Pivot Directly (It is stored in View Space)
    const viewPivot = state.pivotPoint;
    
    const pivotOffset = state.pivotOffset || { x: 0, y: 0, z: 0 };
    const viewCenterWithOffset = {
        x: viewPivot.x + pivotOffset.x,
        y: viewPivot.y + pivotOffset.y,
        z: viewPivot.z + pivotOffset.z
    };
    
    const projCenter = manualProject(viewCenterWithOffset, canvas, state);
    if (projCenter.behind) return []; 

    // Determine Size
    let worldRadius = 10; 
    if (state.renderMode === 'perspective') {
        if (projCenter.scale > 0) {
            worldRadius = (GIZMO_SCREEN_SIZE / 2) / projCenter.scale;
        }
    } else {
        worldRadius = (GIZMO_SCREEN_SIZE / 2) / (state.actualZoom * 0.5);
    }

    const duration = 400;
    let scale = 1;

    if (state.pivotClosingStartTime) {
        const elapsedClose = performance.now() - state.pivotClosingStartTime;
        if (elapsedClose < duration) {
            const t = elapsedClose / duration;
            // Shrink easing: Inverse of easeIn to make it smooth 1 -> 0
            scale = 1 - easeInCubic(t);
            if (scale < 0) scale = 0;
        } else {
            scale = 0;
        }
    } else {
        const elapsed = performance.now() - (state.pivotStartTime || 0);
        if (elapsed < duration) {
            scale = easeOutBack(elapsed / duration);
        }
    }

    if (scale <= 0) return [];
    worldRadius *= scale;

    const segments = 60;
    const paths: GizmoPath[] = [];
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

    // Rotation States for Gimbal Visualization
    const rotX = { x: 0, y: -state.worldRotation.y, z: -state.worldRotation.z };
    const rotY = { x: 0, y: 0, z: state.worldRotation.z }; 
    const rotZ = { x: 0, y: 0, z: 0 };

    axes.forEach(axis => {
        const points2D: { x: number; y: number; behind: boolean }[] = [];
        let activeRot = { x: 0, y: 0, z: 0 };

        if (axis === 'x') activeRot = rotX;
        else if (axis === 'y') activeRot = rotY;
        else activeRot = rotZ;
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            
            let pLocal = { x: 0, y: 0, z: 0 };
            if (axis === 'x') {
                pLocal = { x: 0, y: cos * worldRadius, z: sin * worldRadius };
            } else if (axis === 'y') {
                pLocal = { x: cos * worldRadius, y: 0, z: sin * worldRadius };
            } else {
                pLocal = { x: cos * worldRadius, y: sin * worldRadius, z: 0 };
            }
            
            // 2. Translate to View Pivot (View Space)
            const pView = {
                x: viewPivot.x + pLocal.x,
                y: viewPivot.y + pLocal.y,
                z: viewPivot.z + pLocal.z
            };

            // 3. Apply Gizmo World Transform (Rotation around Pivot)
            const pRotated = applyWorldTransform(pView, viewPivot, activeRot, pivotOffset);

            // 4. Project directly
            const proj = manualProject(pRotated, canvas, state);
            points2D.push({ x: proj.x, y: proj.y, behind: proj.behind || false });
        }

        paths.push({
            axis,
            points: points2D,
            isHovered: hoveredAxis === axis,
            center: { x: projCenter.x, y: projCenter.y }
        });
    });

    return paths;
};

export const getGizmoButtons = (
    state: AppState,
    canvas: HTMLCanvasElement,
    mouseX: number,
    mouseY: number
): GizmoButtons | null => {
    if (!state.pivotPoint || !state.showPivot) return null;
    
    const viewPivot = state.pivotPoint;
    const pivotOffset = state.pivotOffset || { x: 0, y: 0, z: 0 };
    const viewCenterWithOffset = {
        x: viewPivot.x + pivotOffset.x,
        y: viewPivot.y + pivotOffset.y,
        z: viewPivot.z + pivotOffset.z
    };

    const projCenter = manualProject(viewCenterWithOffset, canvas, state);
    if (projCenter.behind) return null;

    // Apply scale logic for closing animation to buttons too
    let scale = 1;
    if (state.pivotClosingStartTime) {
        const duration = 400;
        const elapsed = performance.now() - state.pivotClosingStartTime;
        if (elapsed < duration) {
             const t = elapsed / duration;
             scale = 1 - easeInCubic(t);
             if (scale < 0) scale = 0;
        } else {
            scale = 0;
        }
    } else {
         const duration = 400;
         const elapsed = performance.now() - (state.pivotStartTime || 0);
         if (elapsed < duration) {
             scale = easeOutBack(elapsed / duration);
         }
    }
    
    if (scale <= 0) return null;

    const radius = ((GIZMO_SCREEN_SIZE / 2) + 25) * scale;
    
    // Keep button hit area constant but move them inward
    const closeX = projCenter.x + radius * Math.cos(-Math.PI / 4);
    const closeY = projCenter.y + radius * Math.sin(-Math.PI / 4);
    const hideX = projCenter.x + radius * Math.cos(-Math.PI * 0.75);
    const hideY = projCenter.y + radius * Math.sin(-Math.PI * 0.75);

    const isHoveringClose = Math.hypot(mouseX - closeX, mouseY - closeY) < BUTTON_RADIUS;
    const isHoveringHide = Math.hypot(mouseX - hideX, mouseY - hideY) < BUTTON_RADIUS;

    return {
        close: { x: closeX, y: closeY, hovered: isHoveringClose },
        hide: { x: hideX, y: hideY, hovered: isHoveringHide }
    };
}

export const hitTestGizmo = (
    mouseX: number,
    mouseY: number,
    paths: GizmoPath[],
    buttons: GizmoButtons | null
): GizmoHit | null => {
    if (buttons) {
        if (buttons.close.hovered) return { type: 'button', action: 'close' };
        if (buttons.hide.hovered) return { type: 'button', action: 'hide' };
    }

    let closestHit: GizmoHit | null = null;
    let minDistance = HIT_THRESHOLD;

    paths.forEach(path => {
        for (let i = 0; i < path.points.length - 1; i++) {
            const p1 = path.points[i];
            const p2 = path.points[i + 1];
            if (p1.behind || p2.behind) continue;

            const dist = distToSegment({ x: mouseX, y: mouseY }, p1, p2);
            if (dist < minDistance) {
                minDistance = dist;
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                const tangent = len > 0 ? { x: dx/len, y: dy/len } : { x: 0, y: 0 };

                closestHit = { axis: path.axis, tangent };
            }
        }
    });

    return closestHit;
};

function distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// Re-export getProjectedVector as it was in the original file
export const getProjectedVector = (
    vec: Vector3D,
    centerWorld: Vector3D, // Unused but kept for signature compatibility
    state: AppState,
    canvas: HTMLCanvasElement
): { x: number, y: number } => {
    if (!state.pivotPoint) return { x: 0, y: 0 };
    const viewPivot = state.pivotPoint;

    const p1 = manualProject(viewPivot, canvas, state);

    const p2_view = {
        x: viewPivot.x + vec.x * 10,
        y: viewPivot.y + vec.y * 10,
        z: viewPivot.z + vec.z * 10
    };
    
    const p2 = manualProject(p2_view, canvas, state);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    const len = Math.sqrt(dx*dx + dy*dy);
    return len > 0 ? { x: dx/len, y: dy/len } : { x: 0, y: 0 };
};
