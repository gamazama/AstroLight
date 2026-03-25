# 6. AstroSound™ Pro Engine Reference

## 1. Architecture Overview

AstroSound™ Pro is a modular, node-based synthesis engine running entirely within a **AudioWorklet**. This design ensures that audio processing happens on a high-priority thread, decoupled from the main React/UI thread, guaranteeing glitch-free audio even during heavy visual rendering.

### The Worklet Pattern
*   **Main Thread (`AstroSound/hooks/useSoundEngine.ts`):**
    *   Initializes the `AudioContext` and loads all Worklet modules.
    *   Maintains the `audioWorkletProxy` for direct communication from Zustand actions.
    *   **Physics Bridge:** Runs a 60Hz loop calculating physics state. It performs **dead reckoning** (finite difference calculation) to derive instantaneous velocity vectors (`vx`, `vy`, `vz`) for planets before sending them to the audio thread via `SIM_STATE_TICK`.
*   **Audio Thread (`LineSoundProcessor.js`):**
    *   The central coordinator. Receives messages and executes the DSP graph.
    *   **Dual-Rate Processing:**
        *   **K-Rate (Control Rate):** Runs once per block (128 samples). Calculates modulation logic (LFOs, Envelopes, Math) and updates internal node parameters.
        *   **A-Rate (Audio Rate):** Runs for every sample. Handles waveform generation, filtering, mixing, and per-sample modulation interpolation.
    *   **Time Management:** Maintains a smoothed `simTime` internal clock, interpolating between main-thread snapshots to ensure smooth playback even if the main thread jitters.

### The "Blackboard"
The `LineSoundProcessor` maintains a local cache of the simulation state called the **Blackboard**. This allows nodes like `DataSource` or `Interaction` to access physics data instantaneously without waiting for message passing on every sample.
*   **Data Points:** The blackboard stores `bodies` (position, velocity, radius), `connections` (distance), `camera` (zoom, tilt, rotation), and `mouse` coordinates.

---

## 2. Node Library

### Input & Data Nodes
*   **DataSource:** The bridge between Physics and Audio.
    *   *Modes:* Connection (between two bodies) or Single Planet.
    *   *Outputs:* `realtimeDistance`, `relativeDistance` (normalized), `synodicPeriod`, `orbitalRatio`, `from/toOrbitRadius`, `from/toOrbitPeriod`, `from/toVelocity`, `from/toPhysicalRadius`.
*   **Interaction:** Exposes UI/Camera state.
    *   *Outputs:* `mouseX`, `mouseY` (-1 to 1), `mouseXRaw`, `mouseYRaw` (pixels), `zoom`, `zoomLog` (logarithmic zoom), `tilt`, `rotation`, `timeSpeed`, `isPlaying`, `time`.
*   **Static Source:** Provides constant values or simple test oscillators.

### Generators
*   **Oscillator:** Standard waveforms (Sine, Square, Saw, Triangle, Noise).
*   **Cross-Oscillator:** An advanced "Uber-Oscillator" supporting:
    *   **Supersaw:** Up to 16 unison voices with detune spread.
    *   **Hard Sync:** Slave oscillator functionality.
    *   **FM (Frequency Modulation):** Phase modulation capability.
    *   **Sub-Oscillator:** -1 or -2 octaves below fundamental.
*   **LFO:** Low Frequency Oscillator. Supports `Sine`, `Triangle`, `Sawtooth`, `Square`, and `Random` (Sample & Hold).
*   **Curve:** Generates control signals from a multi-point curve editor. Supports `Linear`, `Step`, and `Smooth` (Cosine) interpolation.

### Utilities & Math
*   **Cosmic Octaver:** Sonifies astronomical data.
    *   *Function:* Converts input (Days or Distance) to an audible frequency by shifting octaves until the value falls within the audio range (approx. 261Hz - 523Hz target window).
    *   *Parameters:* `Input Type`, `Distance Unit` (m, km, Mkm), `Speed Constant` (Light, Sound, Custom).
*   **Math:** Performs arithmetic on control signals.
    *   *Operations:* `Add`, `Subtract`, `Multiply`, `Divide`, `Scale` (mx+c), `Abs`, `Min`, `Max`, `Pow`.
*   **Rerouter:** Pass-through nodes (Audio and Value variants) for cable management.
*   **Gain/Pan/Mixer:** Standard mixing utilities.
*   **Parameter:** Exposed slider control for Instruments.

### Effects
*   **Filter:** Biquad filter (Lowpass, Highpass, Bandpass, Notch, Peaking, Lowshelf, Highshelf) with selectable 12dB or 24dB slope. Includes LFO modulation inputs.
*   **Waveshaper:** Distortion unit.
    *   *Types:* `Tanh`, `Atan`, `Hard Clip`, `Wavefolder`.
    *   *Tone:* Built-in one-pole lowpass filter for taming harsh harmonics.
