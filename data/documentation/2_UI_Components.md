# 2. UI Component Reference

This document lists every UI component in the application, organized by directory.

## Root Components (`components/`)
*   **`UIPanels.tsx`**: The main layout controller for Sandbox Mode. Arranges `TopMenu`, `SettingsPanel`, `BrushCursor`, `BrushPanel`, `TimeDatePanel`, `PlanetInfoPanel`, `ObjectsPanel`, `BottomControls`. Handles `showIntroScreen` logic.
*   **`UIOverlays.tsx`**: The root container for all modals, tooltips, popups, and the Intro Screen. Ensures z-index layering is correct.
*   **`IntroScreen.tsx`**: The landing page. Contains "Create New System", "Quick Start" (Bolt icon), "Open Scene", "About", "Beginner Mode" toggle.
*   **`TopMenu.tsx`**: The top navigation bar. Contains file actions, system selection, presets, and the document name input.
*   **`BottomControls.tsx`**: The playback control bar (Play/Pause/Stop/Rewind), Speed Slider (Logarithmic), Save Image, Toggle Sound, Fullscreen. Mouse idle handling in fullscreen.

## Panels
*   **`ObjectsPanel.tsx`**: The primary inspector panel. Contains collapsible "Layers" (Connections, Lines, Orbits, Background, etc.). Supports dragging.
*   **`SettingsPanel.tsx`**: "Dev & Stats". Stats (Frame time, counts). Performance Tuning (Max lines, Min Alpha, DoF Debug). Analysis (Disable smoothing/drawing). UI Settings (Perf mode, Opacity, Blur).
*   **`TimeDatePanel.tsx`**: Displays the current simulation date/time. Toggles Start/End date pickers. Collapsible.
*   **`PlanetInfoPanel.tsx`**: Context-aware panel showing details for the hovered or selected planet (Radius, Period, Eccentricity, Inclination).
*   **`BrushPanel.tsx`**: "Brush Mode" UI. Sliders for Size/Strength. Embedded Color Picker.
*   **`PlanetEditorPanel.tsx`**: Floating panel for "Modify Planet" mode. Contains `PlanetEditor`. Features a custom closing animation.

## Layers (`components/layers/`)
These are sub-sections of the `ObjectsPanel`.
*   **`LayerItem.tsx`**: A reusable collapsible accordion item.
*   **`ConnectionsLayer.tsx`**: Lists active connections. Clear All button.
*   **`LinesLayer.tsx`**: Controls line width, opacity, blending, and the **Advanced Gradient Editor**.
    *   **Mycelium Settings**: Controls for the organic "Living Lines" effect (Displacement, Texture, Flow).
    *   **Sparkle Settings**: Controls for particle system density, drag, and visual properties.
*   **`OrbitsLayer.tsx`**: Controls planet size, labels, and visibility.
*   **`RealismLayer.tsx`**: Container for physics and data integrations.
    *   **`JplSettings.tsx`**: Controls for fetching ephemeris data from NASA JPL Horizons. Configures Date Range, Target Type (Barycenter vs Planet Center), and Precision.
    *   **`PhysicsSettings.tsx`**: Toggles for Realistic Physics, Logarithmic Scaling, and the "Modify Planet" mode.
*   **`BackgroundLayer.tsx`**: Stars, Nebula, Skybox Image, and Background Gradient.
*   **`CameraLayer.tsx`**: Render Mode (Ortho/Persp), World Pivot, and Ambient Motion.
    *   **`DriftSettings.tsx`**: Controls for the Z-Axis/X-Axis drift effect.
    *   **`AmbientMotionSettings.tsx`**: Controls for auto-rotation/wobble modes.
*   **`AdvancedLayer.tsx`**: Extra debug controls for camera overrides and opacity multipliers.
*   **`SoundLayer.tsx`**: Controls Master Volume, Active Instruments list, and access to the Sound Creator.

