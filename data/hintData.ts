
import type { Actions, AppState } from '../types';

export type HintType = 'auto' | 'discovery';

export type HintDefinition = {
    id: string;
    type: HintType;
    title: string;
    text: string;
    targetId?: string; // DOM ID to point to
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    trigger: (state: AppState) => boolean;
    completion: (state: AppState) => boolean;
    highlightTarget?: boolean; // Pulse the target UI element
    onEnter?: (actions: Actions) => void; // Side effects when hint appears
    action?: {
        label: string;
        onClick: (actions: Actions) => void;
    };
};

export const HINTS: HintDefinition[] = [
    // =====================================================================================
    // 1. CORE FLOW (AUTO) - The essential first steps
    // =====================================================================================
    
    // 1. BASIC NAVIGATION
    {
        id: 'navigation',
        type: 'auto',
        title: 'Explore the Cosmos',
        text: 'Click & Drag to rotate the view. Scroll to zoom in and out. Double-click to reset.',
        position: 'center', 
        trigger: (state) => !state.beginnerMode.featureUsage['camera_move'] || !state.beginnerMode.featureUsage['camera_zoom'],
        completion: (state) => !!state.beginnerMode.featureUsage['camera_move'] && !!state.beginnerMode.featureUsage['camera_zoom']
    },

    // 2. FIRST CONNECTION
    {
        id: 'first_connection',
        type: 'auto',
        title: 'Start Connecting',
        text: 'Click on one orbit line, then click on another to create a connection.',
        position: 'center',
        // Trigger only after navigation basics are mastered
        trigger: (state) => state.connections.length === 0 && !!state.beginnerMode.featureUsage['camera_move'] && !!state.beginnerMode.featureUsage['camera_zoom'],
        completion: (state) => state.connections.length > 0
    },
    
    // 3. TIME CONTROL
    {
        id: 'time_control',
        type: 'auto',
        title: 'Control Time',
        text: 'The pattern evolves over time. Drag the slider to speed up the simulation.',
        targetId: 'speed-input-box',
        position: 'top',
        highlightTarget: true,
        // Trigger if connections exist and user hasn't touched speed controls yet
        trigger: (state) => state.connections.length > 0 && !state.beginnerMode.featureUsage['speed_slider_ui'] && !state.beginnerMode.featureUsage['speed_scrub_action'],
        completion: (state) => !!state.beginnerMode.featureUsage['speed_slider_ui'] || !!state.beginnerMode.featureUsage['speed_scrub_action']
    },

    // 4. CUSTOMIZATION
    {
        id: 'customize',
        type: 'auto',
        title: 'Customize Your Art',
        text: 'Open the "Astral Objects™" panel to change colors, line width, and physics settings.',
        targetId: 'objects-panel',
        position: 'right',
        highlightTarget: true,
        // Don't show action if panel is already open
        action: {
            label: 'Open Panel',
            onClick: (actions) => actions.updateUI({ isControlPanelCollapsed: false })
        },
        // Trigger when user knows how to control time and has connections, but hasn't opened the panel yet
        trigger: (state) => state.connections.length > 0 && (!!state.beginnerMode.featureUsage['speed_slider_ui'] || !!state.beginnerMode.featureUsage['speed_scrub_action']) && !state.beginnerMode.featureUsage['objects_panel_interaction'],
        completion: (state) => !!state.beginnerMode.featureUsage['objects_panel_interaction']
    },


    // =====================================================================================
    // 2. DISCOVERY HINTS - Prioritized features users should find next
    // =====================================================================================

    // 5. LINE AESTHETICS
    {
        id: 'line_aesthetics_hint',
        type: 'discovery',
        title: 'Refine the Lines',
        text: 'Try adjusting the Line Width to create delicate threads or bold strokes.',
        targetId: 'lines-layer',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('lines', true),
        trigger: (state) => state.connections.length >= 2 && state.showLines && !state.beginnerMode.featureUsage['line_width_tweaked'],
        completion: (state) => !!state.beginnerMode.featureUsage['line_width_tweaked']
    },
    
    // 6. BACKGROUNDS
    {
        id: 'background_hint',
        type: 'discovery',
        title: 'Set the Mood',
        text: 'Change the background nebula and starfield to match your creation.',
        targetId: 'background-layer-header',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('background', true),
        trigger: (state) => state.time > 500 && !state.beginnerMode.featureUsage['background_tweaked'],
        completion: (state) => !!state.beginnerMode.featureUsage['background_tweaked']
    },

    // 7. RENDER MODE
    {
        id: 'render_mode_discovery',
        type: 'discovery',
        title: 'Change Perspective',
        text: 'Switch between 2D (Orthographic) and 3D (Perspective) views to see your pattern from a new angle.',
        targetId: 'camera-layer',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('camera', true),
        action: {
            label: 'Switch View',
            onClick: (actions) => actions.toggleRenderMode()
        },
        trigger: (state) => state.connections.length >= 1 && !state.beginnerMode.featureUsage['render_mode_toggled'],
        completion: (state) => !!state.beginnerMode.featureUsage['render_mode_toggled']
    },
    
    // 8. CONNECTION DETAILS
    {
        id: 'harmony_persistence_hint',
        type: 'auto',
        title: 'Harmony & Persistence',
        text: 'Adjust "Persistence" to control how long lines fade. Click the Wand ✨ to snap to a perfect harmonic ratio.',
        targetId: 'connection-persistence-input',
        position: 'right',
        highlightTarget: true,
        trigger: (state) => state.selectedConnectionId !== null && !state.beginnerMode.featureUsage['persistence_tweaked'],
        completion: (state) => !!state.beginnerMode.featureUsage['persistence_tweaked']
    },

    // 9. DRIFT
    {
        id: 'drift_discovery',
        type: 'discovery',
        title: 'Motion & Parallax',
        text: 'Enable "Drift Mode" to make the universe flow past you, creating a beautiful 3D parallax effect.',
        targetId: 'camera-layer',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('camera', true),
        action: {
            label: 'Enable Drift',
            onClick: (actions) => actions.adjustParameter({ enableLineZDrift: true, lineZDriftSpeed: 20 })
        },
        trigger: (state) => state.connections.length >= 1 && !state.enableLineZDrift && !state.beginnerMode.featureUsage['drift_enabled'],
        completion: (state) => state.enableLineZDrift
    },
    
    // 9a. PIVOT / GIZMO (New)
    {
        id: 'pivot_discovery',
        type: 'discovery',
        title: 'Rotate The World',
        text: 'Hold "Alt" and Click on a line to set a World Pivot point. You can then rotate the entire scene around this specific point.',
        position: 'center',
        trigger: (state) => state.connections.length >= 2 && state.renderMode === 'perspective' && !state.pivotPoint,
        completion: (state) => !!state.pivotPoint
    },

    // 10. SPARKLES
    {
        id: 'sparkles_discovery',
        type: 'discovery',
        title: 'Particle Effects',
        text: 'Customize the "Sparkles" to create stardust trails or glowing pulses.',
        targetId: 'sparkles-header', // Targets the clickable header in Lines Layer
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => {
            actions.expandLayerExclusively('lines', true);
            // Optionally toggle sparkles sub-layer open, but user has to click header anyway
        },
        trigger: (state) => state.connections.length >= 2 && state.showLines && !state.beginnerMode.featureUsage['sparkles_tweaked'],
        completion: (state) => !!state.beginnerMode.featureUsage['sparkles_tweaked']
    },
    // =====================================================================================
    // 3. INTERACTION TOOLS - Making things easier
    // =====================================================================================

    // 11. PLANETS MENU
    {
        id: 'planets_menu_hint',
        type: 'discovery',
        title: 'Connect Distant Worlds',
        text: 'Hard to click an orbit? Use the "Available Planets" menu to drag connections easily.',
        targetId: 'planets-dropdown-trigger',
        position: 'bottom',
        highlightTarget: true,
        action: {
            label: 'Open Menu',
            onClick: (actions) => actions.updateUI({ openTopMenuDropdown: 'planets' })
        },
        trigger: (state) => state.connections.length >= 1 && !state.beginnerMode.featureUsage['planets_menu_opened'],
        completion: (state) => !!state.beginnerMode.featureUsage['planets_menu_opened']
    },

    // 12. CHANGE SYSTEM
    {
        id: 'change_system_hint',
        type: 'discovery',
        title: 'New Worlds',
        text: 'Switch between real solar systems, binary stars, and fictional constructs.',
        targetId: 'systems-dropdown-btn',
        position: 'bottom',
        highlightTarget: true,
        action: {
            label: 'Browse Systems',
            onClick: (actions) => actions.updateUI({ openTopMenuDropdown: 'systems' })
        },
        trigger: (state) => state.connections.length > 0 && state.time > 300 && !state.hasSystemBeenChanged,
        completion: (state) => state.hasSystemBeenChanged
    },

    // 13. PRESETS (Idle fallback)
    {
        id: 'presets_idle',
        type: 'auto',
        title: 'Need Inspiration?',
        text: 'Not sure where to start? Load a curated pattern to see what is possible.',
        targetId: 'top-menu-presets-button',
        position: 'bottom',
        highlightTarget: true,
        action: {
            label: 'Open Presets',
            onClick: (actions) => actions.updateUI({ openTopMenuDropdown: 'presets' })
        },
        // Trigger if user has looked around but hasn't made connections for a while
        trigger: (state) => state.connections.length === 0 && !!state.beginnerMode.featureUsage['camera_move'] && !state.beginnerMode.featureUsage['presets_opened'],
        completion: (state) => !!state.openTopMenuDropdown
    },
    
    // 14. FINE TUNE SLIDERS
    {
        id: 'fine_tune_hint',
        type: 'discovery',
        title: 'Precision Control',
        text: 'Did you know? You can click and drag on any number box to fine-tune the value.',
        targetId: 'objects-panel', 
        position: 'right',
        trigger: (state) => !!state.beginnerMode.featureUsage['objects_panel_interaction'] && !state.beginnerMode.featureUsage['fine_tune_discovered'] && !state.isControlPanelCollapsed && Object.values(state.expandedLayers).some(Boolean),
        completion: (state) => !!state.beginnerMode.featureUsage['fine_tune_discovered']
    },


    // =====================================================================================
    // 4. ADVANCED & CREATIVE - Deeper features
    // =====================================================================================

    // 15. PHYSICS
    {
        id: 'physics_discovery',
        type: 'discovery',
        title: 'Bend Reality',
        text: 'You are currently using real-world physics. Toggle "Realistic Physics" OFF to create perfect, impossible geometric symmetries.',
        targetId: 'physics-settings',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('realism', true),
        action: {
            label: 'Toggle Physics',
            onClick: (actions) => actions.toggleRealisticPhysics(false)
        },
        trigger: (state) => state.connections.length >= 2 && state.useRealisticPhysics,
        completion: (state) => !!state.beginnerMode.featureUsage['physics_toggled']
    },

    // 16. NAME CREATION (New)
    {
        id: 'name_creation',
        type: 'discovery',
        title: 'Name Your Creation',
        text: 'Give your masterpiece a name! Click the text at the top to rename it.',
        targetId: 'document-name-input',
        position: 'bottom',
        highlightTarget: true,
        trigger: (state) => state.connections.length > 0 && state.documentName === 'Untitled Creation',
        completion: (state) => state.documentName !== 'Untitled Creation'
    },


    
    // 17. BRUSH MODE
    {
        id: 'brush_mode_discovery',
        type: 'discovery',
        title: 'Paint the Stars',
        text: 'Enter Brush Mode to manually paint colors onto your orbital lines using your mouse.',
        targetId: 'brush-mode-btn',
        position: 'bottom',
        highlightTarget: true,
        action: {
            label: 'Enter Brush Mode',
            onClick: (actions) => actions.toggleBrushMode()
        },
        trigger: (state) => state.connections.length >= 3 && !state.isBrushMode,
        completion: (state) => !!state.beginnerMode.featureUsage['brush_mode_toggled']
    },
    
    // 18. BRUSH MODE EXIT (Contextual)
    {
        id: 'brush_exit_hint',
        type: 'auto', 
        title: 'Brush Mode',
        text: 'Paint on the lines with your mouse. Press "Esc", "B", or click the brush icon to exit.',
        targetId: 'brush-mode-btn',
        position: 'bottom',
        highlightTarget: true,
        trigger: (state) => state.isBrushMode,
        completion: (state) => !state.isBrushMode
    },

    // 19. PLANET MODIFICATION
    {
        id: 'planet_mod_discovery',
        type: 'discovery',
        title: 'Shape the System',
        text: 'You can select orbits to modify their size, shape, and inclination visually.',
        targetId: 'modify-planet-btn',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('realism', true), // Planet Mod button is in PhysicsSettings now
        action: {
            label: 'Modify Planets',
            onClick: (actions) => actions.enterPlanetModificationMode()
        },
        trigger: (state) => state.currentSystem !== 'Sol' && state.currentSystem !== 'Sol (Extended)' && !state.isPlanetModificationMode,
        completion: (state) => state.isPlanetModificationMode
    },

    // 20. 3D EXPORT
    {
        id: 'export_obj_discovery',
        type: 'discovery',
        title: 'Export to 3D',
        text: 'Hover over the Save button to export your lines as a 3D model (.obj) for use in Blender or other software.',
        targetId: 'save-menu-container',
        position: 'bottom',
        highlightTarget: true,
        trigger: (state) => state.connections.length >= 1 && state.time > 1500 && !state.beginnerMode.featureUsage['export_obj'],
        completion: (state) => !!state.beginnerMode.featureUsage['export_obj']
    },


    // =====================================================================================
    // 5. PRO FEATURES - Audio, Data, Shortcuts
    // =====================================================================================

    // 21. SOUND
    {
        id: 'sound_discovery',
        type: 'discovery',
        title: 'Hear the Spheres',
        text: 'Did you know? The orbital ratios can be converted into sound. Turn on the engine to hear your creation.',
        targetId: 'sound-toggle-btn',
        position: 'top',
        highlightTarget: true,
        action: {
            label: 'Turn On Sound',
            onClick: (actions) => actions.toggleSound(true)
        },
        trigger: (state) => state.connections.length >= 1 && !state.isSoundEnabled,
        completion: (state) => !!state.beginnerMode.featureUsage['sound_toggled']
    },
    
    // 22. SOUND PRO
    {
        id: 'sound_pro_discovery',
        type: 'discovery',
        title: 'AstroSound™ Pro',
        text: 'Open the visual synthesizer to connect planets to oscillators, filters, and effects. Double-click to create nodes.',
        targetId: 'sound-creator-btn', 
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('sound', true),
        action: {
            label: 'Open Synth',
            onClick: (actions) => {
                actions.updateUI({ isSoundCreator2Open: true });
                actions.addInstrumentInstance('Velocity Drone');
            }
        },
        trigger: (state) => state.isSoundEnabled && !state.isSoundCreator2Open,
        completion: (state) => state.isSoundCreator2Open
    },

    // 23. JPL DATA
    {
        id: 'jpl_discovery',
        type: 'discovery',
        title: 'Real NASA Data',
        text: 'Want extreme precision? Fetch high-fidelity ephemeris data directly from NASA JPL Horizons. This data needs to be dialed in to your specified date and time to extract from the NASA servers',
        targetId: 'physics-settings', 
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('realism', true),
        action: {
            label: 'Open JPL Panel',
            onClick: (actions) => actions.updateUI({ isJplPanelOpen: true })
        },
        trigger: (state) => state.useRealisticPhysics && !state.isJplPanelOpen,
        completion: (state) => state.isJplPanelOpen
    },
    
    // 24. SHORTCUTS
    {
        id: 'shortcuts_discovery',
        type: 'discovery',
        title: 'Power User?',
        text: 'Learn keyboard shortcuts like Space (Play/Pause) or S+Drag (Scrub Speed).',
        targetId: 'help-menu-btn',
        position: 'left', 
        action: {
            label: 'View Shortcuts',
            onClick: (actions) => actions.updateUI({ isShortcutsModalOpen: true })
        },
        trigger: (state) => state.connections.length > 3 && !!state.beginnerMode.featureUsage['camera_move'] && !state.beginnerMode.featureUsage['shortcuts_opened'],
        completion: (state) => state.isShortcutsModalOpen
    },

    // 25. TIME TRAVEL
    {
        id: 'time_travel_hint',
        type: 'discovery',
        title: 'Time Travel',
        text: 'Click the date display to jump to a specific point in time.',
        targetId: 'time-date-display', 
        position: 'left',
        highlightTarget: true,
        trigger: (state) => state.time > 2000 && !state.beginnerMode.featureUsage['date_picker_opened'],
        completion: (state) => !!state.beginnerMode.featureUsage['date_picker_opened']
    },

    // --- Contextual / Reactive Hints (Scrubbing, Reset, etc) ---

    // RESET SIMULATION (High Priority if stuck)
    {
        id: 'reset_simulation_hint',
        type: 'auto',
        title: 'End of Time',
        text: 'If you have reached the limit of the simulation, you can rewind to the start date to reset time, and erase old lines.',
        targetId: 'reset-button',
        position: 'top',
        highlightTarget: true,
        action: {
            label: 'Rewind',
            onClick: (actions) => actions.handleReset()
        },
        trigger: (state) => (isNaN(state.time) || state.time > 730000),
        completion: (state) => state.time === 0
    },
    
    // Z-OFFSET / SCRUBBING
    {
        id: 'z_scrub_hint',
        type: 'discovery',
        title: '3D Depth',
        text: 'Use the Orbit Offset slider or hold "Z" and drag to separate planets in 3D space.',
        targetId: 'orbit-z-offset-control',
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('orbits', true),
        trigger: (state) => state.connections.length > 2 && state.renderMode === 'perspective' && state.targetZOffset === 0 && !state.beginnerMode.featureUsage['z_offset_tweaked'],
        completion: (state) => state.targetZOffset !== 0
    },

    // DRIFT SCRUB
    {
        id: 'drift_scrub_hint',
        type: 'discovery',
        title: 'Drift Control',
        text: 'Hold the "D" key and drag horizontally or vertically to control the drift speed and axis.',
        targetId: 'drift-slider-container', 
        position: 'right',
        highlightTarget: true,
        onEnter: (actions) => actions.expandLayerExclusively('camera', true),
        trigger: (state) => (state.beginnerMode.interactionCounts['drift_slider'] || 0) >= 3 && !state.beginnerMode.featureUsage['drift_scrub_action'],
        completion: (state) => !!state.beginnerMode.featureUsage['drift_scrub_action']
    },
    
    // SCRUB SPEED
    {
        id: 'scrub_speed_hint',
        type: 'discovery',
        title: 'Pro Tip: Scrubbing',
        text: 'You can hold the "S" key and drag anywhere on the screen to change speed without opening the menu.',
        targetId: 'speed-input-box',
        position: 'top',
        trigger: (state) => (!!state.beginnerMode.featureUsage['speed_slider_ui'] || state.time > 60) && !state.beginnerMode.featureUsage['speed_scrub_action'],
        completion: (state) => !!state.beginnerMode.featureUsage['speed_scrub_action']
    },

    // FULLSCREEN
    {
        id: 'fullscreen_hint',
        type: 'discovery',
        title: 'Immersive View',
        text: 'Hide the browser UI to immerse yourself in the simulation.',
        targetId: 'fullscreen-btn',
        position: 'top',
        highlightTarget: true,
        action: {
            label: 'Fullscreen',
            onClick: (actions) => actions.toggleFullscreen()
        },
        trigger: (state) => state.connections.length > 0 && state.time > 120 && !state.isFullscreen,
        completion: (state) => state.isFullscreen
    },

    // SHARE IMAGE
    {
        id: 'save_image_hint',
        type: 'discovery',
        title: 'Capture the Moment',
        text: 'Save a high-resolution image of your creation.',
        targetId: 'save-image-btn',
        position: 'top',
        highlightTarget: true,
        trigger: (state) => state.connections.length >= 3 && state.time > 2000 && !state.beginnerMode.featureUsage['save_image_clicked'],
        completion: (state) => !!state.beginnerMode.featureUsage['save_image_clicked']
    },
    
    // SHARE LINK
    {
        id: 'share_discovery',
        type: 'discovery',
        title: 'Share Your Art',
        text: 'Created something beautiful? Generate a unique link to share this exact scene with others.',
        targetId: 'share-button',
        position: 'bottom',
        highlightTarget: true,
        action: {
            label: 'Copy Link',
            onClick: (actions) => actions.shareConfiguration()
        },
        trigger: (state) => state.connections.length >= 3 && state.time > 1000, // A decent amount of history generated
        completion: (state) => false // Always available if conditions met until dismissed
    },
];
