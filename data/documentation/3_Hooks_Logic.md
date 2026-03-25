# 3. Hooks & Logic Guide

This document explains the role of the primary custom hooks that contain the application's core logic, from user input to rendering and game progression.

## Core Simulation & Rendering Hooks

These hooks run on a continuous `requestAnimationFrame` loop to ensure high performance.

-   **`useSimulationLoop.ts`**: The "heartbeat" of the application. This hook runs the main animation loop:
    *   Calculates `deltaTime`.
    *   Handles **Camera Smoothing** and complex **Camera Transitions** (e.g., lerping FOV and Zoom when switching between Orthographic and Perspective modes).
    *   Computes **Ambient Motion** (drift, wobble, orbit, cinematic intro motion).
    *   Calls `calculateFrameUpdate` to advance the physics engine.
    *   Updates the global store with the new frame's data via `updateFrameData`.
-   **`usePhysicsTransition.ts`**: A dedicated loop for handling smooth transitions between discrete physics states. When settings like `logarithmicOrbits` or `ellipticalOrbits` are toggled, this hook interpolates the corresponding T-values to allow the simulation to morph smoothly between models.
-   **`hooks/renderer/simulationUpdate.ts`**: Contains the `calculateFrameUpdate` function, which is the core physics engine. It updates time, planet positions, line generation (based on persistence), and particle systems.
-   **`useRenderer.ts`, `useOrbitRenderer.ts`, `useWebGLRenderer.ts`**: These hooks operate the rendering loops. They read the latest calculated state from the store and render it to their respective `<canvas>` elements (2D and WebGL).

### The Three.js Bridge (`hooks/renderer/threeJsBridge.ts`)

-   **`threeJsBridge`**: A singleton object acting as a central repository for the application's single Three.js renderer instance, scenes, and controllers. This allows expensive WebGL contexts to be shared across hooks (e.g., for exporting high-res images) without re-initialization.

### Renderer Sub-logic (`hooks/renderer/`)

-   **`drawing.ts`**: Core 2D drawing functions for planets and orbits. Handles visibility filtering logic (`shouldDisplayItem`) and specific rendering logic for **Geocentric Trails** (fading segments).
-   **`calculations.ts`**: Pure math utilities.
    *   **Transforms**: `transform3D`, `applyCameraTransform`, `applyWorldTransform`.
    *   **Projection**: `project2D`, `calculatePerspectiveProjection`.
    *   **Raycasting**: `unprojectOnEcliptic` (screen to world plane), `findClosestPointOnLines` (screen to 3D line segment for pivot snapping).
-   **`particleSystem.ts`**: Manages the "Sparkles" effect logic (generation and updates).
-   **`gizmoGeometry.ts` & `gizmoDrawing.ts`**: Implements the interactive World Pivot tool. `gizmoGeometry` generates the 3D paths for the rotation handles/buttons and performs hit testing. `gizmoDrawing` renders the UI to the 2D canvas.
-   **`orbitInteractionText.ts`**: Calculates context-aware instructional text (e.g., "Connect Earth to...") based on hover states.
-   **`webgl/shaders/`**: Vertex and Fragment shaders for lines (`historyLine.vert`, `liveLine.vert`, `line.frag`) and the skybox (`skybox.ts`).
-   **`webgl/particleController.ts`**: Manages the WebGL point sprites for sparkles, including Depth of Field and Gizmo transform logic.
-   **`webgl/backgroundController.ts`**: Manages the background scene (Stars, Nebula, Skybox, Gradient) and their transitions.
-   **`webgl/foregroundController.ts`**: Manages the instantiation and updating of line renderers.

## Input Hooks

-   **`useCameraInput.ts`**: Handles 3D camera manipulations (Rotate, Pan, Zoom). It explicitly checks for Gizmo interaction to prevent camera rotation when the user is manipulating the World Pivot.
-   **`useBrushInput.ts`**: Manages "Brush Mode" for painting colors onto lines using raycasting.
-   **`useOrbitInput.ts`**: Manages interaction with the scene content.
    *   **Connection Mode**: Dragging from one planet to another creates a connection.
    *   **Modify Planet Mode**: If `isPlanetModificationMode` is active, clicking an orbit opens a `PlanetEditorPanel`.
    *   **Pivot Creation**: Handles `Alt + Click` to raycast against lines or the ecliptic plane to set a `pivotPoint`.
    *   **Gizmo Manipulation**: Handles the logic for dragging Gizmo axes and using the background "Trackball" rotation for the World Pivot.
-   **`useKeyboardShortcuts.ts`**: Implements global keyboard shortcuts (Space, R, Undo/Redo) and "Scrub" modifiers (S+Drag, D+Drag, Z+Drag, V+Drag).

## UI & Logic Hooks

-   **`useUIEffects.ts`**: Manages side effects and the **Scrubbing Animation Loop**.
    *   Updates CSS variables (blur/opacity) and body classes (theme, performance mode).
    *   Updates cursor styling based on interaction state.
    *   Runs `actions.updateScrub()` via `requestAnimationFrame` to handle continuous parameter updates during scrubbing interactions.
-   **`useAutomaticEffects.ts`**: Consolidates reactive logic (e.g., auto-adjusting line opacity based on connection count, auto-collapsing panels).
-   **`useBeginnerMode.ts`**: Manages the interactive tutorial system.
    *   **Architecture**: Uses a split-loop approach. It subscribes to Zustand state changes for immediate UI updates but uses a low-frequency heartbeat (`setInterval`, 1000ms) to check complex conditions (like time thresholds) to save performance.
    *   **Hint Data**: Logic is driven by the `HINTS` array in `data/hintData.ts`.
-   **`usePerformanceOptimization.ts`**: Automatically detects device capabilities on mount.
    *   **Heuristic**: If RAM < 4GB or Cores < 4, it enables "Performance Mode".
    *   **Downgrades**: Disables `backdrop-filter`, reduces geometry limits, disables complex shaders.
-   **`usePresetTransition.ts`**: Manages the complex, cinematic transitions between presets. It orchestrates camera movement, physics interpolation, property fading (colors, sizes), V-Curve scaling for system swaps, and the cross-fading of boolean states.
-   **`useDraggablePanel.ts`**: Generic hook for making UI panels draggable within window bounds.
-   **`useCollapseAnimation.ts`**: Manages smooth height animation for collapsible panels.
-   **`useSlideInAnimation.ts`**: Manages transform-based slide-in/out animations for panels.

## Sound Engine Hook

-   **`useSoundEngine.ts`**: The interface to AstroSound Pro. It initializes the `AudioContext`, loads AudioWorklet modules, and syncs the simulation state (`SIM_STATE_TICK`) to the audio thread.
-   **`AstroSound/hooks/useNodeCanvasInteraction.ts`**: A robust state machine for the Sound Creator canvas. Handles panning, node dragging, marquee selection, wire connections, and scaffold resizing.