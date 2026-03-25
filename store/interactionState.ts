
import type { AppState } from '../types';

interface InteractionState {
    /** Keys currently held for scrubbing (s/z/d/v). Blocks camera drag for the full hold duration, including the timer delay. */
    heldScrubKeys: Set<string>;
    scrub: {
        startX: number;
        startY: number;
        startSpeed: number;
        startZOffset: number;
        startDriftSpeed: number;
        startFov: number;
        isAxisLocked: boolean;
    };
    colorPicker: {
        initialColor: string;
    };
    tutorial: {
        preTutorialState: {
            tilt: number;
            targetZoom: number;
        } | null;
    };
    physics: {
        preRealisticState: Partial<AppState> | null;
    };
    gizmo: {
        activeAxis: 'x' | 'y' | 'z' | null;
        hoveredAxis: 'x' | 'y' | 'z' | null;
        dragStartMouse: { x: number, y: number };
        dragStartRotation: { x: number, y: number, z: number };
    };
}

export const interactionState: InteractionState = {
    heldScrubKeys: new Set(),
    scrub: {
        startX: 0,
        startY: 0,
        startSpeed: 0,
        startZOffset: 0,
        startDriftSpeed: 0,
        startFov: 0,
        isAxisLocked: false,
    },
    colorPicker: {
        initialColor: '',
    },
    tutorial: {
        preTutorialState: null,
    },
    physics: {
        preRealisticState: null,
    },
    gizmo: {
        activeAxis: null,
        hoveredAxis: null,
        dragStartMouse: { x: 0, y: 0 },
        dragStartRotation: { x: 0, y: 0, z: 0 },
    }
};
