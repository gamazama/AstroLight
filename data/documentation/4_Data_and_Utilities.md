# 4. Data & Utilities Guide

This document covers the data structures, types, constants, and utility functions that support the application.

## State Management Data

### Types (`/types`)
All TypeScript types are centralized in the `/types` directory.
*   **`state.ts`**: Defines the root `AppState`, `HistoryState` (Undo/Redo stack), and `TemporalState` (Snapshot structure).
*   **`simulation.ts`**: Core physics state (`SimulationState`, `PlanetNode`, `Connection`).
*   **`visuals.ts`**: Visual configuration (`VisualsState`, `CoreVisualsState`, `BackgroundState`).
*   **`uiState.ts`**: Transient UI state (`UIState`), including panel visibility, tutorial state, Sound Creator interaction state, and JPL fetch status.
*   **`celestial.ts`**: Data structures for Planets (`CelestialBodyData`), Lines, Stars, and Particles.
*   **`common.ts`**: Shared utility types (`Vector3D`, `GradientStop`, `ColorPickerInfo`, `TooltipInfo`).
*   **`actions.ts`**: Defines the `CoreActions` interface, enumerating all available state mutation functions.
*   **`presets.ts`**: Defines the `Preset` structure for saving/loading scenes.
*   **`jpl.ts`**: Defines data structures for JPL Horizons API responses (`PlanetaryData`, `FetchResult`).
*   **`AstroSound/types/`**: Complex types for the audio graph (`SoundGraph`, `SoundNode`, `Instrument`).

### Serialization (.ass Files)
AstroLight uses a custom JSON format (AstroLight Shareable Save, `.ass`) for saving and sharing scenes. To keep URL lengths short for sharing, keys are minified.

*   **`data/serializationConfig.ts`**: Contains the `keyMap` and `reverseKeyMap` dictionaries used to translate between full state keys (e.g., `logarithmicOrbits` -> `lo`) and minified keys. This ensures backward compatibility and compact sharing URLs.
*   **Import/Export**: Logic resides in `store/actions/config.ts`. The export process filters the state to only save non-default values to further reduce file size.

## Application Data (`/data`)

*   **`starSystems.ts`**: The "database" of celestial bodies. Includes orbital elements (Keplerian), metadata (Description, Color), and hierarchy for Binary systems.
*   **`presets.ts`**: Registry of pre-configured scenes (`/data/presets/*.ts`) that demonstrate specific geometries or physics concepts.
*   **`gradientPresets.ts`**: Pre-defined gradient configurations for the Advanced Gradient Editor.
*   **`backgroundPresets.ts`**: Color themes for the background gradient.
*   **`skyboxData.ts`**: List of available skybox textures and their paths.
*   **`hintData.ts`**: Definitions for the "Beginner Mode" tutorial system, including trigger conditions (`trigger`), completion logic (`completion`), and UI targets (`targetId`).

## Utility Functions (`/utils`)

### Orbital Mechanics
*   **`orbitalCalculations.ts`**: Calculates positions based on static orbital elements (Mean Anomaly, Eccentricity) using Kepler's Equation. Used for standard simulation.
*   **`jplHorizons.ts`**: Fetches high-precision ephemeris data.
    *   **Proxy**: Requests are routed through a CORS proxy.
    *   **Target Types**: Supports `Barycenter` (Center of Mass) and `Planet Center` coordinates.
    *   **Optimization**: `getStepSize` dynamically calculates resolution (1d, 1h) based on duration and orbital period.
*   **`celestialCalculations.ts`**:
    *   `calculateSynodicPeriod`: Math for determining alignment intervals between planets.
    *   `calculateHarmonicMultiplier`: Determines ideal persistence values for resonant geometries.

### Export Utilities (`/utils/export/`)
*   **`imageExport.ts`**: Generates 4K+ resolution images by re-rendering the Three.js scene to an offscreen canvas and overlaying 2D Canvas elements.
*   **`modelExport.ts`**: Generates `.obj` files. Exports line history as 3D ribbon meshes in "World Space". Includes a wireframe camera representation.
*   **`svgExport.ts`**: Generates scalable vector graphics of the current view, converting 3D coordinates to 2D SVG paths.

### Geometry & Math
*   **`mathUtils.ts`**: General math helpers (`lerp`, `smoothEase`, `cubicBezier`) and logarithmic slider conversions.
*   **`geometryUtils.ts`**: Optimized distance calculations (`distSq`, `distToSegmentSq`) used heavily in raycasting and hit-testing.
*   **`zOffsetCalculations.ts`**: `calculateZOffsets` determines the Z-axis separation for planets based on orbital radius to create a 3D stacking effect.
*   **`colorUtils.ts`**: Hex/RGB conversions, `sampleGradient` (multi-stop interpolation with bias), and ID mapping for GPU picking buffers.
*   **`presetTransitionUtils.ts`**: Complex logic for morphing between presets. Handles camera mode switching (Ortho<->Persp), boolean cross-fading, and V-Curve interpolation for system swaps.
*   **`noteUtils.ts`**: Converts numeric frequencies (Hz) to musical note strings (e.g., "A4 +10c") for the AstroSound UI.

## Shader Chunks
While not in `/utils`, reusable GLSL code exists in:
*   **`hooks/renderer/webgl/shaders/chunks.ts`**: Contains `simplexNoise3D` (Ashima Simplex Noise) and `gizmoCommon` (World Pivot transformation logic) used by vertex shaders.