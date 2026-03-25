
import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { CAMERA_DRAG_LERP_FACTOR, CAMERA_DRAG_SENSITIVITY, CAMERA_RESET_DURATION_MS, CONTROL_CIRCLE_SIZE_PX, MAX_ZOOM, MIN_ZOOM, CAMERA_ZOOM_FACTOR } from '../constants';
import { lerp, smoothEase } from '../utils/mathUtils';
import { interactionState } from '../store/interactionState';
import { getGizmoPaths, hitTestGizmo, getGizmoButtons } from './renderer/gizmoGeometry';


// Helper function to wrap an angle between -180 and 180
const wrapAngle = (angle: number): number => {
    // The double modulo is to handle negative numbers correctly in JS
    return ((((angle + 180) % 360) + 360) % 360) - 180;
};


export const useCameraInput = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
    const { updateUI, updateVisuals, adjustParameter } = useAppStore.getState().actions;
    
    const animationFrameId = useRef<number | null>(null);
    const resetAnimationRef = useRef<number | null>(null);

    // --- State refs for both drag and pan ---
    const isRotatingRef = useRef(false); // for rotation
    const isPanningRef = useRef(false); // for panning
    
    // Rotation state
    const rotationMouseTargetRef = useRef({ x: 0, y: 0 });
    const rotationLerpedPositionRef = useRef({ x: 0, y: 0 });
    const lastRotationLerpedPositionRef = useRef({ x: 0, y: 0 });

    // Panning state
    const panMouseTargetRef = useRef({ x: 0, y: 0 });
    const panLerpedPositionRef = useRef({ x: 0, y: 0 });
    const lastPanLerpedPositionRef = useRef({ x: 0, y: 0 });

    const stopUpdateAnimation = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    }, []);

    const startUpdateAnimation = useCallback(() => {
        stopUpdateAnimation(); // Ensure no multiple loops are running

        const animate = () => {
            if (!isRotatingRef.current && !isPanningRef.current) {
                stopUpdateAnimation();
                return;
            }

            const s = useAppStore.getState();
            const lerpFactor = CAMERA_DRAG_LERP_FACTOR;
            
            // --- Handle Rotation ---
            if (isRotatingRef.current) {
                const newCircleX = s.disableCameraSmoothing ? rotationMouseTargetRef.current.x : lerp(rotationLerpedPositionRef.current.x, rotationMouseTargetRef.current.x, lerpFactor);
                const newCircleY = s.disableCameraSmoothing ? rotationMouseTargetRef.current.y : lerp(rotationLerpedPositionRef.current.y, rotationMouseTargetRef.current.y, lerpFactor);

                rotationLerpedPositionRef.current.x = newCircleX;
                rotationLerpedPositionRef.current.y = newCircleY;

                const deltaX = rotationLerpedPositionRef.current.x - lastRotationLerpedPositionRef.current.x;
                const deltaY = rotationLerpedPositionRef.current.y - lastRotationLerpedPositionRef.current.y;

                if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
                    const newTilt = s.tilt - (deltaY * CAMERA_DRAG_SENSITIVITY);
                    updateVisuals({
                        rotation: s.rotation - (deltaX * CAMERA_DRAG_SENSITIVITY),
                        tilt: wrapAngle(newTilt),
                    });
                    if (s.controlCircle) {
                       updateUI({ controlCircle: { ...s.controlCircle, x: newCircleX, y: newCircleY } });
                    }
                }
                lastRotationLerpedPositionRef.current.x = rotationLerpedPositionRef.current.x;
                lastRotationLerpedPositionRef.current.y = rotationLerpedPositionRef.current.y;
            }

            // --- Handle Panning ---
            if (isPanningRef.current) {
                const newPanX = s.disableCameraSmoothing ? panMouseTargetRef.current.x : lerp(panLerpedPositionRef.current.x, panMouseTargetRef.current.x, lerpFactor);
                const newPanY = s.disableCameraSmoothing ? panMouseTargetRef.current.y : lerp(panLerpedPositionRef.current.y, panMouseTargetRef.current.y, lerpFactor);

                panLerpedPositionRef.current.x = newPanX;
                panLerpedPositionRef.current.y = newPanY;

                const deltaX = panLerpedPositionRef.current.x - lastPanLerpedPositionRef.current.x;
                const deltaY = panLerpedPositionRef.current.y - lastPanLerpedPositionRef.current.y;

                if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
                    updateVisuals({ 
                        viewOffsetX: s.viewOffsetX + deltaX, 
                        viewOffsetY: s.viewOffsetY + deltaY 
                    });
                }
                lastPanLerpedPositionRef.current.x = panLerpedPositionRef.current.x;
                lastPanLerpedPositionRef.current.y = panLerpedPositionRef.current.y;
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

    }, [stopUpdateAnimation, updateUI, updateVisuals]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onMouseDown = (e: MouseEvent) => {
            const s = useAppStore.getState();
            
            // --- BLOCK ROTATION IF GIZMO IS ACTIVE ---
            // If a pivot is set and visible, dragging the background (left click) should rotate the OBJECT (via OrbitInput),
            // not the camera. We allow Panning (Middle Click OR Alt+Middle) but disable Left Click Rotation.
            // We also specifically check if Alt is pressed with Left Click (Pivot Creation), which should NOT rotate camera.
            if (s.pivotPoint && s.showPivot && e.button === 0 && !e.altKey) {
                // Before blocking, check if we hit a UI button (which should be handled by OrbitInput, so we return here too)
                return;
            }
            
            // --- BLOCK IF GIZMO IS HOVERED (Double check for safety) ---
            // Only check if not panning (middle click bypasses gizmo interaction)
            if (s.pivotPoint && s.showPivot && !s.isBrushMode && e.button === 0) {
                const paths = getGizmoPaths(s, canvas, null);
                const buttons = getGizmoButtons(s, canvas, e.clientX, e.clientY);
                const hit = hitTestGizmo(e.clientX, e.clientY, paths, buttons);
                if (hit) {
                    // If hit is an axis, OrbitInput handles it.
                    if ('axis' in hit) interactionState.gizmo.hoveredAxis = hit.axis;
                    return; 
                }
            }
            
            if (s.hoveredPlanetId !== null || s.isResettingCamera) return;

            // Block camera interaction while a scrub key is held (covers the timer delay period too)
            if (interactionState.heldScrubKeys.size > 0) return;

            if (e.button === 0) { // Left-click for rotation
                if (s.isBrushMode && !e.altKey) return;
                
                isRotatingRef.current = true;
                
                rotationMouseTargetRef.current = { x: e.clientX, y: e.clientY };
                rotationLerpedPositionRef.current = { x: e.clientX, y: e.clientY };
                lastRotationLerpedPositionRef.current = { x: e.clientX, y: e.clientY };
                
                updateUI({ isCameraDragging: true, controlCircle: { visible: true, x: e.clientX, y: e.clientY, size: CONTROL_CIRCLE_SIZE_PX } });
                startUpdateAnimation();
            } else if (e.button === 1) { // Middle-click for panning (Allow Alt+Middle too)
                if (s.isBrushMode) return;
                
                e.preventDefault();
                isPanningRef.current = true;
                panMouseTargetRef.current = { x: e.clientX, y: e.clientY };
                panLerpedPositionRef.current = { x: e.clientX, y: e.clientY };
                lastPanLerpedPositionRef.current = { x: e.clientX, y: e.clientY };

                canvas.style.cursor = 'grabbing';
                updateUI({ isCameraPanning: true });
                startUpdateAnimation();
            }
        };

        const onMouseUp = () => {
            if (isRotatingRef.current) {
                isRotatingRef.current = false;
                const s = useAppStore.getState();
                updateUI({ isCameraDragging: false, controlCircle: s.controlCircle ? { ...s.controlCircle, visible: false } : null });
            }
            if (isPanningRef.current) {
                isPanningRef.current = false;
                const s = useAppStore.getState();
                canvas.style.cursor = s.isBrushMode ? 'none' : (s.hoveredPlanetId ? 'crosshair' : 'grab');
                updateUI({ isCameraPanning: false });
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isRotatingRef.current) {
                rotationMouseTargetRef.current = { x: e.clientX, y: e.clientY };
            }
            if (isPanningRef.current) {
                panMouseTargetRef.current = { x: e.clientX, y: e.clientY };
            }
        };

        const onDoubleClick = () => {
            if (resetAnimationRef.current) cancelAnimationFrame(resetAnimationRef.current);
            const sReset = useAppStore.getState();
            let startTilt = sReset.tilt;
            let startRotation = sReset.rotation;
            let startOffsetX = sReset.viewOffsetX;
            let startOffsetY = sReset.viewOffsetY;
            
            // For Pivot Reset
            let startWorldRot = sReset.worldRotation;
            let startPivotOffset = sReset.pivotOffset;
            
            let startTime = performance.now();
            const duration = CAMERA_RESET_DURATION_MS;
            updateUI({ isResettingCamera: true });
            
            // Only trigger pivot close state if we actually have a pivot
            if (sReset.pivotPoint) {
                updateVisuals({ pivotClosingStartTime: startTime });
            }

            const animateReset = (time: number) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = smoothEase(progress, 'ease-out');

                updateVisuals({
                    tilt: startTilt * (1 - easedProgress),
                    rotation: startRotation * (1 - easedProgress),
                    viewOffsetX: startOffsetX * (1 - easedProgress),
                    viewOffsetY: startOffsetY * (1 - easedProgress),
                    // Interpolate World Transform to 0
                    worldRotation: {
                        x: startWorldRot.x * (1 - easedProgress),
                        y: startWorldRot.y * (1 - easedProgress),
                        z: startWorldRot.z * (1 - easedProgress),
                    },
                    pivotOffset: {
                        x: startPivotOffset.x * (1 - easedProgress),
                        y: startPivotOffset.y * (1 - easedProgress),
                        z: startPivotOffset.z * (1 - easedProgress),
                    }
                });

                if (progress < 1) {
                    resetAnimationRef.current = requestAnimationFrame(animateReset);
                } else {
                    updateUI({ isResettingCamera: false });
                    
                    // Finalize
                    // We need to call adjustParameter to commit the history state cleanly once at the end
                    // Also clears pivot
                    adjustParameter({ 
                        tilt: 0, rotation: 0, viewOffsetX: 0, viewOffsetY: 0,
                        worldRotation: {x:0, y:0, z:0},
                        pivotOffset: {x:0, y:0, z:0},
                        pivotPoint: null,
                        showPivot: true,
                        pivotClosingStartTime: null
                    });
                    
                    resetAnimationRef.current = null;
                }
            };
            resetAnimationRef.current = requestAnimationFrame(animateReset);
        };

        const onContextMenu = (e: MouseEvent) => {
            if (isPanningRef.current) {
                e.preventDefault();
            }
        };
        
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mouseleave', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('dblclick', onDoubleClick);
        canvas.addEventListener('contextmenu', onContextMenu);

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mouseleave', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('dblclick', onDoubleClick);
            canvas.removeEventListener('contextmenu', onContextMenu);
            stopUpdateAnimation();
            if (resetAnimationRef.current) cancelAnimationFrame(resetAnimationRef.current);
        };
    }, [canvasRef, startUpdateAnimation, stopUpdateAnimation, updateUI, updateVisuals, adjustParameter]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const sZoom = useAppStore.getState();
            const zoomFactor = e.deltaY > 0 ? (1 - CAMERA_ZOOM_FACTOR) : (1 + CAMERA_ZOOM_FACTOR);
            const newZoom = sZoom.targetZoom * zoomFactor;
            updateVisuals({ targetZoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)) });
        };
        
        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, [canvasRef, updateVisuals]);
};
