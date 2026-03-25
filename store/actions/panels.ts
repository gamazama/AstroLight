
import React from 'react';
import type { StoreSet, StoreGet } from '../appStore';
import type { ColorPickerInfo, VisualsState } from '../../types';
import { interactionState } from '../interactionState';

export const createPanelActions = (set: StoreSet, get: StoreGet) => ({
    openColorPicker: (target: ColorPickerInfo['target'], e: React.MouseEvent, initialColor: string) => {
        e.stopPropagation();
        interactionState.colorPicker.initialColor = initialColor;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const { top, right, bottom, left, width, height } = rect;
        const sourceBounds = { top, right, bottom, left, width, height };
        set({ colorPicker: { target, x: e.pageX, y: e.pageY, initialColor, sourceBounds } });
    },
    updateColor: (color: string) => {
        const s = get();
        if (s.colorPicker === null) return;
        const { target } = s.colorPicker;

        if (target.type === 'soundNodeDisplay') {
            const { selectedNodeIds } = s.soundCreator;
            const { graph } = s;
            if (selectedNodeIds.length > 1 && selectedNodeIds.includes(target.nodeId)) {
                // Multi-selection: apply color to all selected nodes
                selectedNodeIds.forEach(id => {
                    const node = graph.nodes.find(n => n.id === id);
                    if (node) { // Ensure node exists in the current selection
                        get().actions.updateNodeParam(id, 'displayColor', color);
                    }
                });
            } else {
                // Single selection
                get().actions.updateNodeParam(target.nodeId, 'displayColor', color);
            }
        } else if (target.type === 'connection') {
            set(state => ({
                connections: state.connections.map((c, i) => i === target.index ? { ...c, color } : c)
            }));
        } else if (target.type === 'background') {
            set({ [target.key]: color });
        } else if (target.type === 'brush') {
            set({ brushColor: color });
        } else if (target.type === 'gradientStop') {
            get().actions.updateGradientStopColor(target.stopId, color);
        }
    },
    closeColorPicker: (revert: boolean) => {
        const s = get();
        const initialColor = interactionState.colorPicker.initialColor;

        if (revert) {
            if (s.colorPicker === null) {
                set({ colorPicker: null });
                return;
            }
            const { target } = s.colorPicker;

            if (target.type === 'soundNodeDisplay') {
                const { selectedNodeIds } = s.soundCreator;
                 if (selectedNodeIds.length > 1 && selectedNodeIds.includes(target.nodeId)) {
                    selectedNodeIds.forEach(id => get().actions.updateNodeParam(id, 'displayColor', initialColor));
                } else {
                    get().actions.updateNodeParam(target.nodeId, 'displayColor', initialColor);
                }
            } else if (target.type === 'connection') {
                set(state => ({
                    connections: state.connections.map((c, i) => i === target.index ? { ...c, color: initialColor } : c)
                }));
            } else if (target.type === 'background') {
                set({ [target.key]: initialColor });
            } else if (target.type === 'brush') {
                set({ brushColor: initialColor });
            } else if (target.type === 'gradientStop') {
                get().actions.updateGradientStopColor(target.stopId, initialColor);
            }
        } else {
            let finalColor;
            if (s.colorPicker) {
                const { target } = s.colorPicker;
                if (target.type === 'connection') {
                    finalColor = s.connections[target.index]?.color;
                } else if (target.type === 'background') {
                    finalColor = s[target.key as keyof VisualsState];
                } else if (target.type === 'brush') {
                    finalColor = s.brushColor;
                } else if (target.type === 'soundNodeDisplay') {
                    finalColor = s.graph.nodes.find(n => n.id === target.nodeId)?.params.displayColor;
                } else if (target.type === 'gradientStop') {
                    finalColor = s.lineGradient.find(stop => stop.id === target.stopId)?.color;
                }
            }
            
            if(initialColor && finalColor && initialColor !== finalColor){
                get().actions.adjustParameter({});
            }
        }
        set({ colorPicker: null });
    },
    openStartDatePicker: () => set({ isStartDatePickerOpen: true }),
    closeStartDatePicker: () => set({ isStartDatePickerOpen: false }),
    openEndDatePicker: () => set({ isEndDatePickerOpen: true }),
    closeEndDatePicker: () => set({ isEndDatePickerOpen: false }),
    addPlanetEditorPanel: (planetId: number, position?: { x: number; y: number }) => {
        const s = get();
        if (s.planetEditorPanels.some(p => p.planetId === planetId)) {
            s.actions.exitPlanetModificationMode();
            return;
        }
        
        const defaultPosition = position || { x: Math.random() * (window.innerWidth - 300), y: 60 + Math.random() * (window.innerHeight - 400) };

        set({
            planetEditorPanels: [...s.planetEditorPanels, { planetId, position: defaultPosition }],
        });
        s.actions.exitPlanetModificationMode();
    },
    removePlanetEditorPanel: (planetId: number) => {
        set(state => ({
            planetEditorPanels: state.planetEditorPanels.filter(p => p.planetId !== planetId),
        }));
    },
    updatePlanetEditorPanelPosition: (planetId: number, position: { x: number; y: number }) => {
        set(state => ({
            planetEditorPanels: state.planetEditorPanels.map(p => p.planetId === planetId ? { ...p, position } : p),
        }));
    },
});