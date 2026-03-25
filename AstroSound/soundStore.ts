import type { SoundState, SoundGraph } from './types';
import { ALL_NODE_TYPES } from './components/nodeTypes';
import { DEFAULT_INSTRUMENTS } from './data/defaultInstruments';
import { processExposedInputs } from './actions/utils';
import { createSoundActions } from './actions/sound';

// Initial "Velocity Drone" Graph
const initialGraph: SoundGraph = {
    nodes: [
        // Data Source
        { id: "data_source", type: "DataSource", position: { x: 0, y: 150 }, params: { customName: "Orbit Data", activeOutputs: ["fromVelocity", "toVelocity", "fromOrbitRadius", "toOrbitRadius"], sourceType: 'connection', connectionIndex: 0, exposedInputs: [] } },
        
        // Voice A
        { id: "math_vel_a", type: "Math", position: { x: 300, y: 0 }, params: { operation: "multiply", val2: 1000000000, customName: "Vel Scale A", exposedInputs: ["val1"] } },
        { id: "octave_a", type: "Cosmic Octaver", position: { x: 550, y: 0 }, params: { inputType: "distance", distanceUnit: "Mkm", speedConstant: "custom", customName: "Pitch A", exposedInputs: ["customVelocity", "value"] } },
        { id: "voice_a", type: "Cross-Oscillator", position: { x: 850, y: 0 }, params: { waveform: "sine", amplitude: 0.23, pan: -0.4, fmEnabled: true, fmAmount: 1, unisonVoices: 1, customName: "Voice A", exposedInputs: ["frequency"] } },

        // Voice B
        { id: "math_vel_b", type: "Math", position: { x: 300, y: 300 }, params: { operation: "multiply", val2: 1000000000, customName: "Vel Scale B", exposedInputs: ["val1"] } },
        { id: "octave_b", type: "Cosmic Octaver", position: { x: 550, y: 300 }, params: { inputType: "distance", distanceUnit: "Mkm", speedConstant: "custom", customName: "Pitch B", exposedInputs: ["customVelocity", "value"] } },
        { id: "voice_b", type: "Cross-Oscillator", position: { x: 850, y: 300 }, params: { waveform: "sine", amplitude: 0.23, pan: 0.4, fmEnabled: true, fmAmount: 1, unisonVoices: 1, customName: "Voice B", exposedInputs: ["frequency"] } },

        // Controls
        { id: "param_filter", type: "Parameter", position: { x: 1100, y: 400 }, params: { value: 800, min: 100, max: 5000, customName: "Filter Freq", exposedInputs: [] } },
        { id: "param_reverb", type: "Parameter", position: { x: 1350, y: 400 }, params: { value: 0.5, min: 0, max: 1, customName: "Reverb Mix", exposedInputs: [] } },

        // FX Chain
        { id: "mixer", type: "Mixer", position: { x: 1150, y: 150 }, params: { exposedInputs: ["in1", "in2"], customName: "Mixer" } },
        { id: "filter", type: "Filter", position: { x: 1400, y: 150 }, params: { type: "lowpass", cutoff: 333, q: 1.2, drive: 0.9, exposedInputs: ["in", "cutoff"] } },
        { id: "reverb", type: "Reverb", position: { x: 1650, y: 150 }, params: { mix: 0.4, decay: 0.8, size: 0.9, exposedInputs: ["in", "mix"] } },
        
        // Master Output
        { id: "MASTER_OUTPUT", type: "Output", position: { x: 2000, y: 150 }, params: { customName: "Master Out", displayColor: "#4a5568", isBypassed: false, exposedInputs: ["in"] } }
    ],
    connections: [
        // Voice A
        { id: "c1", fromNodeId: "data_source", fromOutput: "fromVelocity", toNodeId: "math_vel_a", toInput: "val1", pathPoints: [] },
        { id: "c2", fromNodeId: "math_vel_a", fromOutput: "out", toNodeId: "octave_a", toInput: "customVelocity", pathPoints: [] },
        { id: "c3", fromNodeId: "data_source", fromOutput: "fromOrbitRadius", toNodeId: "octave_a", toInput: "value", pathPoints: [] },
        { id: "c4", fromNodeId: "octave_a", fromOutput: "out", toNodeId: "voice_a", toInput: "frequency", pathPoints: [] },
        { id: "c5", fromNodeId: "voice_a", fromOutput: "out", toNodeId: "mixer", toInput: "in1", pathPoints: [] },

        // Voice B
        { id: "c6", fromNodeId: "data_source", fromOutput: "toVelocity", toNodeId: "math_vel_b", toInput: "val1", pathPoints: [] },
        { id: "c7", fromNodeId: "math_vel_b", fromOutput: "out", toNodeId: "octave_b", toInput: "customVelocity", pathPoints: [] },
        { id: "c8", fromNodeId: "data_source", fromOutput: "toOrbitRadius", toNodeId: "octave_b", toInput: "value", pathPoints: [] },
        { id: "c9", fromNodeId: "octave_b", fromOutput: "out", toNodeId: "voice_b", toInput: "frequency", pathPoints: [] },
        { id: "c10", fromNodeId: "voice_b", fromOutput: "out", toNodeId: "mixer", toInput: "in2", pathPoints: [] },

        // Controls
        { id: "c11", fromNodeId: "param_filter", fromOutput: "out", toNodeId: "filter", toInput: "cutoff", pathPoints: [] },
        { id: "c12", fromNodeId: "param_reverb", fromOutput: "out", toNodeId: "reverb", toInput: "mix", pathPoints: [] },

        // FX
        { id: "c13", fromNodeId: "mixer", fromOutput: "out", toNodeId: "filter", toInput: "in", pathPoints: [] },
        { id: "c14", fromNodeId: "filter", fromOutput: "out", toNodeId: "reverb", toInput: "in", pathPoints: [] },
        { id: "c15", fromNodeId: "reverb", fromOutput: "out", toNodeId: "MASTER_OUTPUT", toInput: "in", pathPoints: [] },
    ]
};

export const initialSoundState: SoundState = {
    isSoundEnabled: false,
    masterVolume: 0.5,
    graph: processExposedInputs(initialGraph),
    instruments: DEFAULT_INSTRUMENTS,
    activeInstrumentInstances: [],
    isDroneEnabled: false,
    isLineSoundEnabled: true,
    
    isFilterEnabled: true,
    filterCutoff: { base: 200, modulator: 'cameraRotationVelocity', intensity: 1500 },
    filterResonance: { base: 5, modulator: 'none', intensity: 0 },

    isDelayEnabled: true,
    delayTime: { base: 0.25, modulator: 'none', intensity: 0 },
    delayFeedback: { base: 0.5, modulator: 'none', intensity: 0 },
    soundNodeOutputs: {},
    clippingOutputs: {},
    oscilloscopeData: {},
};

// Export the action creator from the new modular structure
export { createSoundActions };