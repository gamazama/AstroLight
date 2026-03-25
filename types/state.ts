import type { SimulationState } from './simulation';
import type { VisualsState } from './visuals';
import type { UIState } from './uiState';
import type { SoundState } from '../AstroSound/types';

// Represents only the undoable parts of the simulation state.
// Excludes transient data like the current time, generated lines, and particles.
export type UndoableSimulationState = Omit<SimulationState, 'time' | 'lineHistory' | 'particles'>;

// Represents only the undoable parts of the visuals state.
// Excludes direct camera controls and transient, smoothed values to prevent undo/redo from changing the user's view.
export type UndoableVisualsState = Omit<VisualsState, 'actualZoom' | 'actualFov' | 'actualZOffsets' | 'tilt' | 'rotation' | 'viewOffsetX' | 'viewOffsetY'>;

// Represents the state that can be undone/redone.
// Excludes transient UI state and the sound engine state.
export type TemporalState = {
    simulationState: UndoableSimulationState;
    visualsState: UndoableVisualsState;
    documentName: UIState['documentName'];
};

export interface HistoryState {
    past: TemporalState[];
    present: TemporalState;
    future: TemporalState[];
    isTimeTraveling: boolean; // Flag to prevent feedback loops when undoing/redoing
}


// The full AppState now includes the background state for components that need the full picture.
export type AppState = SimulationState & VisualsState & UIState & SoundState & {
    history: HistoryState;
};