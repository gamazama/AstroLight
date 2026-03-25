import type { StoreSet, StoreGet, Actions } from '../appStore';
import { createConnectionActions } from './actions/connections';
import { createConfigActions } from './actions/config';
import { createCoreActions } from './actions/core';
import { createSoundActions } from '../AstroSound/soundStore';
import { createTutorialActions } from './actions/tutorial';
import { createUIActions } from './actions/ui';
import { createVisualsAndPhysicsActions } from './actions/visuals';
import { createExportActions } from './actions/export';
import { createModalActions } from './actions/modals';
import { createPanelActions } from './actions/panels';
import { createJplActions } from './actions/jpl';

export const createAllActions = (set: StoreSet, get: StoreGet): Actions => {
    return {
        updateSimulation: (data) => set(data),
        updateVisuals: (data) => set(data),
        updateUI: (data) => set(data),
        updateSound: (data) => set(data),
        updateFrameData: (data) => set(data),

        ...createCoreActions(set, get),
        ...createVisualsAndPhysicsActions(set, get),
        ...createConnectionActions(set, get),
        ...createUIActions(set, get),
        ...createConfigActions(set, get),
        ...createTutorialActions(set, get),
        ...createSoundActions(set, get),
        ...createExportActions(set, get),
        ...createModalActions(set, get),
        ...createPanelActions(set, get),
        ...createJplActions(set, get),
    };
};