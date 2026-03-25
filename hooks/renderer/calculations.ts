
import type { AppState } from '../../types/state';
import type { CelestialBodyData } from '../../types/celestial';
import type { Vector3D } from '../../types/common';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { 
    calculateBinarySystemPosition, 
    calculateCubicaPosition, 
    calculateGeoCentricPosition, 
    calculateSolSystemPosition 
} from './orbitalStrategies';
import type { Line } from '../../types/celestial';

export type ProjectionResult = { x: number; y: number; scale: number; behind?: boolean };

// Reusable perspective projection calculation
export const calculatePerspectiveProjection = (
    pos: Vector3D,
    canvas: HTMLCanvasElement,
    actualZoom: number,
    fov: number
): ProjectionResult => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const cameraDistance = 4000 / actualZoom;
    const viewPlaneDistance = cameraDistance + pos.z;

    if (viewPlaneDistance <= 0.1) {
        return { x: -9999, y: -9999, scale: 0, behind: true };
    }

    const f = (canvas.height / 2) / Math.tan((fov * Math.PI / 180) / 2);
    const scale = f / viewPlaneDistance;

    return {
        x: centerX + pos.x * scale,
        y: centerY + pos.y * scale,
        scale: scale,
        behind: false,
    };
};

// Camera View Transform: Rotates the world around the center (0,0,0) based on Camera Orbit
export const applyCameraTransform = (pos: Vector3D, rotation: number, tilt: number): Vector3D => {
    const rotRad = (rotation * Math.PI) / 180;
    const tiltRad = (tilt * Math.PI) / 180;

    const cosRot = Math.cos(rotRad);
    const sinRot = Math.sin(rotRad);
    
    // 1. Orbit Rotation (Z-axis rotation in standard math, Y-axis in screen terms)
    const xRot = pos.x * cosRot - pos.y * sinRot;
    const yRot = pos.x * sinRot + pos.y * cosRot;

    // 2. Tilt (X-axis rotation)
    const cosTilt = Math.cos(tiltRad);
    const sinTilt = Math.sin(tiltRad);

    const yTilted = yRot * cosTilt - pos.z * sinTilt;
    const zTilted = yRot * sinTilt + pos.z * cosTilt;

    return { x: xRot, y: yTilted, z: zTilted };
};

// Inverse Camera Transform: Reverses the view rotation/tilt to go from View Space to World Space
export const inverseCameraTransform = (p: Vector3D, rotation: number, tilt: number): Vector3D => {
    const rotRad = (rotation * Math.PI) / 180;
    const tiltRad = (tilt * Math.PI) / 180;

    // 1. Un-Tilt (Rotate around X by -tilt)
    const cosT = Math.cos(-tiltRad);
    const sinT = Math.sin(-tiltRad);
    
    const y1 = p.y * cosT - p.z * sinT;
    const z1 = p.y * sinT + p.z * cosT;
    const x1 = p.x;

    // 2. Un-Rotate (Rotate around Z by -rotation)
    const cosR = Math.cos(-rotRad);
    const sinR = Math.sin(-rotRad);
    
    const x2 = x1 * cosR - y1 * sinR;
    const y2 = x1 * sinR + y1 * cosR;
    const z2 = z1;

    return { x: x2, y: y2, z: z2 };
};

// World Transform: Rotates a point around a specific pivot in World Space
export const applyWorldTransform = (p: Vector3D, pivot: Vector3D, rot: Vector3D, offset: Vector3D): Vector3D => {
    // 1. Translate to Pivot Local Space
    let x = p.x - pivot.x;
    let y = p.y - pivot.y;
    let z = p.z - pivot.z;

    const toRad = Math.PI / 180;
    const radX = rot.x * toRad;
    const radY = rot.y * toRad; 
    const radZ = rot.z * toRad;

    // 2. Apply Euler Rotations (XYZ Order standard)
    
    // Rotate X
    if (rot.x !== 0) {
        const c = Math.cos(radX);
        const s = Math.sin(radX);
        const ny = y * c - z * s;
        const nz = y * s + z * c;
        y = ny;
        z = nz;
    }

    // Rotate Y
    if (rot.y !== 0) {
        const c = Math.cos(radY);
        const s = Math.sin(radY);
        const nx = x * c + z * s;
        const nz = -x * s + z * c;
        x = nx;
        z = nz;
    }

    // Rotate Z
    if (rot.z !== 0) {
        const c = Math.cos(radZ);
        const s = Math.sin(radZ);
        const nx = x * c - y * s;
        const ny = x * s + y * c;
        x = nx;
        y = ny;
    }

    // 3. Translate back + Offset
    return { 
        x: x + pivot.x + offset.x, 
        y: y + pivot.y + offset.y, 
        z: z + pivot.z + offset.z 
    };
};

