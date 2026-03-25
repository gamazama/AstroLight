import type { StoreSet, StoreGet } from '../appStore';

export const createModalActions = (set: StoreSet, get: StoreGet) => ({
    closeConfirmationDialog: () => {
        set({ confirmationDialog: null });
    },
    openJplDebugModal: (planetName: string) => {
        const pathInfo = get().highPrecisionPaths[planetName];
        if (pathInfo && pathInfo.rawData) {
            set({ jplDebugData: { planetName, rawData: pathInfo.rawData } });
        } else {
            get().actions.showNotification(`**Error**: Raw data for ${planetName} not found.`);
        }
    },
    closeJplDebugModal: () => {
        set({ jplDebugData: null });
    },
});
