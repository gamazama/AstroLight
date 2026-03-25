
import React, { useEffect, useRef, useCallback } from 'react';
import type { AppState } from '../types/state';
import { rgbToId } from '../utils/colorUtils';
import { useAppStore } from '../store/appStore';
import { calculatePlanetPosition, project2D, unprojectOnEcliptic, applyWorldTransform, unapplyWorldTransform, applyCameraTransform, findClosestPointOnLines } from './renderer/calculations';
import { shallow } from 'zustand/shallow';
import { interactionState } from '../store/interactionState';
import { getGizmoPaths, hitTestGizmo, getProjectedVector, getGizmoButtons } from './renderer/gizmoGeometry';
import * as THREE from 'three';

type UseOrbitInputProps = {
    mainCanvasRef: React.RefObject<HTMLCanvasElement>;
    orbitIdCanvasRef: React.RefObject<HTMLCanvasElement>;
    idToNodeIdMapRef: React.MutableRefObject<Map<number, number>>;
};

export const useOrbitInput = ({
    mainCanvasRef,
    orbitIdCanvasRef,
    idToNodeIdMapRef,
}: UseOrbitInputProps) => {
    
    const { 
        setHoveredPlanetId, 
        updateUI, 
        createCanvasConnection, 
        startConnectionSuccessAnimation, 
        getCelestialBody, 
        updateVisuals, 
        updateSimulation, 
        clearPlanetConnection, 
        addPlanetEditorPanel,
        exitPlanetModificationMode,
        adjustParameter,
        removePivot,
    } = useAppStore(state => ({
        setHoveredPlanetId: state.actions.setHoveredPlanetId,
        updateUI: state.actions.updateUI,
        createCanvasConnection: state.actions.createCanvasConnection,
        startConnectionSuccessAnimation: state.actions.startConnectionSuccessAnimation,
        getCelestialBody: state.actions.getCelestialBody,
        updateVisuals: state.actions.updateVisuals,
        updateSimulation: state.actions.updateSimulation,
        clearPlanetConnection: state.actions.clearPlanetConnection,
        addPlanetEditorPanel: state.actions.addPlanetEditorPanel,
        exitPlanetModificationMode: state.actions.exitPlanetModificationMode,
        adjustParameter: state.actions.adjustParameter,
        removePivot: state.actions.removePivot,
    }), shallow);

    const preConnectionStateRef = useRef<{
        originalShowPlanets: boolean;
        didChangeShowPlanets: boolean;
        originalShowLabels: boolean;
        didChangeShowLabels: boolean;
        originalTimeSpeed: number;
        didChangeTimeSpeed: boolean;
    } | null>(null);

    const startPlanetIdOnMouseDownRef = useRef<number | null>(null);
    const startPointOnMouseDownRef = useRef({ x: 0, y: 0 });
    const latestHoveredIdRef = useRef<number | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const latestMouseDataRef = useRef<{ nodeId: number | null; clientX: number; clientY: number } | null>(null);
    
    // Gizmo References
    const gizmoDragRef = useRef<{
        startRotation: { x: number, y: number, z: number };
        lastMouse: { x: number, y: number };
        tangent: { x: number, y: number };
    } | null>(null);

    // Trackball Reference
    const trackballRef = useRef<{
        isActive: boolean;
        lastMouse: { x: number, y: number };
        startRotation: { x: number, y: number, z: number };
    }>({
        isActive: false,
        lastMouse: { x: 0, y: 0 },
        startRotation: { x: 0, y: 0, z: 0 }
    });


    const triggerConnectionAnimation = useCallback((fromId: number, toId: number) => {
        const s = useAppStore.getState();
        const canvas = mainCanvasRef.current;
        if (!canvas) return;
    
        const fromNode = s.planetNodes.find(n => n.id === fromId);
        const toNode = s.planetNodes.find(n => n.id === toId);
        if (!fromNode || !toNode) return;
    
        const fromPlanet = getCelestialBody(fromNode.name);
        const toPlanet = getCelestialBody(toNode.name);
        if (!fromPlanet || !toPlanet) return;
        
        let fromPos3D = calculatePlanetPosition(fromPlanet, s.time, s);
        fromPos3D.z += s.actualZOffsets[fromPlanet.name] ?? 0;
        const fromScreenPos = project2D(fromPos3D, canvas, s);
    
        let toPos3D = calculatePlanetPosition(toPlanet, s.time, s);
        toPos3D.z += s.actualZOffsets[toPlanet.name] ?? 0;
        const toScreenPos = project2D(toPos3D, canvas, s);
        
        if (fromScreenPos.behind || toScreenPos.behind) return;
    
        startConnectionSuccessAnimation({ fromScreenPos, toScreenPos, color: fromNode.color });
    }, [mainCanvasRef, getCelestialBody, startConnectionSuccessAnimation]);

    useEffect(() => {
        const mainCanvas = mainCanvasRef.current;
        const idCanvas = orbitIdCanvasRef.current;
        if (!mainCanvas || !idCanvas) return;
        const ctxId = idCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctxId) return;

        const updateStateInRaf = () => {
            rafIdRef.current = null; 
            if (!latestMouseDataRef.current) return;

            const { nodeId, clientX, clientY } = latestMouseDataRef.current;
            const s = useAppStore.getState();
            
            let hoveredPosition: { x: number; y: number } | null = null;
            if (nodeId && mainCanvasRef.current) {
                const toNode = s.planetNodes.find(n => n.id === nodeId);
                if (toNode) {
                    const toPlanet = getCelestialBody(toNode.name);
                    if (toPlanet) {
                        let toPos3D = calculatePlanetPosition(toPlanet, s.time, s);
                        toPos3D.z += s.actualZOffsets[toPlanet.name] ?? 0;
                        const toProj = project2D(toPos3D, mainCanvasRef.current, s);
                        if (!toProj.behind) {
                            hoveredPosition = { x: toProj.x, y: toProj.y };
                        }
                    }
                }
            }
            if (s.hoveredPlanetPosition?.x !== hoveredPosition?.x || s.hoveredPlanetPosition?.y !== hoveredPosition?.y) {
                updateUI({ hoveredPlanetPosition: hoveredPosition });
            }
            if (s.hoveredPlanetId !== nodeId) {
                setHoveredPlanetId(nodeId);
            }
            const currentHoverState = s.canvasHoverState;
            if (currentHoverState?.planetId !== nodeId || currentHoverState?.mouseX !== clientX || currentHoverState?.mouseY !== clientY) {
                updateUI({ canvasHoverState: nodeId ? { planetId: nodeId, mouseX: clientX, mouseY: clientY } : null });
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const s = useAppStore.getState();
            
            // --- GIZMO AXIS DRAG ---
            if (interactionState.gizmo.activeAxis && gizmoDragRef.current) {
                e.preventDefault();
                e.stopPropagation();
                mainCanvas.style.cursor = 'grabbing';
                
                const axis = interactionState.gizmo.activeAxis;
                const { startRotation, lastMouse, tangent } = gizmoDragRef.current;
                
                // Calculate movement along the tangent vector
                const dx = e.clientX - lastMouse.x;
                const dy = e.clientY - lastMouse.y;
                
                // Dot product projects mouse movement onto the ring's tangent.
                const projectedMove = (dx * tangent.x + dy * tangent.y);
                
                // 1 degree per pixel of movement along the curve feels approximately 1:1 physically
                const degreesDelta = projectedMove * 0.8;

                const newRot = { ...startRotation };
                newRot[axis] += degreesDelta;
                
                adjustParameter({ worldRotation: newRot });
                gizmoDragRef.current.startRotation = newRot;
                gizmoDragRef.current.lastMouse = { x: e.clientX, y: e.clientY };
                return;
            }

            // --- BACKGROUND TRACKBALL DRAG ---
            if (trackballRef.current.isActive) {
                e.preventDefault();
                e.stopPropagation();
                mainCanvas.style.cursor = 'grabbing';
                
                const dx = e.clientX - trackballRef.current.lastMouse.x;
                const dy = e.clientY - trackballRef.current.lastMouse.y;
                
                const sens = 0.2; // Reduce sensitivity for smoother control
                const newRot = { ...s.worldRotation };
                
                newRot.y += dx * sens; 
                newRot.x += dy * sens;

                adjustParameter({ worldRotation: newRot });
                trackballRef.current.lastMouse = { x: e.clientX, y: e.clientY };
                return;
            }

            // --- GIZMO HOVER CHECK ---
            if (s.pivotPoint && s.showPivot && !s.isCameraDragging && !s.isBrushMode) {
                const paths = getGizmoPaths(s, mainCanvas, interactionState.gizmo.hoveredAxis);
                const buttons = getGizmoButtons(s, mainCanvas, e.clientX, e.clientY);
                const hit = hitTestGizmo(e.clientX, e.clientY, paths, buttons);
                
                // Handle Buttons Cursor
                if (hit && 'type' in hit && hit.type === 'button') {
                    mainCanvas.style.cursor = 'pointer';
                    interactionState.gizmo.hoveredAxis = null;
                } else {
                    const hitAxis = (hit && 'axis' in hit) ? hit.axis : null;
                    if (interactionState.gizmo.hoveredAxis !== hitAxis) {
                        interactionState.gizmo.hoveredAxis = hitAxis;
                        if (!s.hoveredPlanetId) {
                             mainCanvas.style.cursor = hitAxis ? 'grab' : 'default';
                        }
                    }
                }
            }

            let nodeId: number | null = null;
            const isScrubbing = s.isSpeedScrubbing || s.isZOffsetScrubbing || s.isDriftScrubbing || s.isFovScrubbing;
            const isInteractionBlocked = s.isCameraDragging || s.isBrushMode || (!s.showOrbits && !s.isPlanetModificationMode) || isScrubbing;

            if (!isInteractionBlocked) {
                const pixel = ctxId.getImageData(e.clientX, e.clientY, 1, 1).data;
                if (pixel[3] !== 0) {
                    const id = rgbToId(pixel[0], pixel[1], pixel[2]);
                    nodeId = idToNodeIdMapRef.current.get(id) || null;
                }
            }
            
            latestHoveredIdRef.current = nodeId;
            latestMouseDataRef.current = { nodeId, clientX: e.clientX, clientY: e.clientY };

            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(updateStateInRaf);
            }
        };
        
        const handleMouseDown = (e: MouseEvent) => {
            const s = useAppStore.getState();
            
            // --- GIZMO INTERACTION ---
            if (s.pivotPoint && s.showPivot && !s.isCameraDragging && !s.isBrushMode) {
                const paths = getGizmoPaths(s, mainCanvas, interactionState.gizmo.hoveredAxis);
                const buttons = getGizmoButtons(s, mainCanvas, e.clientX, e.clientY);
                const hit = hitTestGizmo(e.clientX, e.clientY, paths, buttons);
                
                // 1. Buttons
                if (hit && 'type' in hit && hit.type === 'button') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (hit.action === 'close') {
                        removePivot(); // Use smooth remove
                    } else if (hit.action === 'hide') {
                        adjustParameter({ showPivot: false });
                    }
                    return;
                }

                // 2. Axis Drag
                if (hit && 'axis' in hit) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Set global mouse down state to prevent 'adjustParameter' from committing history on every frame
                    updateUI({ isMouseDown: true });

                    interactionState.gizmo.activeAxis = hit.axis;
                    gizmoDragRef.current = {
                        startRotation: { ...s.worldRotation },
                        lastMouse: { x: e.clientX, y: e.clientY },
                        tangent: hit.tangent
                    };
                    
                    mainCanvas.style.cursor = 'grabbing';
                    return;
                }
                
                // 3. Background Trackball
                if (e.button === 0 && !e.altKey && !s.hoveredPlanetId) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Set global mouse down state to prevent history spam
                    updateUI({ isMouseDown: true });

                    trackballRef.current = {
                        isActive: true,
                        lastMouse: { x: e.clientX, y: e.clientY },
                        startRotation: { ...s.worldRotation }
                    };
                    mainCanvas.style.cursor = 'grabbing';
                    return;
                }
            }
            
            // --- PIVOT SETTING (Alt + Click) ---
            if (e.altKey && e.button === 0) {
                e.preventDefault();
                e.stopPropagation();
                
                // Set global mouse down state
                updateUI({ isMouseDown: true });
                
                const currentOffset = s.pivotOffset || { x: 0, y: 0, z: 0 };

                let newPivotView: { x: number, y: number, z: number };
                
                // 1. Try to snap to a line first
                const snappedPoint = findClosestPointOnLines(e.clientX, e.clientY, s.lineHistory, s, mainCanvas, 5);

                if (snappedPoint) {
                    // If we snapped to a line, that point is already in the correct "View Space" 
                    // (visually where the line is now) for the gizmo.
                    newPivotView = snappedPoint;
                    updateUI({ notification: `Pivot snapped to line.` });
                } else {
                    // 2. Fallback: Raycast to Ecliptic Plane (Z=0)
                    const visualClickPoint = unprojectOnEcliptic(e.clientX, e.clientY, mainCanvasRef.current, s);
                    const worldPoint3D = { x: visualClickPoint.x, y: visualClickPoint.y, z: 0 };
                    
                    // Transform World Point -> View Space
                    // This locks the pivot to the camera's current frame, isolating it from ambient motion.
                    const rotMultiplier = (s.enableLineZDrift && s.lineDriftAxis === 'x') ? 1 : -1;
                    const rotation = s.rotation * rotMultiplier;
                    newPivotView = applyCameraTransform(worldPoint3D, rotation, s.tilt);
                    
                    updateUI({ notification: `Pivot set.` });
                }
                
                // 3. Calculate Offset Compensation
                // We need to find an offset such that the object doesn't visually jump.
                if (s.pivotPoint) {
                    const currentPivotView = s.pivotPoint;
                    
                    const diff = { 
                        x: newPivotView.x - currentPivotView.x, 
                        y: newPivotView.y - currentPivotView.y, 
                        z: newPivotView.z - currentPivotView.z 
                    };
                    
                    // Since everything is in View Space, we apply the World Rotation to the difference
                    const rotatedDiff = applyWorldTransform(diff, {x:0,y:0,z:0}, s.worldRotation, {x:0,y:0,z:0});
                    
                    const newOffset = {
                        x: currentOffset.x + rotatedDiff.x - diff.x,
                        y: currentOffset.y + rotatedDiff.y - diff.y,
                        z: currentOffset.z + rotatedDiff.z - diff.z
                    };
                    
                    adjustParameter({ 
                        pivotPoint: newPivotView,
                        pivotOffset: newOffset,
                        showPivot: true, 
                        pivotStartTime: performance.now() 
                    });
                } else {
                    // First time setting pivot
                    adjustParameter({ 
                        pivotPoint: newPivotView,
                        pivotOffset: { x: 0, y: 0, z: 0 },
                        showPivot: true, 
                        pivotStartTime: performance.now() 
                    });
                }

                // ENABLE TRACKBALL IMMEDIATELY
                trackballRef.current = {
                    isActive: true,
                    lastMouse: { x: e.clientX, y: e.clientY },
                    startRotation: { ...s.worldRotation }
                };
                mainCanvas.style.cursor = 'grabbing';

                return;
            }

            if (s.isPlanetModificationMode) {
                e.preventDefault();
                e.stopPropagation();
                const hoveredId = latestHoveredIdRef.current;
                if (hoveredId !== null) {
                    addPlanetEditorPanel(hoveredId, { x: e.clientX, y: e.clientY });
                } else {
                    exitPlanetModificationMode();
                }
                return;
            }
            
            if (s.planetConnectionDragInfo && s.planetConnectionDragInfo.mode === 'click') {
                const hoveredId = latestHoveredIdRef.current;
                if (hoveredId !== null && hoveredId !== s.planetConnectionDragInfo.fromNodeId) {
                    triggerConnectionAnimation(s.planetConnectionDragInfo.fromNodeId, hoveredId);
                    createCanvasConnection(s.planetConnectionDragInfo.fromNodeId, hoveredId);
                } else {
                    clearPlanetConnection();
                }
                e.stopPropagation();
                return;
            }
            
            if (s.isCameraDragging || s.isBrushMode || !s.showOrbits || s.planetConnectionDragInfo) return;

            const hoveredId = latestHoveredIdRef.current;
            
            if (hoveredId === null) {
                if (s.canvasConnectingFromNodeId !== null) {
                    updateUI({ canvasConnectingFromNodeId: null });
                }
                return;
            }
            
            e.stopPropagation();

            if (s.canvasConnectingFromNodeId === null) {
                startPlanetIdOnMouseDownRef.current = hoveredId;
                startPointOnMouseDownRef.current = { x: e.clientX, y: e.clientY };
                updateUI({ canvasConnectingFromNodeId: hoveredId });
            } else {
                if (hoveredId === s.canvasConnectingFromNodeId) {
                    updateUI({ canvasConnectingFromNodeId: null });
                } else {
                    triggerConnectionAnimation(s.canvasConnectingFromNodeId, hoveredId);
                    createCanvasConnection(s.canvasConnectingFromNodeId, hoveredId);
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (interactionState.gizmo.activeAxis) {
                interactionState.gizmo.activeAxis = null;
                gizmoDragRef.current = null;
                mainCanvas.style.cursor = 'default';
                return;
            }
            if (trackballRef.current.isActive) {
                trackballRef.current.isActive = false;
                mainCanvas.style.cursor = 'default';
                return;
            }
            
            const s_up = useAppStore.getState();

            if (s_up.planetConnectionDragInfo) {
                if ((e.target as HTMLElement).id === 'main-canvas') {
                    e.preventDefault();
                    e.stopPropagation();
                    const endHoverId = latestHoveredIdRef.current;
                    if (endHoverId !== null && endHoverId !== s_up.planetConnectionDragInfo.fromNodeId) {
                        triggerConnectionAnimation(s_up.planetConnectionDragInfo.fromNodeId, endHoverId);
                        createCanvasConnection(s_up.planetConnectionDragInfo.fromNodeId, endHoverId);
                    } else {
                        clearPlanetConnection();
                    }
                }
                startPlanetIdOnMouseDownRef.current = null;
                return;
            }
            
            const startPlanet = startPlanetIdOnMouseDownRef.current;
            if (startPlanet === null) return;

            const wasClick = Math.hypot(e.clientX - startPointOnMouseDownRef.current.x, e.clientY - startPointOnMouseDownRef.current.y) < 5;

            if (!wasClick) {
                const endHoverId = latestHoveredIdRef.current;
                if (endHoverId !== null && endHoverId !== startPlanet) {
                    triggerConnectionAnimation(startPlanet, endHoverId);
                    createCanvasConnection(startPlanet, endHoverId);
                } else {
                    updateUI({ canvasConnectingFromNodeId: null });
                }
            }
            
            startPlanetIdOnMouseDownRef.current = null;
        };

        const handleMouseLeave = () => {
            const s = useAppStore.getState();
            if (s.canvasConnectingFromNodeId !== null) {
                updateUI({ canvasConnectingFromNodeId: null });
            }
            latestHoveredIdRef.current = null;
            latestMouseDataRef.current = { nodeId: null, clientX: -1, clientY: -1 };
            interactionState.gizmo.hoveredAxis = null;
            trackballRef.current.isActive = false;
            
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(updateStateInRaf);
            }
        };

        mainCanvas.addEventListener('mousemove', handleMouseMove);
        mainCanvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        mainCanvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            mainCanvas.removeEventListener('mousemove', handleMouseMove);
            mainCanvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            mainCanvas.removeEventListener('mouseleave', handleMouseLeave);
            
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [mainCanvasRef, orbitIdCanvasRef, idToNodeIdMapRef, triggerConnectionAnimation, createCanvasConnection, setHoveredPlanetId, updateUI, clearPlanetConnection, addPlanetEditorPanel, exitPlanetModificationMode, getCelestialBody, adjustParameter, removePivot]);

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe((state, prevState) => {
            const connectingId = state.canvasConnectingFromNodeId;
            const wasConnecting = prevState.canvasConnectingFromNodeId !== null;

            if (connectingId !== null && !wasConnecting) {
                const didChangeShowPlanets = !state.showPlanets;
                const didChangeShowLabels = !state.showLabels;
                const didChangeTimeSpeed = state.timeSpeed > 4;

                preConnectionStateRef.current = {
                    originalShowPlanets: state.showPlanets,
                    didChangeShowPlanets,
                    originalShowLabels: state.showLabels,
                    didChangeShowLabels,
                    originalTimeSpeed: state.timeSpeed,
                    didChangeTimeSpeed,
                };

                if (didChangeShowPlanets) updateVisuals({ showPlanets: true });
                if (didChangeShowLabels) updateVisuals({ showLabels: true });
                if (didChangeTimeSpeed) updateSimulation({ timeSpeed: 4 });

            } else if (connectingId === null && wasConnecting) {
                const storedState = preConnectionStateRef.current;
                if (storedState) {
                    if (storedState.didChangeShowPlanets) {
                        updateVisuals({ showPlanets: storedState.originalShowPlanets });
                    }
                    if (storedState.didChangeShowLabels) {
                        updateVisuals({ showLabels: storedState.originalShowLabels });
                    }
                    if (storedState.didChangeTimeSpeed) {
                        updateSimulation({ timeSpeed: storedState.originalTimeSpeed });
                    }
                }
                preConnectionStateRef.current = null;
            }
        });
        
        return unsubscribe;
    }, [updateVisuals, updateSimulation]);
};
