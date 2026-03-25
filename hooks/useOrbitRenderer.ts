
import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { checkOrbitCache, getProjectedOrbitPaths } from './renderer/orbitGeometry';
import { 
    updateAnimationStates, 
    drawOrbitAndMask, 
    drawCursorHighlight, 
    drawConnectionNoodle, 
    drawSuccessAnimation, 
    drawInteractionText,
    drawPivotGizmo, // Added
    AnimatingOrbit 
} from './renderer/orbitDrawing';
import { calculateInteractionText, TextState } from './renderer/orbitInteractionText';
import type { Vector3D } from '../types';


type UseOrbitRendererProps = {
    orbitDisplayCanvasRef: React.RefObject<HTMLCanvasElement>;
    orbitIdCanvasRef: React.RefObject<HTMLCanvasElement>;
    idToNodeIdMapRef: React.MutableRefObject<Map<number, number>>;
};

export const useOrbitRenderer = ({
    orbitDisplayCanvasRef,
    orbitIdCanvasRef,
    idToNodeIdMapRef,
}: UseOrbitRendererProps) => {
    // --- Refs for state that persists across renders without causing re-renders ---
    const orbit3DBaseCacheRef = useRef<Map<number, Vector3D[]>>(new Map());
    const orbit3DCacheKeyRef = useRef('');
    
    const lineEndPointRef = useRef<{ x: number, y: number } | null>(null);
    const animationTimeRef = useRef(0);
    const animatingOrbitsRef = useRef<Map<number, AnimatingOrbit>>(new Map());
    const cursorHighlightRef = useRef({ x: 0, y: 0, intensity: 0 });
    const connectionTextStateRef = useRef<TextState>({
        mode: 'idle',
        startTime: 0,
        fromPlanet: '',
        toPlanet: '',
        displayText: '',
    });

    // --- Zustand state and actions ---
    const stateForAnimationRef = useRef(useAppStore.getState());
    const actions = useAppStore.getState().actions;

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state) => (stateForAnimationRef.current = state)
        );
        return unsubscribe;
    }, []);

    // --- The main rendering loop ---
    const animate = useCallback(() => {
        const s = stateForAnimationRef.current;
        const displayCanvas = orbitDisplayCanvasRef.current;
        const idCanvas = orbitIdCanvasRef.current;
        if (!displayCanvas || !idCanvas) return;

        const ctxDisplay = displayCanvas.getContext('2d');
        const ctxId = idCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctxDisplay || !ctxId) return;

        animationTimeRef.current += 0.02;

        // 1. --- Canvas & Cache Management ---
        if (displayCanvas.width !== window.innerWidth || displayCanvas.height !== window.innerHeight) {
            displayCanvas.width = window.innerWidth;
            displayCanvas.height = window.innerHeight;
            idCanvas.width = window.innerWidth;
            idCanvas.height = window.innerHeight;
            orbit3DCacheKeyRef.current = ''; // Invalidate cache on resize
        }
        checkOrbitCache(s, s.planetsToRender, orbit3DCacheKeyRef, orbit3DBaseCacheRef);
        
        ctxDisplay.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        ctxId.clearRect(0, 0, idCanvas.width, idCanvas.height);
        idToNodeIdMapRef.current.clear();
        
        const isIdMaskVisible = s.debugShowOrbitMask;
        idCanvas.style.display = isIdMaskVisible ? 'block' : 'none';
        displayCanvas.style.opacity = isIdMaskVisible ? '0.1' : '1';
        
        // Apply the user's chosen blend mode to the CANVAS element itself via CSS.
        // We map canvas composite operations (source-over, lighter) to valid CSS mix-blend-mode values.
        const blendModeMap: Record<string, string> = {
            'source-over': 'normal',
            'lighter': 'screen', // CSS doesn't support 'lighter' (additive), 'screen' is the closest standard.
            'multiply': 'multiply',
            'screen': 'screen',
            'overlay': 'overlay'
        };
        displayCanvas.style.mixBlendMode = blendModeMap[s.orbitBlendMode] || 'normal';

        // 2. --- Update Animation States ---
        updateAnimationStates(s, animatingOrbitsRef, cursorHighlightRef);

        // 3. --- Draw Orbits & Masks ---
        for (const node of s.planetsToRender) {
            const paths = getProjectedOrbitPaths(node, s, actions, orbit3DBaseCacheRef, displayCanvas);
            if (paths) {
                drawOrbitAndMask(ctxDisplay, ctxId, paths.path2D, node.id, s, animatingOrbitsRef, idToNodeIdMapRef, animationTimeRef.current);
            }
        }
        
        // 4. --- Draw Interaction Feedback ---
        drawCursorHighlight(ctxDisplay, cursorHighlightRef);
        drawConnectionNoodle(ctxDisplay, s, actions, lineEndPointRef);
        drawSuccessAnimation(ctxDisplay, s, actions);
        drawPivotGizmo(ctxDisplay, s); // Draw Pivot if active

        // 5. --- Draw Instructional Text ---
        const interactionText = calculateInteractionText(s, connectionTextStateRef); 
        drawInteractionText(ctxDisplay, interactionText, s);

    }, [orbitDisplayCanvasRef, orbitIdCanvasRef, actions, idToNodeIdMapRef]);

    useEffect(() => {
        let animationFrameId: number | null = null;
        
        const renderLoop = () => {
            animate();
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [animate]);
};