*   **Delay:** Feedback delay line with cross-channel bleeding logic.
*   **Reverb:** A high-quality **FDN (Feedback Delay Network)** implementation.

### Visualization
*   **Oscilloscope:** Captures audio buffers for the UI.
    *   *Logic:* Includes auto-triggering (rising/falling slope detection) and silence detection to freeze the display when no audio is present.

---

## 3. The Instrument System

AstroSound distinguishes between a **Raw Graph** and an **Instrument**.

### Instruments (Macros)
An Instrument is a saved configuration of a Graph that exposes specific "Macro" parameters.
*   **Parameter Node:** Becomes a slider in the `SoundLayer`.
*   **DataSource Node:** Becomes a dropdown selector (Connection/Planet) in the `SoundLayer`.
*   **Instances:** When added, the engine creates a unique copy of all nodes with a prefixed ID (e.g., `inst_123_Osc_1`).

---

## 4. File Responsibility Reference (`public/worklet/`)

### Core Processor
*   **`LineSoundProcessor.js`**: The AudioWorkletProcessor entry point.
    *   **Graph Management:** Rebuilds the execution graph (`updateGraph`) when topology changes.
    *   **State Management:** Holds `nodeMap`, `connectionMap`, and DSP state (buffers, phases).
    *   **Loop Orchestration:** Runs the K-Rate pass (control values) followed by the A-Rate pass (audio samples) block-by-block.
    *   **UI Sync:** Throttles and sends analysis data (meters, oscilloscope) back to the main thread via `port.postMessage`.

### DSP Libraries (`dsp/`)
*   **`BiquadFilter.js`**: Implements a Direct Form II Transposed biquad filter for numerical stability. Handles coefficient calculation for all filter types (LP, HP, BP, Notch, Peaking, Shelving).
*   **`FDNReverb.js`**: A Feedback Delay Network reverb.
    *   **Matrix:** Uses an orthogonal Householder matrix for lossless energy diffusion.
    *   **Modulation:** Internal LFOs modulate delay line lengths to prevent metallic resonance.
    *   **DC Block:** Includes a DC blocker to prevent bias buildup in the feedback loop.
    *   **Damping:** Per-line one-pole lowpass filters control decay brightness.

### Utilities (`utils/`)
*   **`graph.js`**: Implements `topologicalSort` to determine the correct execution order of nodes based on their dependencies. Detects and handles cycles.
*   **`wavetable.js`**: Generates a band-limited sawtooth wavetable using additive synthesis to reduce aliasing in oscillators.
*   **`processor.js`**: Contains the registries (`NODE_PROCESSORS_KR`, `NODE_PROCESSORS_AR`) mapping node types to their processing functions. Also handles input pre-resolution optimization.

### Node Processors (`node-processors/`)
Each file implements the logic for a specific node type.

*   **`dataSource.js`**: Solves Kepler's Equation (Newton's method) to determine orbital position/velocity. Handles "Dead Reckoning" interpolation for smooth physics at audio rates.
*   **`interaction.js`**: Normalizes mouse coordinates and camera transforms for audio modulation.
*   **`staticSource.js`**: Outputs constant values or simple test tones.
*   **`parameter.js`**: Interpolates UI slider values (K-Rate) to audio-rate signals.
*   **`lfo.js`**: Implements low-frequency oscillators with phase tracking.
*   **`curve.js`**: Implements multi-point envelope generation with Linear, Step, or Cosine interpolation.
*   **`oscillator.js`**: Standard anti-aliased oscillators (Sine, Square, Saw, Triangle, Noise).
*   **`crossOscillator.js`**: Manages a bank of `CrossOscillatorVoice` instances for Supersaw unison and handles FM/Sync logic per voice.
*   **`math.js`**: Performs per-sample arithmetic.
*   **`gain.js`, `pan.js`**: Simple volume and stereo panning (constant power).
*   **`mixer.js`**: Sums up to 4 inputs. Includes a DC blocking filter on output.
*   **`filter.js`**: Wrapper for `BiquadFilter` that handles parameter modulation (Cutoff, Q, Gain).
*   **`delay.js`**: Implements a circular buffer delay with fractional read pointers for smooth time modulation.
*   **`reverb.js`**: Wrapper for `FDNReverb`, exposing parameters like Decay, Size, Mix to the graph.
*   **`waveshaper.js`**: Implements distortion transfer functions (`tanh`, `atan`, folding) and the post-distortion Tone filter.
*   **`oscilloscope.js`**: Writes audio to a circular buffer. Implements trigger logic (rising/falling slope) to stabilize the waveform visualization.
*   **`cosmicOctaver.js`**: Implements the logic to shift a very low frequency (orbital period) up by powers of 2 until it is audible.
*   **`rerouter.js`**: Pass-through logic for signal routing.
*   **`output.js`**: Sums signals to the final output bus.