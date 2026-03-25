import type { StoreSet, StoreGet } from '../../appStore';

export const createLayerActions = (set: StoreSet, get: StoreGet) => ({
    toggleLayer: (layer: string) => {
        set(state => ({
            expandedLayers: { ...state.expandedLayers, [layer]: !state.expandedLayers[layer] }
        }));
        get().actions.markFeatureUsed('objects_panel_interaction');
        
        // Track Sparkles usage specifically if expanded
        if (layer === 'sparkles') {
            get().actions.markFeatureUsed('sparkles_tweaked');
        }
    },
    expandLayerExclusively: (layerToExpand: string, forceOpen: boolean = false) => {
        get().actions.markFeatureUsed('objects_panel_interaction');
        set(state => {
            const currentExpanded = state.expandedLayers;
            const isCurrentlyExpanded = currentExpanded[layerToExpand];

            // If forceOpen is false (default behavior), toggle it closed if already open.
            // If forceOpen is true, we skip this check to ensure it stays/becomes open.
            if (isCurrentlyExpanded && !forceOpen) {
                return { expandedLayers: { ...currentExpanded, [layerToExpand]: false } };
            }
            
            const newExpandedState: Record<string, boolean> = {};
            Object.keys(currentExpanded).forEach(key => {
                // Preserve the state of all sub-layers
                if (['stars', 'nebula', 'skybox', 'bgColor', 'liveLines', 'sparkles', 'planets', 'labels', 'advanced'].includes(key)) {
                    newExpandedState[key] = currentExpanded[key];
                } else {
                    newExpandedState[key] = false;
                }
            });
            
            newExpandedState[layerToExpand] = true;
            return { expandedLayers: newExpandedState };
        });
    },
    setSelectedConnectionId: (id: number | null) => set({ selectedConnectionId: id }),
});