// Inverse World Transform: Finds the raw position given a transformed visual position
export const unapplyWorldTransform = (p: Vector3D, pivot: Vector3D, rot: Vector3D, offset: Vector3D): Vector3D => {
    // 1. Undo Translate back + Offset
    let x = p.x - pivot.x - offset.x;
    let y = p.y - pivot.y - offset.y;
    let z = p.z - pivot.z - offset.z;

    const toRad = Math.PI / 180;
    const radX = -rot.x * toRad; // Inverse rotation is negative angle
    const radY = -rot.y * toRad; 
    const radZ = -rot.z * toRad;

    // 2. Undo Euler Rotations (Reverse Order: ZYX)
    
    // Rotate Z
    if (rot.z !== 0) {
        const c = Math.cos(radZ);
        const s = Math.sin(radZ);
        const nx = x * c - y * s;
        const ny = x * s + y * c;
        x = nx;
        y = ny;
    }
    
    // Rotate Y
    if (rot.y !== 0) {
        const c = Math.cos(radY);
        const s = Math.sin(radY);
        const nx = x * c + z * s;
        const nz = -x * s + z * c;
        x = nx;
        z = nz;
    }

    // Rotate X
    if (rot.x !== 0) {
        const c = Math.cos(radX);
        const s = Math.sin(radX);
        const ny = y * c - z * s;
        const nz = y * s + z * c;
        y = ny;
        z = nz;
    }

    // 3. Undo Translate to Pivot Local Space
    return { 
        x: x + pivot.x, 
        y: y + pivot.y, 
        z: z + pivot.z 
    };
};


// The Primary Pipeline Function
export const project2D = (
    pos: Vector3D,
    canvas: HTMLCanvasElement,
    state: AppState
): ProjectionResult => {
    
    // Step 1: Apply Camera Transform
    // This moves the world relative to the camera (Simple Camera Motion)
    const rotMultiplier = (state.enableLineZDrift && state.lineDriftAxis === 'x') ? 1 : -1;
    const cameraRotation = state.rotation * rotMultiplier;
    const viewPos = applyCameraTransform(pos, cameraRotation, state.tilt);

    // Step 2: Apply World Transform (Gizmo/Pivot)
    // This rotates the view around the pivot.
    // IMPORTANT: state.pivotPoint is stored in View Space, so we use it directly.
    // We do NOT transform it by the camera rotation.
    let finalPos = viewPos;
    if (state.pivotPoint) {
        const pivotOffset = state.pivotOffset || { x: 0, y: 0, z: 0 };
        // Pivot is already View Space, anchor it outside the camera transform.
        const viewPivot = state.pivotPoint;
        finalPos = applyWorldTransform(viewPos, viewPivot, state.worldRotation, pivotOffset);
    }
    
    // Step 3: Project to Screen
    if (state.renderMode === 'perspective') {
        const proj = calculatePerspectiveProjection(finalPos, canvas, state.actualZoom, state.actualFov);
        if (!proj.behind) {
            proj.x += state.viewOffsetX;
            proj.y += state.viewOffsetY;
        }
        return proj;
    } 
    
    // Orthographic
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = state.actualZoom * 0.5;
    return {
        x: centerX + finalPos.x * scale + state.viewOffsetX,
        y: centerY + finalPos.y * scale + state.viewOffsetY,
        scale: scale,
        behind: false
    };
};

