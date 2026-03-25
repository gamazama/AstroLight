
import type { AppState, CelestialBodyData } from '../../types';
import { drawScene, drawOrbits } from '../../hooks/renderer/drawing';
import { calculateZOffsets } from '../zOffsetCalculations';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { APP_URL, APP_VERSION } from '../../constants';
import { threeJsBridge } from '../../hooks/renderer/threeJsBridge';
import * as THREE from 'three';
import * as backgroundController from '../../hooks/renderer/webgl/backgroundController';
import * as lineController from '../../hooks/renderer/webgl/foregroundController';
import * as particleController from '../../hooks/renderer/webgl/particleController';

const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const renderHighResolutionImage = (state: AppState, options: { showWatermark: boolean, resolution: number }): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const targetResolution = options.resolution;
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = targetResolution;
        offscreenCanvas.height = targetResolution;
        const ctx = offscreenCanvas.getContext('2d');

        if (!ctx) {
            return reject(new Error("Could not create rendering context for export."));
        }

        const { renderer, backgroundScene, backgroundCamera, foregroundScene, foregroundCamera, foregroundOrthographicCamera, foregroundCameraPivot, backgroundObjects, lineRenderer, liveLineRenderer, particleRenderer } = threeJsBridge;

        const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
        if (!mainCanvas) {
            return reject(new Error("Main canvas not found for scaling."));
        }

        const scaleFactorY = targetResolution / mainCanvas.height;
        const scaleFactorX = targetResolution / mainCanvas.width;

        const renderState: AppState = {
            ...state,
            viewOffsetX: state.viewOffsetX * scaleFactorX,
            viewOffsetY: state.viewOffsetY * scaleFactorY,
            lineWidth: state.lineWidth * Math.pow(scaleFactorY, 2),
            liveLineWidth: state.liveLineWidth * Math.pow(scaleFactorY, 2),
            starSize: state.starSize * scaleFactorY,
            nebulaParticleSize: state.nebulaParticleSize * scaleFactorY,
            nebulaOpacity: state.nebulaOpacity,
            planetSizeMultiplier: state.planetSizeMultiplier,
            labelFontSize: state.labelFontSize * scaleFactorY,
            // In perspective mode, we must scale the individual size of each particle because
            // gl_PointSize is pixels, and we are increasing the pixel count.
            // In orthographic mode, the zoom scaling logic (zoom * scale) handles this naturally.
            particles: state.renderMode === 'perspective'
                ? state.particles.map(p => ({ ...p, size: p.size * scaleFactorY }))
                : state.particles,
            targetZoom: state.renderMode === 'orthographic' ? state.targetZoom * scaleFactorY : state.targetZoom,
            actualZoom: state.renderMode === 'orthographic' ? state.actualZoom * scaleFactorY : state.actualZoom
        };

        if (renderer && backgroundScene && backgroundCamera && foregroundScene && foregroundCamera && foregroundOrthographicCamera && foregroundCameraPivot && backgroundObjects && lineRenderer && liveLineRenderer && particleRenderer) {
            const originalSize = new THREE.Vector2();
            renderer.getSize(originalSize);

            renderer.setSize(targetResolution, targetResolution, false);
            const originalAutoClear = renderer.autoClear;
            renderer.autoClear = false;

            backgroundCamera.aspect = 1;
            const baseFovRad_hr = renderState.actualFov * (Math.PI / 180);
            const zoomDampingFactor = 0.2;

            // Apply orthographic scaling fix to match useWebGLRenderer
            let effectiveZoom = renderState.actualZoom;
            if (renderState.renderMode === 'orthographic') {
                effectiveZoom = effectiveZoom / 2.5;
            }

            const skyboxZoom_hr = 1 + (effectiveZoom - 1) * zoomDampingFactor;
            const effectiveFovRad_hr = 2 * Math.atan(Math.tan(baseFovRad_hr / 2) / skyboxZoom_hr);
            backgroundCamera.fov = effectiveFovRad_hr * (180 / Math.PI);
            backgroundCamera.updateProjectionMatrix();

            let activeForegroundCamera: THREE.Camera;
            if (renderState.renderMode === 'perspective') {
                activeForegroundCamera = foregroundCamera;
                foregroundCamera.aspect = 1;
                foregroundCamera.fov = renderState.actualFov;
                const cameraDistance = 4000 / renderState.actualZoom;
                foregroundCamera.position.z = cameraDistance;
                if (renderState.viewOffsetX !== 0 || renderState.viewOffsetY !== 0) {
                    foregroundCamera.setViewOffset(targetResolution, targetResolution, -renderState.viewOffsetX, -renderState.viewOffsetY, targetResolution, targetResolution);
                } else if (foregroundCamera.view) {
                    foregroundCamera.clearViewOffset();
                }
                foregroundCamera.updateProjectionMatrix();
            } else {
                activeForegroundCamera = foregroundOrthographicCamera;
                const effectiveZoom = renderState.actualZoom * 0.5;
                const frustumWidth = targetResolution / effectiveZoom;
                const frustumHeight = targetResolution / effectiveZoom;
                const worldPanX = renderState.viewOffsetX / effectiveZoom;
                const worldPanY = -renderState.viewOffsetY / effectiveZoom;
                foregroundOrthographicCamera.left = (-frustumWidth / 2) - worldPanX;
                foregroundOrthographicCamera.right = (frustumWidth / 2) - worldPanX;
                foregroundOrthographicCamera.top = (frustumHeight / 2) - worldPanY;
                foregroundOrthographicCamera.bottom = (-frustumHeight / 2) - worldPanY;
                foregroundOrthographicCamera.updateProjectionMatrix();
            }

            const rotMultiplier = (renderState.enableLineZDrift && renderState.lineDriftAxis === 'x') ? 1 : -1;
            const rotationToUse = renderState.rotation * rotMultiplier;
            foregroundCameraPivot.rotation.order = 'ZYX';
            foregroundCameraPivot.rotation.z = rotationToUse * (Math.PI / 180);
            foregroundCameraPivot.rotation.x = -renderState.tilt * (Math.PI / 180);
            foregroundCameraPivot.rotation.y = 0;

            backgroundController.update(renderState, 0, backgroundCamera, backgroundObjects);
            lineController.update(renderState, activeForegroundCamera, { lineRenderer, liveLineRenderer });
            particleController.update(renderState, activeForegroundCamera, particleRenderer, state.time * 1000);

            renderer.clear();
            renderer.render(backgroundScene, backgroundCamera);
            renderer.clearDepth();
            renderer.render(foregroundScene, activeForegroundCamera);

            ctx.drawImage(renderer.domElement, 0, 0, targetResolution, targetResolution);

            renderer.setSize(originalSize.width, originalSize.height, false);
            renderer.autoClear = originalAutoClear;

            const originalAspect = originalSize.width / originalSize.height;
            backgroundCamera.aspect = originalAspect;
            if (backgroundCamera.view) backgroundCamera.clearViewOffset();
            backgroundCamera.updateProjectionMatrix();
            foregroundCamera.aspect = originalAspect;
            if (foregroundCamera.view) foregroundCamera.clearViewOffset();
            foregroundCamera.updateProjectionMatrix();
            foregroundOrthographicCamera.left = originalSize.width / -2;
            foregroundOrthographicCamera.right = originalSize.width / 2;
            foregroundOrthographicCamera.top = originalSize.height / 2;
            foregroundOrthographicCamera.bottom = originalSize.height / -2;
            foregroundOrthographicCamera.updateProjectionMatrix();
        } else {
            ctx.fillStyle = state.backgroundColor2;
            ctx.fillRect(0, 0, targetResolution, targetResolution);
        }

        const getCelestialBody = (name: string): CelestialBodyData => ({ ...STAR_SYSTEMS[renderState.currentSystem]?.celestialBodies.find(p => p.name === name)!, ...renderState.planetDataOverrides[name] });
        const zOffsets = Object.fromEntries(calculateZOffsets(renderState, getCelestialBody));

        drawScene(ctx, offscreenCanvas, renderState, getCelestialBody, zOffsets, false);

        ctx.lineWidth = 1.5 * scaleFactorY;
        drawOrbits(ctx, offscreenCanvas, renderState, getCelestialBody, zOffsets);

        // --- Watermark Generation ---
        if (options.showWatermark) {
            const margin = 40 * (targetResolution / 4500);
            const fontSize = 40 * (targetResolution / 4500);
            const lineHeight = fontSize * 1.4;

            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textBaseline = 'bottom';

            // Gather Stats
            const system = renderState.currentSystem;

            let realism = "Simple Physics";
            if (renderState.useRealisticPhysics) {
                if (renderState.useJplHorizons) {
                    realism = "NASA JPL Data";
                } else {
                    realism = "Keplerian Physics";
                }
            } else {
                 if (renderState.logarithmicOrbits) {
                     realism = "Simple Physics (Log)";
                 }
            }

            const simEndDate = new Date(renderState.startDate.getTime() + renderState.time * 24 * 60 * 60 * 1000);
            const dateRange = `${formatDate(renderState.startDate)} - ${formatDate(simEndDate)}`;
            const years = (renderState.time / 365.25).toFixed(1);
            const userDate = new Date().toLocaleDateString();

            const connectionsList = renderState.connections.map(c => {
                const from = renderState.planetNodes.find(p => p.id === c.from)?.name;
                const to = renderState.planetNodes.find(p => p.id === c.to)?.name;
                return `${from}-${to}`;
            }).join(', ');

            let bottomY = offscreenCanvas.height - margin;

            // 1. Bottom Right: URL & Metadata
            ctx.textAlign = 'right';
            ctx.fillText(`${APP_URL} • v${APP_VERSION} • ${userDate}`, offscreenCanvas.width - margin, bottomY);

            // 2. Bottom Left: Main Stats
            ctx.textAlign = 'left';
            ctx.fillText(`${system} • ${realism} • ${dateRange} (${years} yrs)`, margin, bottomY);

            // 3. Above Bottom Left: Connections (if any)
            if (connectionsList) {
                 const maxWidth = offscreenCanvas.width - (margin * 2);
                 let text = `Connections: ${connectionsList}`;
                 const metrics = ctx.measureText(text);

                 if (metrics.width > maxWidth) {
                     while (ctx.measureText(text + "...").width > maxWidth && text.length > 0) {
                         text = text.slice(0, -1);
                     }
                     text += "...";
                 }
                 ctx.fillText(text, margin, bottomY - lineHeight);
            }
        }

        offscreenCanvas.toBlob((blob) => {
            if (!blob) {
                return reject(new Error("Failed to create blob from canvas."));
            }
            resolve(blob);
        }, 'image/png');
    });
};
