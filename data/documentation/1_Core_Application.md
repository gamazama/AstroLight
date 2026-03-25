# 1. Core Application Architecture

## Overview
AstroLight™ is a high-performance React application that visualizes celestial mechanics and generates generative art. It uses a hybrid rendering approach (2D Canvas for UI/overlays, WebGL via Three.js for the simulation) and a custom audio engine. The application state is managed centrally via **Zustand**.

## Entry Points
*   **`index.html`**: The bootstrap file. Handles CSS loading, meta tags, and the module import map for dependencies.
*   **`index.tsx`**: The React entry point. Mounts the `App` component to the DOM root.
*   **`App.tsx`**: The application root. It initializes all core hooks (`useWebGLRenderer`, `useRenderer`, `useOrbitRenderer`, `useSimulationLoop`, `useSoundEngine`, `usePerformanceOptimization`, `usePresetTransition`, `usePhysicsTransition`, etc.) and conditionally renders the main UI layers (`UIPanels`, `UIOverlays`) and Canvas elements. It also handles global mouse event listeners and URL configuration loading.
*   **`metadata.json`**: Contains application metadata (version, description).

## State Management (Zustand)
The entire application state is held in a single store defined in `store/appStore.ts`. The state is sliced into logical domains but accessed via a unified interface.

**Key Principles:**
1.  **Single Source of Truth**: All simulation data (time, planets, lines) and UI state (panels, colors) live here.
2.  **Transient Updates**: High-frequency updates (60fps) like `time` or `particles` are updated directly in the store but are often read via `useAppStore.getState()` inside animation loops to avoid React render thrashing.
3.  **Action-Based**: All state mutations happen via actions defined in `store/actions/`. Direct mutation is forbidden.
4.  **History**: Undo/Redo logic is baked into the core store (`store/actions/core.ts`), taking snapshots of `TemporalState` (Visuals + Simulation) while ignoring transient data.

## The Simulation Loop (`useSimulationLoop.ts`)
This hook drives the application. It uses `requestAnimationFrame` to:
1.  Calculate `deltaTime` and handle tab visibility (pausing when hidden).
2.  **Camera Transitions**: executing complex interpolation logic for switching between Orthographic and Perspective modes (lerping FOV and Zoom).
3.  **Smoothing**: Applies lerping to Camera parameters (Zoom, FOV) and Z-Offsets (planet stacking) for fluid movement.
4.  **Ambient Motion**: Computes drift, wobble, orbit, and cinematic intro motion velocities and applies them to the camera state.
5.  **Physics Step**: Calls `calculateFrameUpdate` (`hooks/renderer/simulationUpdate.ts`) to compute the new state of the universe:
    *   Updates simulation time.
    *   Calculates new planet positions (Keplerian or JPL Horizons).
    *   Generates new line segments based on connection persistence.
    *   Updates particle systems (Sparkles).
6.  Commit the new frame data to the store via `updateFrameData`.

## Rendering Architecture
Rendering is split to optimize performance:

### 1. WebGL (Three.js) - `useWebGLRenderer.ts`
Handles the starfield, nebula, and the massive number of orbital lines using custom shaders for performance.
*   **Camera Sync**: Manages a separate Background Camera that syncs with the main camera state, handling FOV adjustments for the skybox during Ortho/Persp transitions.
*   **Mycelium Engine**: Uses vertex shaders (`historyLine.vert`, `liveLine.vert`) to displace geometry in 3D space based on coherent Simplex noise. This allows for organic "wiggle" effects without CPU overhead. The fragment shader (`line.frag`) handles texture generation, nutrient pulses, and cellular structure mapping.
*   **Physically Based Depth of Field (DoF)**: Instead of a simple post-processing blur, the shader calculates a per-pixel Circle of Confusion (CoC) based on the fragment's distance from the focus plane. This CoC modulates line width in the vertex shader and alpha/softness in the fragment shader to simulate real bokeh.
*   **World Space Pivot (Gizmo)**: The vertex shaders accept `u_worldRotation`, `u_pivotOffset`, and `u_viewPivot` uniforms. This allows the user to rotate the entire universe geometry around an arbitrary 3D point independent of the camera view matrix.

### 2. 2D Canvas - `useOrbitRenderer.ts`
Handles the interactive "picking" layer (orbit highlighting), connection "noodle" dragging, the Gizmo UI, and drawing the clean vector paths of the orbits themselves.
*   **Gizmo Rendering**: Draws the 3D rotation handles and interaction buttons overlaying the WebGL scene.
*   **Visual Masking**: Uses a hidden off-screen canvas with unique color-coded IDs (`orbitIdCanvasRef`) to detect mouse hovers over orbits pixel-perfectly.
*   **Interaction Feedback**: Renders cursor highlights, connection success animations (`drawSuccessAnimation`), and context-aware instructional text (`drawInteractionText`).

### 3. React (UI)
Standard DOM elements for panels, menus, and overlays.

## Performance Optimization
**`hooks/usePerformanceOptimization.ts`** automatically detects device capabilities (RAM, CPU cores) on startup using `navigator.deviceMemory` and `navigator.hardwareConcurrency`.

If a low-spec device (e.g., < 4GB RAM) is detected, it activates **Performance Mode**:
*   **UI**: Disables `backdrop-filter` blur effects.
*   **Shaders**: Disables expensive Depth of Field and Mycelium noise calculations.
*   **Geometry**: Caps the maximum number of lines (e.g., 5,000 vs 50,000) and stars.
*   **Particles**: Disables the particle system entirely.

## External Integrations
1.  **NASA JPL Horizons**: Fetches high-precision ephemeris data (`utils/jplHorizons.ts`) via a CORS proxy. Supports `Barycenter` (Center of Mass) and `Planet Center` coordinate systems.
2.  **Export**:
    *   **Image**: High-resolution (4500x4500px) PNG export via `utils/export/imageExport.ts`.
    *   **3D Model**: OBJ export of line geometry in World Space via `utils/export/modelExport.ts`.
    *   **Vector**: SVG export of current view via `utils/export/svgExport.ts`.