import type { StoreSet, StoreGet } from '../../appStore';

export const createBeginnerActions = (set: StoreSet, get: StoreGet) => ({
    toggleBeginnerMode: () => {
        set(state => ({
            beginnerMode: { ...state.beginnerMode, isActive: !state.beginnerMode.isActive }
        }));
        // Notify user
        if (get().beginnerMode.isActive) {
            get().actions.showNotification("Hints Enabled");
        } else {
            get().actions.showNotification("Hints Disabled");
        }
    },
    markFeatureUsed: (featureId: string) => {
        set(state => {
            if (state.beginnerMode.featureUsage[featureId]) return {};
            return {
                beginnerMode: {
                    ...state.beginnerMode,
                    featureUsage: { ...state.beginnerMode.featureUsage, [featureId]: true }
                }
            };
        });
    },
    incrementInteractionCount: (featureId: string) => {
        set(state => ({
            beginnerMode: {
                ...state.beginnerMode,
                interactionCounts: {
                    ...state.beginnerMode.interactionCounts,
                    [featureId]: (state.beginnerMode.interactionCounts[featureId] || 0) + 1
                }
            }
        }));
    },
    dismissHint: (hintId: string) => {
        set(state => ({
            beginnerMode: {
                ...state.beginnerMode,
                dismissedHints: [...state.beginnerMode.dismissedHints, hintId],
                currentHintId: null
            }
        }));
    },
    setCurrentHint: (hintId: string | null) => {
        set(state => ({
            beginnerMode: { ...state.beginnerMode, currentHintId: hintId }
        }));
    },
});
