import type { StoreSet, StoreGet } from '../../store/appStore';
import { createGraphActions } from './graphActions';
import { createConnectionActions } from './connectionActions';
import { createInstrumentActions } from './instrumentActions';
import { createWorkspaceActions } from './workspaceActions';

export const createSoundActions = (set: StoreSet, get: StoreGet) => ({
    ...createGraphActions(set, get),
    ...createConnectionActions(set, get),
    ...createInstrumentActions(set, get),
    ...createWorkspaceActions(set, get),
});