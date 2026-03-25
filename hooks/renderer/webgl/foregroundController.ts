import * as THREE from 'three';
import type { AppState } from '../../../types/index';
import { HistoryLineRenderer } from './renderers/HistoryLineRenderer';
import { LiveLineRenderer } from './renderers/LiveLineRenderer';


// --- Public Interface ---

interface LineRenderers {
    lineRenderer: HistoryLineRenderer;
    liveLineRenderer: LiveLineRenderer;
}

export function init(scene: THREE.Scene, maxLines: number): LineRenderers {
    const lineRenderer = new HistoryLineRenderer(maxLines);
    scene.add(lineRenderer.mesh);
    
    const liveLineRenderer = new LiveLineRenderer(50); // Max 50 live lines, more than enough
    scene.add(liveLineRenderer.mesh);
    
    return { lineRenderer, liveLineRenderer };
}

export function update(state: AppState, camera: THREE.Camera, renderers: LineRenderers) {
    const { lineRenderer, liveLineRenderer } = renderers;
    
    lineRenderer.mesh.visible = state.showLines && !state.debugDisableLines;
    if (lineRenderer.mesh.visible) {
        lineRenderer.update(state.lineHistory, state);
    }

    liveLineRenderer.mesh.visible = state.showLiveConnections && !state.debugDisableLines;
    if (liveLineRenderer.mesh.visible) {
        liveLineRenderer.update(state);
    }
}

export function dispose(renderers: LineRenderers) {
    renderers.lineRenderer.dispose();
    renderers.liveLineRenderer.dispose();
}
