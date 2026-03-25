import type { StoreSet, StoreGet } from '../appStore';
import { createBeginnerActions } from './ui/beginnerActions';
import { createLayerActions } from './ui/layerActions';
import { createPresetActions } from './ui/presetActions';
import { createInteractionActions } from './ui/interactionActions';

export const createUIActions = (set: StoreSet, get: StoreGet) => ({
    showNotification: (message: string, duration: number = 2800) => {
        set({ notification: message });
    },
    clearUIGuidePulse: () => set({ uiGuidePulse: null }),
    
    ...createBeginnerActions(set, get),
    ...createLayerActions(set, get),
    ...createPresetActions(set, get),
    ...createInteractionActions(set, get),
});
