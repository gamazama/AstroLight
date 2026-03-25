import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { createWithEqualityFn } from 'zustand/traditional';
import type { AppState, SimulationState, VisualsState, UIState, SoundState, CoreVisualsState, BackgroundState, CoreActions, HistoryState } from '../types';
import { initialSimulationState, initialBackgroundState, initialVisualsState, initialUIState, initialHistoryState } from '../initialState';
import { initialSoundState } from '../AstroSound/soundStore';
import { createAllActions } from './actions';

export type Actions = CoreActions;

export type AppStoreState = AppState & {
    actions: Actions;
};

export type StoreSet = (partial: Partial<AppStoreState> | ((state: AppStoreState) => Partial<AppStoreState>)) => void;
export type StoreGet = () => AppStoreState;

export const useAppStore = createWithEqualityFn<AppStoreState>((set, get) => ({
    ...initialSimulationState,
    ...initialBackgroundState,
    ...initialVisualsState,
    ...initialUIState,
    ...initialSoundState,
    history: initialHistoryState,
    
    actions: createAllActions(set as StoreSet, get as StoreGet),
}), Object.is);