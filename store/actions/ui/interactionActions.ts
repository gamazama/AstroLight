import type { StoreSet, StoreGet } from '../../appStore';
import type { ConnectionSuccessAnimation } from '../../../types';

export const createInteractionActions = (set: StoreSet, get: StoreGet) => ({
    setHoveredPlanetId: (id: number | null) => {
        const now = performance.now();
        const s = get();
        set({
            hoveredPlanetId: id,
            hoveredPlanetAnimation: {
                growing: id !== null ? { startTime: now, planetId: id } : undefined,
                shrinking: s.hoveredPlanetId !== null ? { startTime: now, planetId: s.hoveredPlanetId } : undefined,
            }
        });
    },
    startConnectionSuccessAnimation: (animInfo: Omit<ConnectionSuccessAnimation, 'startTime'>) => {
        set({ connectionSuccessAnimation: { ...animInfo, startTime: performance.now() } });
    },
    startPlanetConnection: (fromNodeId: number, fromNodeColor: string, startX: number, startY: number, mode: 'drag' | 'click') => {
        set({ planetConnectionDragInfo: { fromNodeId, fromNodeColor, startX, startY, currentX: startX, currentY: startY, mode } });
    },
    updatePlanetConnection: (position: {x: number, y: number}) => {
        set(state => state.planetConnectionDragInfo ? ({
            planetConnectionDragInfo: {
                ...state.planetConnectionDragInfo,
                currentX: position.x,
                currentY: position.y,
            }
        }) : {});
    },
    promotePlanetConnectionToClickMode: () => {
        set(state => {
            if (state.planetConnectionDragInfo && state.planetConnectionDragInfo.mode === 'drag') {
                return { planetConnectionDragInfo: { ...state.planetConnectionDragInfo, mode: 'click' } };
            }
            return {};
        });
    },
    clearPlanetConnection: () => {
        set({ planetConnectionDragInfo: null });
    },
    enterPlanetModificationMode: () => set({ isPlanetModificationMode: true }),
    exitPlanetModificationMode: () => set({ isPlanetModificationMode: false }),
    clearShareSnapshotEffect: () => set({ shareSnapshotEffect: null }),
});
