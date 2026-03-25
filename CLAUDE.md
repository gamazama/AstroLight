# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AstroLight v1.7.4 — an interactive web app that visualizes geometric spirograph patterns created by planetary orbital relationships. Features WebGL rendering, modular sound synthesis, preset system, and real-time orbital simulation.

## Commands

```bash
npm run dev       # Start Vite dev server on port 3000
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

Server (from `server/` directory):
```bash
npm run start     # Run Express server (static file serving + SPA fallback)
npm run dev       # Run with nodemon (hot reload)
```

No test framework is configured.

## Architecture

### Tech Stack
- React 19 + TypeScript, Vite 7, Tailwind CSS (CDN)
- Three.js 0.127 (WebGL), Web Audio API + Worklets (sound)
- Zustand 4.5 (state management), Express 4 (server — static file serving only)
- ES Modules throughout; `@` path alias maps to project root

### Canvas Layering (bottom to top)
1. **WebGL canvas** (`#webgl-canvas`): Three.js starfield/nebula background
2. **Orbit display canvas** (`#orbit-display-canvas`, z-[1]): 2D orbit paths
3. **Main canvas** (`#main-canvas`, z-[2]): Planets, line trails, particles, brush strokes
4. **Orbit ID canvas** (`#orbit-id-canvas`): Hidden selection buffer for hit-testing (display: none)
5. **React UI overlay** (z-10): Panels, modals, controls

### State Management
Zustand store in `store/appStore.ts` with action creators split across `store/actions/`:
- `core.ts` — fundamental state operations (undo/redo, history)
- `connections.ts`, `visuals.ts`, `config.ts`, `export.ts`, `panels.ts`, `modals.ts`, `jpl.ts`
- `game.ts` — gamification/progression logic
- `tutorial.ts` — tutorial flow actions
- `ui.ts` — general UI state updates
- `ui/` subdirectory — `beginnerActions.ts`, `interactionActions.ts`, `layerActions.ts`, `presetActions.ts`

State shape: `AppState = SimulationState & VisualsState & UIState & SoundState & { history: HistoryState }`

Types are defined in `types/` — key files: `state.ts`, `simulation.ts`, `visuals.ts`, `uiState.ts`, `celestial.ts`, `actions.ts`, `common.ts`, `jpl.ts`, `presets.ts`.

### Rendering Pipeline
- `hooks/useSimulationLoop.ts` — main animation loop (requestAnimationFrame)
- `hooks/useWebGLRenderer.ts` — Three.js setup and background rendering
- `hooks/useRenderer.ts` — 2D canvas rendering orchestrator
- `hooks/renderer/` — modular rendering: calculations, drawing, orbit geometry, particles, gizmos
- `hooks/renderer/webgl/` — WebGL subsystems: background, foreground, particles, with GLSL shaders in `shaders/`

### Sound Engine (`AstroSound/`)
Self-contained modular synth with its own Zustand store (`soundStore.ts`), node graph UI (`components/`), Web Audio Worklet processors (`public/worklet/`), and instrument prefabs (`components/prefabs/`).

### Key Data Files
- `data/starSystems.ts` — celestial body definitions (Sol, TRAPPIST-1, Kepler-90, etc.)
- `data/presets.ts` + `data/presets/` — 27 animation presets with interpolation support
- `data/gradientPresets.ts`, `data/backgroundPresets.ts` — visual presets
- `data/hintData.ts` — beginner mode hint definitions
- `data/skyboxData.ts` — skybox texture definitions
- `data/documentation/` — internal codebase documentation (6 files)
- `constants.ts` — app version, physics constants, UI timing, zoom limits, color palette, interpolatable parameter list

### Hook Organization
Each major subsystem has a dedicated hook in `hooks/`:
- **Core rendering**: `useSimulationLoop`, `useRenderer`, `useWebGLRenderer`
- **Input**: `useCameraInput`, `useBrushInput`, `useOrbitInput`, `useKeyboardShortcuts`
- **Visual systems**: `useOrbitRenderer`, `useAutomaticEffects`, `usePresetTransition`, `usePhysicsTransition`
- **UI**: `useUIEffects`, `useBeginnerMode`, `useCollapseAnimation`, `useDraggablePanel`, `useSlideInAnimation`
- **Performance**: `usePerformanceOptimization`
- **Sound**: `AstroSound/hooks/useSoundEngine`

All core hooks initialized in `App.tsx`.

### URL Config Sharing
Supports `?config=` and `?cconfig=` (compressed) query parameters for sharing state. Serialization config in `data/serializationConfig.ts`. Uses pako compression loaded via CDN.

### JPL Horizons Integration
Client-side fetching of real ephemeris data from NASA's JPL HORIZONS API via a CORS proxy (`corsproxy.io`). Implementation in `utils/jplHorizons.ts`, actions in `store/actions/jpl.ts`.

### Backend
Minimal Express 4 static file server in `server/` for Docker/Cloud Run deployment. Serves built frontend with SPA fallback routing. Dockerized with multi-stage build (Node 22).
