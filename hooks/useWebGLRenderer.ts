import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { threeJsBridge } from './renderer/threeJsBridge';
import * as backgroundController from './renderer/webgl/backgroundController';
import * as lineController from './renderer/webgl/foregroundController';
import * as particleController from './renderer/webgl/particleController';
import { lerp } from '../utils/mathUtils';
import { registerFrameCallback, unregisterFrameCallback } from './renderLoop';

export const useWebGLRenderer = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const stateForAnimationRef = useRef(useAppStore.getState());
    const backgroundCameraState = useRef({ fov: 75, zoom: 1 });
    const isFirstRender = useRef(true); // To handle initial hook call state for React 18 StrictMode

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state) => (stateForAnimationRef.current = state)
        );
        return unsubscribe;
    }, []);

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        // --- Core Three.js Setup ---
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasEl, 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;

        // --- Cameras ---
        const CAMERA_FAR_PLANE = 2000000; // Increased clipping distance
        const backgroundCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, CAMERA_FAR_PLANE);
        backgroundCamera.position.set(0, 0, 0.1);

        const foregroundCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, CAMERA_FAR_PLANE);
        const foregroundOrthographicCamera = new THREE.OrthographicCamera(
            window.innerWidth / -2,
            window.innerWidth / 2,
            window.innerHeight / 2,
            window.innerHeight / -2,
            -CAMERA_FAR_PLANE, // Use a large negative near plane to avoid any clipping
            CAMERA_FAR_PLANE
        );
        // With a symmetric frustum around z=0, the camera position can be at the origin.
        foregroundOrthographicCamera.position.z = 0;

        const foregroundCameraPivot = new THREE.Object3D();
        foregroundCameraPivot.add(foregroundCamera);
        foregroundCameraPivot.add(foregroundOrthographicCamera);


        // --- Scenes ---
        const backgroundScene = new THREE.Scene();
        const foregroundScene = new THREE.Scene();
        foregroundScene.add(foregroundCameraPivot);


        // --- Initialize Controllers ---
        const backgroundObjects = backgroundController.init(backgroundScene, backgroundCamera);
        const lineRenderers = lineController.init(foregroundScene, stateForAnimationRef.current.maxLines);
        const particleRenderer = particleController.init(foregroundScene);

        // --- Populate the Bridge ---
        threeJsBridge.renderer = renderer;
        threeJsBridge.backgroundScene = backgroundScene;
        threeJsBridge.backgroundCamera = backgroundCamera;
        threeJsBridge.foregroundScene = foregroundScene;
        threeJsBridge.foregroundCamera = foregroundCamera;
        threeJsBridge.foregroundOrthographicCamera = foregroundOrthographicCamera;
        threeJsBridge.foregroundCameraPivot = foregroundCameraPivot;
        threeJsBridge.backgroundObjects = backgroundObjects;
        threeJsBridge.lineRenderer = lineRenderers.lineRenderer;
        threeJsBridge.liveLineRenderer = lineRenderers.liveLineRenderer;
        threeJsBridge.particleRenderer = particleRenderer;
        
        // --- Main Animation Loop ---
        const clock = new THREE.Clock();

        const animate = () => {
            // Cap delta at 100ms to handle tab-away gracefully
            const delta = Math.min(clock.getDelta(), 0.1);
            const elapsedTime = clock.getElapsedTime();
            const state = stateForAnimationRef.current;
            
            // --- Update Background Camera ---
            const LERP_FACTOR = 0.05;

            let fovDestination: number;
            let zoomDestination: number;

            if (state.renderMode === 'orthographic') {
                // When the main camera is in orthographic mode, the background (which is always perspective)
                // should smoothly animate to a 30-degree FOV to visually match it.
                fovDestination = 30;
                // The targetZoom at this point holds the correct perspective-equivalent zoom.
                // We reduce the background scale in orthographic mode to keep the context visible.
                zoomDestination = state.targetZoom / 2.5;
            } else { // Perspective mode
                // When a transition is active (e.g., Ortho -> Persp), the background should animate
                // towards the transition's final destination. Otherwise, it tracks the user's target.
                fovDestination = state.transitionFov ? state.transitionFov.to : state.targetFov;
                zoomDestination = state.transitionZoom ? state.transitionZoom.to : state.targetZoom;
            }

            backgroundCameraState.current.fov = lerp(backgroundCameraState.current.fov, fovDestination, LERP_FACTOR);
            backgroundCameraState.current.zoom = lerp(backgroundCameraState.current.zoom, zoomDestination, LERP_FACTOR);

            const baseFovRad = backgroundCameraState.current.fov * (Math.PI / 180);
            const zoomDampingFactor = 0.2;
            const skyboxZoom = 1 + (backgroundCameraState.current.zoom - 1) * zoomDampingFactor;
            const effectiveFovRad = 2 * Math.atan(Math.tan(baseFovRad / 2) / skyboxZoom);
            const effectiveFovDeg = effectiveFovRad * (180 / Math.PI);
            
            if (Math.abs(backgroundCamera.fov - effectiveFovDeg) > 0.01) {
                backgroundCamera.fov = effectiveFovDeg;
                backgroundCamera.updateProjectionMatrix();
            }
            backgroundController.update(state, delta, backgroundCamera, backgroundObjects);

            // --- Select and Update Active Foreground Camera ---
            let activeForegroundCamera: THREE.Camera;

            if (state.renderMode === 'perspective') {
                activeForegroundCamera = foregroundCamera;
                // FOV
                if (Math.abs(foregroundCamera.fov - state.actualFov) > 0.01) {
                    foregroundCamera.fov = state.actualFov;
                    foregroundCamera.updateProjectionMatrix();
                }

                // Zoom (as camera distance)
                const cameraDistance = 4000 / state.actualZoom;
                foregroundCamera.position.z = cameraDistance;

                // Pan (as view offset)
                const { innerWidth, innerHeight } = window;
                if (state.viewOffsetX !== 0 || state.viewOffsetY !== 0) {
                     foregroundCamera.setViewOffset(
                        innerWidth,
                        innerHeight,
                        -state.viewOffsetX, 
                        -state.viewOffsetY, 
                        innerWidth,
                        innerHeight
                    );
                } else if (foregroundCamera.view) {
                    foregroundCamera.clearViewOffset();
                }
            } else { // Orthographic mode
                activeForegroundCamera = foregroundOrthographicCamera;
                const { innerWidth, innerHeight } = window;

                // Corrected zoom to match legacy renderer's `* 0.5` factor.
                const effectiveZoom = state.actualZoom * 0.5;

                // Zoom
                const frustumWidth = innerWidth / effectiveZoom;
                const frustumHeight = innerHeight / effectiveZoom;

                // Pan (by shifting the frustum)
                const worldPanX = state.viewOffsetX / effectiveZoom;
                const worldPanY = -state.viewOffsetY / effectiveZoom; // Invert Y

                foregroundOrthographicCamera.left = (-frustumWidth / 2) - worldPanX;
                foregroundOrthographicCamera.right = (frustumWidth / 2) - worldPanX;
                foregroundOrthographicCamera.top = (frustumHeight / 2) - worldPanY;
                foregroundOrthographicCamera.bottom = (-frustumHeight / 2) - worldPanY;

                foregroundOrthographicCamera.updateProjectionMatrix();
            }
            
            // --- Update Rotation & Tilt (on the pivot for both cameras) ---
            const rotMultiplier = (state.enableLineZDrift && state.lineDriftAxis === 'x') ? 1 : -1;
            const rotationToUse = state.rotation * rotMultiplier;
            const finalRotRad = rotationToUse * (Math.PI / 180);
            const finalTiltRad = state.tilt * (Math.PI / 180);
            
            foregroundCameraPivot.rotation.order = 'ZYX';
            foregroundCameraPivot.rotation.z = finalRotRad;
            foregroundCameraPivot.rotation.x = -finalTiltRad;
            foregroundCameraPivot.rotation.y = 0;


            // --- Update Foreground Controller (lines & particles) ---
            lineController.update(state, activeForegroundCamera, lineRenderers);
            particleController.update(state, activeForegroundCamera, particleRenderer, elapsedTime);
            
            // --- Render ---
            renderer.clear();
            renderer.render(backgroundScene, backgroundCamera);
            renderer.clearDepth();
            renderer.render(foregroundScene, activeForegroundCamera);
        };
        registerFrameCallback('webgl', animate, 10);

        // --- Event Listeners & Cleanup ---
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            backgroundCamera.aspect = width / height;
            backgroundCamera.updateProjectionMatrix();

            foregroundCamera.aspect = width / height;
            foregroundCamera.updateProjectionMatrix();
            
            foregroundOrthographicCamera.left = width / -2;
            foregroundOrthographicCamera.right = width / 2;
            foregroundOrthographicCamera.top = height / 2;
            foregroundOrthographicCamera.bottom = height / -2;
            foregroundOrthographicCamera.updateProjectionMatrix();
            
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            unregisterFrameCallback('webgl');
            
            // Dispose controllers and their objects
            backgroundController.dispose(backgroundObjects);
            lineController.dispose(lineRenderers);
            particleController.dispose(particleRenderer);
            
            renderer.dispose();
            
            // Clear the bridge
            threeJsBridge.renderer = null;
            threeJsBridge.backgroundScene = null;
            threeJsBridge.backgroundCamera = null;
            threeJsBridge.foregroundScene = null;
            threeJsBridge.foregroundCamera = null;
            threeJsBridge.foregroundOrthographicCamera = null;
            threeJsBridge.foregroundCameraPivot = null;
            threeJsBridge.backgroundObjects = null;
            threeJsBridge.lineRenderer = null;
            threeJsBridge.liveLineRenderer = null;
            threeJsBridge.particleRenderer = null;
        };
    }, [canvasRef]);
};