// Helper to find the 3D point on the ecliptic plane (Z=0) corresponding to a screen click.
// Uses ray-plane intersection for accurate results in both perspective and orthographic modes.
export const unprojectOnEcliptic = (
    screenX: number,
    screenY: number,
    canvas: HTMLCanvasElement,
    state: AppState
): { x: number, y: number } => {
    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    
    const vx = screenX - cx - state.viewOffsetX;
    const vy = screenY - cy - state.viewOffsetY;
    
    const rotMultiplier = (state.enableLineZDrift && state.lineDriftAxis === 'x') ? 1 : -1;
    const rotation = state.rotation * rotMultiplier;
    const tilt = state.tilt;

    // --- Helper to Un-Apply Gizmo in View Space ---
    const unGizmo = (pView: Vector3D): Vector3D => {
        if (state.pivotPoint) {
            const pivotOffset = state.pivotOffset || { x: 0, y: 0, z: 0 };
            // Pivot is already in View Space
            const viewPivot = state.pivotPoint;
            return unapplyWorldTransform(pView, viewPivot, state.worldRotation, pivotOffset);
        }
        return pView;
    };

    if (state.renderMode === 'perspective') {
        const dist = 4000 / state.actualZoom;
        // Camera Origin in View Space: (0, 0, -dist) based on our projection logic
        const originView = { x: 0, y: 0, z: -dist };
        
        // Point on Focus Plane (z=0 in View Space) corresponding to screen pixel
        const f = (height / 2) / Math.tan((state.actualFov * Math.PI / 180) / 2);
        const scaleAtZero = f / dist;
        
        const pointView = {
            x: vx / scaleAtZero,
            y: vy / scaleAtZero,
            z: 0
        };

        // --- 1. Reverse Gizmo Transform (View Space -> View Space) ---
        const originPreGizmo = unGizmo(originView);
        const pointPreGizmo = unGizmo(pointView);
        
        // --- 2. Transform Ray to World Space (Inverse Camera) ---
        const originWorld = inverseCameraTransform(originPreGizmo, rotation, tilt);
        const pointWorld = inverseCameraTransform(pointPreGizmo, rotation, tilt);
        
        // Ray: O + t * (P - O)
        // Intersection with Plane Z=0
        const dz = pointWorld.z - originWorld.z;
        if (Math.abs(dz) < 0.0001) return { x: 0, y: 0 }; // Ray parallel to plane
        
        const t = -originWorld.z / dz;
        
        return {
            x: originWorld.x + t * (pointWorld.x - originWorld.x),
            y: originWorld.y + t * (pointWorld.y - originWorld.y)
        };
        
    } else {
        // Orthographic Projection
        const scale = state.actualZoom * 0.5;
        const xView = vx / scale;
        const yView = vy / scale;
        
        // Ray direction is constant (parallel projection)
        const p1View = { x: xView, y: yView, z: 0 };
        const p2View = { x: xView, y: yView, z: 1000 };

        // --- 1. Reverse Gizmo ---
        const p1PreGizmo = unGizmo(p1View);
        const p2PreGizmo = unGizmo(p2View);
        
        // --- 2. Inverse Camera ---
        const p1World = inverseCameraTransform(p1PreGizmo, rotation, tilt);
        const p2World = inverseCameraTransform(p2PreGizmo, rotation, tilt);
        
        const dz = p2World.z - p1World.z;
        if (Math.abs(dz) < 0.0001) return { x: p1World.x, y: p1World.y };
        
        const t = -p1World.z / dz;
        
        return {
            x: p1World.x + t * (p2World.x - p1World.x),
            y: p1World.y + t * (p2World.y - p1World.y)
        };
    }
};


// --- NEW: Raycasting for Lines ---

