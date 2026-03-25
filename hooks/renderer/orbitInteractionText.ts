
import React from 'react';
import type { AppState } from '../../types';

export type TextState = {
    mode: 'idle' | 'hover-planet' | 'start-disintegrate' | 'typing-arrow' | 'connecting-idle' | 'connecting-hover-typing' | 'connecting-hover-idle';
    startTime: number;
    fromPlanet: string;
    toPlanet: string;
    displayText: string;
};

/**
 * Calculates the instructional text to display near the cursor based on the user's interaction state
 * (e.g., "Connect Mars to...", "Mars -> Venus").
 */
export const calculateInteractionText = (state: AppState, textStateRef: React.MutableRefObject<TextState>): string => {
    const textState = textStateRef.current;
    const now = performance.now();
    let newMode = textState.mode;
    let needsUpdate = false;

    const connectionSourceNodeId = state.canvasConnectingFromNodeId ?? state.planetConnectionDragInfo?.fromNodeId ?? null;
    const fromNode = connectionSourceNodeId ? state.planetNodes.find(n => n.id === connectionSourceNodeId) : null;
    const hoverState = state.canvasHoverState;
    const hoveredNodeForText = hoverState ? state.planetNodes.find(n => n.id === hoverState.planetId) : null;

    if (fromNode) { 
        if (textState.mode === 'hover-planet' || textState.mode === 'idle') {
            newMode = 'start-disintegrate';
            needsUpdate = true;
        } else if (hoveredNodeForText && hoveredNodeForText.id !== fromNode.id) {
            if (textState.toPlanet !== hoveredNodeForText.name || (textState.mode !== 'connecting-hover-idle' && textState.mode !== 'connecting-hover-typing')) {
                newMode = 'connecting-hover-typing';
                needsUpdate = true;
            }
        } else {
            if (textState.mode === 'connecting-hover-idle' || textState.mode === 'connecting-hover-typing') {
                newMode = 'connecting-idle';
                needsUpdate = true;
            }
        }
    } else {
        if (hoveredNodeForText && !state.planetConnectionDragInfo && !state.isPlanetModificationMode) {
            if (textState.mode === 'idle' || textState.fromPlanet !== hoveredNodeForText.name) {
                newMode = 'hover-planet';
                needsUpdate = true;
            }
        } else {
            if (textState.mode !== 'idle') {
                newMode = 'idle';
                needsUpdate = true;
            }
        }
    }

    if (needsUpdate) {
        textState.mode = newMode;
        textState.startTime = now;
        textState.toPlanet = (newMode === 'connecting-hover-typing' && hoveredNodeForText) ? hoveredNodeForText.name : '';
        if (newMode === 'idle') {
            textState.fromPlanet = '';
            textState.displayText = '';
        } else if (newMode === 'hover-planet' || newMode === 'start-disintegrate') {
            textState.fromPlanet = fromNode?.name || hoveredNodeForText!.name;
        }
    }

    let textToDraw = textState.displayText;

    switch (textState.mode) {
        case 'idle': textToDraw = ''; break;
        case 'hover-planet': textToDraw = `Connect ${textState.fromPlanet} to...`; break;
        case 'start-disintegrate': {
            const prefix = 'Connect '; const suffix = ' to...'; const duration = 150; const elapsed = now - textState.startTime;
            if (elapsed >= duration) { textState.mode = 'typing-arrow'; textState.startTime = now; textToDraw = textState.fromPlanet;
            } else { const p = elapsed/duration; textToDraw = `${prefix.substring(0, Math.floor(prefix.length*(1-p)))}${textState.fromPlanet}${suffix.substring(0, Math.floor(suffix.length*(1-p)))}`; }
            break;
        }
        case 'typing-arrow': {
            const fullSuffix = ' → ...'; const duration = 300; const elapsed = now - textState.startTime;
            if (elapsed >= duration) { textState.mode = 'connecting-idle'; textToDraw = `${textState.fromPlanet}${fullSuffix}`;
            } else { const p = elapsed/duration; textToDraw = `${textState.fromPlanet}${fullSuffix.substring(0, Math.ceil(p * fullSuffix.length))}`; }
            break;
        }
        case 'connecting-idle': textToDraw = `${textState.fromPlanet} → ...`; break;
        case 'connecting-hover-typing': {
            const duration = textState.toPlanet.length * 40; const elapsed = now - textState.startTime;
            if (elapsed >= duration) { textState.mode = 'connecting-hover-idle'; textToDraw = `${textState.fromPlanet} → ${textState.toPlanet}`;
            } else { const p = elapsed/duration; textToDraw = `${textState.fromPlanet} → ${textState.toPlanet.substring(0, Math.ceil(p * textState.toPlanet.length))}`; }
            break;
        }
        case 'connecting-hover-idle': textToDraw = `${textState.fromPlanet} → ${textState.toPlanet}`; break;
    }
    
    textState.displayText = textToDraw;

    if (state.isPlanetModificationMode) {
        return 'Select an orbit to modify...';
    }

    return textToDraw;
};
