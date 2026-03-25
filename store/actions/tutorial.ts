
import type { StoreSet, StoreGet } from '../appStore';
import type { AppState } from '../../types';
import { interactionState } from '../interactionState';

export const createTutorialActions = (set: StoreSet, get: StoreGet) => {
    
    const endTutorial = () => {
        set({
            connections: [],
            lineHistory: [],
            time: 0,
            timeSpeed: 1,
            rotation: 0,
            tilt: interactionState.tutorial.preTutorialState?.tilt ?? 0,
            targetZoom: interactionState.tutorial.preTutorialState?.targetZoom ?? 1,
            tutorialStep: null,
            tutorialConnectionId: null,
            isBottomControlsCollapsed: true,
            openTopMenuDropdown: null,
            tutorialForcedHoverPlanetId: null,
            showIntroScreen: true,
        });
        interactionState.tutorial.preTutorialState = null;
        set({ notification: '**Scene** has been reset.' });
    };
    
    return {
        startTutorial: () => {
            // IMPORTANT: Skip the transition animation to ensure state is reset synchronously
            // before we apply the tutorial settings. This prevents a race condition where
            // the reset finishes AFTER we set tutorialStep=0, clearing it.
            get().actions.handleStartSandbox({ skipTransition: true }); 
            
            // Store the initial camera state so we can restore it when the tutorial ends.
            interactionState.tutorial.preTutorialState = { tilt: get().tilt, targetZoom: get().targetZoom };
            
            set({
                tutorialStep: 0,
                targetZoom: 2, // Override the default zoom for the tutorial's start
                isFullscreen: false, // Ensure tutorial doesn't start in fullscreen
            });
        },
        endTutorial,
        nextTutorialStep: () => {
            const s = get();
            if (s.tutorialStep === null || s.tutorialStep >= 7) {
                endTutorial();
                return;
            }
            const nextStep = s.tutorialStep + 1;
            const updates: Partial<AppState> = { tutorialStep: nextStep };

            // Step 0 -> 1 (Welcome -> Discover Presets)
            // Action: Open the presets dropdown menu to guide the user.
            if (s.tutorialStep === 0 && nextStep === 1) {
                updates.openTopMenuDropdown = 'presets';
            }

            // Step 1 -> 2 (Discover Presets -> Exploring in 3D)
            // Action: Load the full "Venus Pentagram" preset as promised in the tutorial text.
            if (s.tutorialStep === 1 && nextStep === 2) {
                get().actions.loadPreset('Venus Pentagram');
            }

            // Step 4 -> 5 (Control Center -> Create Your Own)
            // Action: Automatically slow down the simulation speed and highlight Venus.
            if (s.tutorialStep === 4 && nextStep === 5) {
                updates.timeSpeed = 2;
                const venusNode = get().planetNodes.find(n => n.name === 'Venus');
                if (venusNode) {
                    updates.tutorialForcedHoverPlanetId = venusNode.id;
                }
            }
            
            // Step 5 -> 6 (Create Your Own -> Adjusting Connections)
            // Action: Set vibrant default values for the sparkle effect and clear the highlight.
            if (s.tutorialStep === 5 && nextStep === 6) {
                updates.tutorialForcedHoverPlanetId = null;
                updates.particleQuantity = 50;
                updates.particleSpeed = 5;
                updates.particleSize = 3;
            }

            set(updates);
        },
        prevTutorialStep: () => {
            const s = get();
            const currentStep = s.tutorialStep;
            if (currentStep === null || currentStep === 0) {
                return;
            }
            const prevStep = currentStep - 1;

            const updates: Partial<AppState> = { tutorialStep: prevStep };

            // Handle Venus highlight
            if (currentStep === 5) { // Leaving step 5 (going to 4)
                updates.tutorialForcedHoverPlanetId = null;
            } else if (prevStep === 5) { // Entering step 5 (from 6)
                const venusNode = get().planetNodes.find(n => n.name === 'Venus');
                if (venusNode) {
                    updates.tutorialForcedHoverPlanetId = venusNode.id;
                }
            }

            // Handle dropdown menu when moving backward
            if (prevStep === 1) { // We are going from step 2 to 1
                updates.openTopMenuDropdown = 'presets';
            } else if (currentStep === 1) { // We are going from step 1 to 0
                updates.openTopMenuDropdown = null;
            }
            
            set(updates);
        },
    };
};