const distToSegmentSq = (p: {x:number,y:number}, v: {x:number,y:number}, w: {x:number,y:number}): number => {
  const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
  if (l2 === 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
};

const getTForSegment = (p: {x:number,y:number}, v: {x:number,y:number}, w: {x:number,y:number}): number => {
  const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
  if (l2 === 0) return 0;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  return Math.max(0, Math.min(1, t));
};

/**
 * Scans all lines to find the closest point to the mouse cursor in 3D View Space.
 * Used for snapping the Gizmo pivot to lines.
 * Returns the point in View Space (after Camera, BEFORE Gizmo) so the Gizmo can snap directly to it.
 */
export const findClosestPointOnLines = (
    mouseX: number,
    mouseY: number,
    lines: Line[],
    state: AppState,
    canvas: HTMLCanvasElement,
    threshold: number = 5 // pixels
): Vector3D | null => {
    let closestPointView: Vector3D | null = null;
    let minDistSq = threshold * threshold;
    
    // Initialize bestZ to Infinity.
    // In our projection model: viewPlaneDistance = cameraDistance + pos.z.
    // Smallest Z means smallest distance to camera (closest).
    let bestZ = Infinity; 

    const rotMultiplier = (state.enableLineZDrift && state.lineDriftAxis === 'x') ? 1 : -1;
    const cameraRotation = state.rotation * rotMultiplier;
    const pivotOffset = state.pivotOffset || { x: 0, y: 0, z: 0 };
    const viewPivot = state.pivotPoint || { x: 0, y: 0, z: 0 };

    // Iterate backwards through lines (newest first) for priority
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Z-offsets
        const fromZOffset = state.actualZOffsets[line.fromPlanetName] ?? 0;
        const toZOffset = state.actualZOffsets[line.toPlanetName] ?? 0;
        
        const rawFrom = { ...line.from, z: line.from.z + fromZOffset };
        const rawTo = { ...line.to, z: line.to.z + toZOffset };

        // 1. Apply Transforms to get to Screen Space (Full Pipeline)
        
        // A. Camera Transform (Pre-Gizmo View Space)
        // We need these for the RETURN value.
        const viewFrom = applyCameraTransform(rawFrom, cameraRotation, state.tilt);
        const viewTo = applyCameraTransform(rawTo, cameraRotation, state.tilt);
        
        // B. Gizmo (if active) - For Visual Hit Testing
        let finalFrom = viewFrom;
        let finalTo = viewTo;
        
        if (state.pivotPoint) {
            finalFrom = applyWorldTransform(viewFrom, viewPivot, state.worldRotation, pivotOffset);
            finalTo = applyWorldTransform(viewTo, viewPivot, state.worldRotation, pivotOffset);
        }
        
        // C. Project to Screen
        const projFrom = state.renderMode === 'perspective' 
            ? calculatePerspectiveProjection(finalFrom, canvas, state.actualZoom, state.actualFov)
            : { 
                x: canvas.width/2 + finalFrom.x * state.actualZoom * 0.5, 
                y: canvas.height/2 + finalFrom.y * state.actualZoom * 0.5, 
                scale: 1, behind: false 
              };
        
        const projTo = state.renderMode === 'perspective'
            ? calculatePerspectiveProjection(finalTo, canvas, state.actualZoom, state.actualFov)
            : { 
                x: canvas.width/2 + finalTo.x * state.actualZoom * 0.5, 
                y: canvas.height/2 + finalTo.y * state.actualZoom * 0.5, 
                scale: 1, behind: false 
              };

        if (state.renderMode === 'perspective') {
            if (!projFrom.behind) { projFrom.x += state.viewOffsetX; projFrom.y += state.viewOffsetY; }
            if (!projTo.behind) { projTo.x += state.viewOffsetX; projTo.y += state.viewOffsetY; }
        } else {
            projFrom.x += state.viewOffsetX; projFrom.y += state.viewOffsetY;
            projTo.x += state.viewOffsetX; projTo.y += state.viewOffsetY;
        }
        
        if (projFrom.behind || projTo.behind) continue;

        // 2. Check Distance in Screen Space
        const mouseP = { x: mouseX, y: mouseY };
        const dSq = distToSegmentSq(mouseP, projFrom, projTo);

        if (dSq < minDistSq) {
            // We found a candidate line segment closer than current best.
            // Find the t value (0-1) on the segment
            const t = getTForSegment(mouseP, projFrom, projTo);
            
            // Calculate visual depth for sorting (using Post-Gizmo coordinates)
            const hitZ = finalFrom.z + (finalTo.z - finalFrom.z) * t;

            // Check depth (Min Z is closest to camera in this projection setup)
            if (hitZ < bestZ) {
                minDistSq = dSq;
                bestZ = hitZ;
                
                // Return the point in PRE-GIZMO View Space
                // This ensures the pivot is set to the correct reference frame coordinate.
                closestPointView = {
                    x: viewFrom.x + (viewTo.x - viewFrom.x) * t,
                    y: viewFrom.y + (viewTo.y - viewFrom.y) * t,
                    z: viewFrom.z + (viewTo.z - viewFrom.z) * t
                };
            }
        }
    }

    return closestPointView;
};


// ... (calculatePlanetPosition remains unchanged)
export const calculatePlanetPosition = (
    planet: CelestialBodyData,
    time: number,
    state: AppState
): Vector3D => {
    const { currentSystem } = state;
    const system = STAR_SYSTEMS[currentSystem];

    if (system?.stars && system.stars.length > 0) {
        return calculateBinarySystemPosition(planet, time, state);
    }

    switch (currentSystem) {
        case 'Geo-centric':
            return calculateGeoCentricPosition(planet, time, state);
        case 'Cubica':
            return calculateCubicaPosition(planet, time, state);
        default:
            return calculateSolSystemPosition(planet, time, state);
    }
};
export const transform3D = applyCameraTransform;
export const rotatePointAroundPivot = (p: Vector3D, pivot: Vector3D, rot: Vector3D) => applyWorldTransform(p, pivot, rot, {x:0, y:0, z:0});