## Shared Components (`components/shared/`)
*   **`Slider.tsx`**: A robust slider with text input, logarithmic support, and scrubbing (drag on label).
*   **`ToggleSwitch.tsx`**: Simple on/off switch.
*   **`StyledToggleSwitch.tsx`**: Toggle switch with labels on both sides (e.g., "Linear" vs "Log").
*   **`Section.tsx`**: Visual container for grouping controls.
*   **`FloatingScrollbar.tsx`**: Custom overlay scrollbar for panels with `overflow: hidden`.
*   **`AdvancedGradientEditor.tsx`**: A professional-grade gradient editor. Features:
    *   **Multi-stop Editing**: Click track to add, right-click to remove, drag to move.
    *   **Interpolation Modes**: Per-stop control for Linear, Step, Smooth (Cosine), and Cubic interpolation.
    *   **Bias Control**: Drag handles between stops to adjust the midpoint (easing) of the color transition.
    *   **Context Menu**: Right-click for presets, inversion, and distribution tools.
*   **`EmbeddedColorPicker.tsx`**: Inline color picker (used in Brush Panel and Gradient Editor).

## Sub-Menus (`components/topMenu/`)
*   **`FileActions.tsx`**: New, Open, Save (Dropdown: Scene, Share URL, Image, SVG, OBJ). Undo/Redo. Brush Toggle.
*   **`SystemsDropdown.tsx`**: List of star systems categorized by type.
*   **`PlanetsDropdown.tsx`**: Grid of draggable `PlanetNodeChip`s for creating connections.
*   **`PresetsDropdown.tsx`**: Scrollable list of built-in presets.
*   **`HelpDropdown.tsx`**: Links to About, Shortcuts, Beginner Mode, Dev Stats.

## Connection UI (`components/connectionsUI/`)
*   **`ConnectionItem.tsx`**: A row representing a single connection with Harmony Wand support and Color Picker trigger.
*   **`PlanetNodeChip.tsx`**: The draggable chip in the Planets menu.
*   **`PlanetEditor.tsx`**: The form inside `PlanetEditorPanel` for live parameter editing.

## Sound Components (`AstroSound/components/`)
*   **`SoundCreator.tsx`**: The main modular synth workspace overlay. Contains the `NodeCanvas`.
*   **`NodeCanvas.tsx`**: The interactive graph area. Handles panning, zooming, node dragging, and wire connections.
*   **`Node.tsx`**: Individual sound node UI. Renders ports, header, and visualizations.
*   **`AttributePanel.tsx`**: Sidebar for editing node parameters.
*   **`ParameterList.tsx`**: Renders dynamic controls (Sliders, Selects) based on node definitions.
*   **`MasterOutput.tsx`**: Floating volume knob/mute button on the canvas.
*   **`NodeMenu.tsx`**: Searchable context menu for adding nodes and prefabs.
*   **`SoundEngineLoader.tsx`**: Modal showing AudioWorklet initialization status or errors.
*   **`FilterNodeViz.tsx`**: Frequency response graph visualization.
*   **`LFONodeViz.tsx`**: Oscilloscope for LFOs.
*   **`OscilloscopeNodeViz.tsx`**: Real-time waveform display with auto-trigger logic.
*   **`CurveNodeViz.tsx`**: Interactive editor for the Curve node.

## Overlays & Modals
*   **`ColorPicker.tsx`**: Floating HSV picker.
*   **`DatePicker.tsx`**: Calendar widget for setting start/end dates.
*   **`ShortcutsModal.tsx`**: Displays keyboard shortcuts.
*   **`ConfirmationDialog.tsx`**: Generic confirm/cancel prompt.
*   **`JplDebugModal.tsx`**: Shows raw text response from JPL API.
*   **`Modal.tsx`**: Generic backdrop wrapper.
*   **`AboutContent.tsx`**: Version info and "Gemini 3.0's Musings".
*   **`Notification.tsx`**: Transient toast messages with bold text support.
*   **`Tooltip.tsx`**: Mouse-follow tooltips.
*   **`BeginnerHint.tsx`**: Floating card for tutorial. Features "Discovery Bulb" for passive hints.
*   **`BackgroundLoader.tsx`**: Progress bar for loading large assets (Skybox textures).
*   **`BrushCursor.tsx`**: Custom cursor rendering for Brush Mode.
*   **`ConnectionLine.tsx`**: Animated SVG line for successful connections.
*   **`PlanetConnectionLine.tsx`**: The "noodle" line drawn while dragging connections.
*   **`ScrubIndicator.tsx`**: Visual feedback when using "Scrub" shortcuts (S+Drag, etc.).
*   **`ShareSnapshotEffect.tsx`**: Visual flash effect when sharing a link.