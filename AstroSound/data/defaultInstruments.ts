

import type { Instrument } from '../types/soundCreator';

export const DEFAULT_INSTRUMENTS: Instrument[] = [
    {
        name: "Velocity Drone",
        description: "Cinematic drone where pitch is driven by orbital velocity.",
        outputNodeId: "Gain", // Connects directly from the Gain node
        parameters: [
            { nodeId: "Param_Volume", label: "Volume", min: 0, max: 1, step: 0.01, defaultValue: 0.4 },
            { nodeId: "Param_Filter", label: "Filter Cutoff", min: 100, max: 5000, step: 10, defaultValue: 800 },
            { nodeId: "Param_Reverb", label: "Reverb Mix", min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
        ],
        dataSources: [
            { nodeId: "Data_Source", label: "Orbit Data" }
        ],
        graph: {
            nodes: [
                { id: "Data_Source", type: "DataSource", position: { x: 0, y: 0 }, params: { customName: "Orbit Data", activeOutputs: ["fromVelocity", "toVelocity", "fromOrbitRadius", "toOrbitRadius"], sourceType: 'connection', connectionIndex: 0, exposedInputs: [] } },
                
                // Voice 1
                { id: "Math_Vel1", type: "Math", position: { x: 200, y: -100 }, params: { operation: "multiply", val2: 1000000000, customName: "Vel Scale A", exposedInputs: [] } },
                { id: "Octave_1", type: "Cosmic Octaver", position: { x: 400, y: -100 }, params: { inputType: "distance", distanceUnit: "Mkm", speedConstant: "custom", customName: "Pitch A", exposedInputs: [] } },
                { id: "Osc_1", type: "Cross-Oscillator", position: { x: 650, y: -100 }, params: { waveform: "sine", amplitude: 0.3, pan: -0.4, fmEnabled: true, fmAmount: 1, unisonVoices: 1, customName: "Voice A", exposedInputs: [] } },

                // Voice 2
                { id: "Math_Vel2", type: "Math", position: { x: 200, y: 100 }, params: { operation: "multiply", val2: 1000000000, customName: "Vel Scale B", exposedInputs: [] } },
                { id: "Octave_2", type: "Cosmic Octaver", position: { x: 400, y: 100 }, params: { inputType: "distance", distanceUnit: "Mkm", speedConstant: "custom", customName: "Pitch B", exposedInputs: [] } },
                { id: "Osc_2", type: "Cross-Oscillator", position: { x: 650, y: 100 }, params: { waveform: "sine", amplitude: 0.3, pan: 0.4, fmEnabled: true, fmAmount: 1, unisonVoices: 1, customName: "Voice B", exposedInputs: [] } },

                // Controls
                { id: "Param_Filter", type: "Parameter", position: { x: 600, y: 300 }, params: { value: 800, min: 100, max: 5000, customName: "Filter Freq", exposedInputs: [] } },
                { id: "Param_Reverb", type: "Parameter", position: { x: 800, y: 300 }, params: { value: 0.5, min: 0, max: 1, customName: "Reverb Mix", exposedInputs: [] } },
                { id: "Param_Volume", type: "Parameter", position: { x: 1000, y: 300 }, params: { value: 0.4, min: 0, max: 1, customName: "Master Vol", exposedInputs: [] } },

                // FX Chain
                { id: "Mixer", type: "Mixer", position: { x: 900, y: 0 }, params: { exposedInputs: [] } },
                { id: "Filter", type: "Filter", position: { x: 1100, y: 0 }, params: { type: "lowpass", q: 1, drive: 1, exposedInputs: ["cutoff"] } },
                { id: "Reverb", type: "Reverb", position: { x: 1300, y: 0 }, params: { decay: 0.8, size: 0.9, exposedInputs: ["mix"] } },
                { id: "Gain", type: "Gain", position: { x: 1500, y: 0 }, params: { exposedInputs: ["gain"] } },
            ],
            connections: [
                // Voice 1 Logic
                { id: "c1", fromNodeId: "Data_Source", fromOutput: "fromVelocity", toNodeId: "Math_Vel1", toInput: "val1", pathPoints: [] },
                { id: "c2", fromNodeId: "Math_Vel1", fromOutput: "out", toNodeId: "Octave_1", toInput: "customVelocity", pathPoints: [] },
                { id: "c3", fromNodeId: "Data_Source", fromOutput: "fromOrbitRadius", toNodeId: "Octave_1", toInput: "value", pathPoints: [] },
                { id: "c4", fromNodeId: "Octave_1", fromOutput: "out", toNodeId: "Osc_1", toInput: "frequency", pathPoints: [] },
                { id: "c5", fromNodeId: "Osc_1", fromOutput: "out", toNodeId: "Mixer", toInput: "in1", pathPoints: [] },

                // Voice 2 Logic
                { id: "c6", fromNodeId: "Data_Source", fromOutput: "toVelocity", toNodeId: "Math_Vel2", toInput: "val1", pathPoints: [] },
                { id: "c7", fromNodeId: "Math_Vel2", fromOutput: "out", toNodeId: "Octave_2", toInput: "customVelocity", pathPoints: [] },
                { id: "c8", fromNodeId: "Data_Source", fromOutput: "toOrbitRadius", toNodeId: "Octave_2", toInput: "value", pathPoints: [] },
                { id: "c9", fromNodeId: "Octave_2", fromOutput: "out", toNodeId: "Osc_2", toInput: "frequency", pathPoints: [] },
                { id: "c10", fromNodeId: "Osc_2", fromOutput: "out", toNodeId: "Mixer", toInput: "in2", pathPoints: [] },

                // Control Connections
                { id: "c11", fromNodeId: "Param_Filter", fromOutput: "out", toNodeId: "Filter", toInput: "cutoff", pathPoints: [] },
                { id: "c12", fromNodeId: "Param_Reverb", fromOutput: "out", toNodeId: "Reverb", toInput: "mix", pathPoints: [] },
                { id: "c13", fromNodeId: "Param_Volume", fromOutput: "out", toNodeId: "Gain", toInput: "gain", pathPoints: [] },

                // FX Chain
                { id: "c14", fromNodeId: "Mixer", fromOutput: "out", toNodeId: "Filter", toInput: "in", pathPoints: [] },
                { id: "c15", fromNodeId: "Filter", fromOutput: "out", toNodeId: "Reverb", toInput: "in", pathPoints: [] },
                { id: "c16", fromNodeId: "Reverb", fromOutput: "out", toNodeId: "Gain", toInput: "in", pathPoints: [] },
            ]
        }
    },
    {
        name: "Harmonic Resonator",
        description: "Pitched drone based on inverse orbit radius.",
        outputNodeId: "Gain", // Connects directly from the Gain node
        parameters: [
            { nodeId: "Param_Base", label: "Base Freq", min: 50, max: 1000, step: 1, defaultValue: 544, log: true },
            { nodeId: "Param_Reso", label: "Resonance", min: 0, max: 20, step: 0.1, defaultValue: 4.5 },
            { nodeId: "Param_Vol", label: "Volume", min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
        ],
        dataSources: [
            { nodeId: "Data_Source", label: "Planets" }
        ],
        graph: {
            nodes: [
                { id: "Data_Source", type: "DataSource", position: { x: 0, y: 0 }, params: { customName: "Planets", activeOutputs: ["fromOrbitRadius", "toOrbitRadius", "relativeDistance"], sourceType: 'connection', connectionIndex: 0, exposedInputs: [] } },
                { id: "Param_Base", type: "Parameter", position: { x: 0, y: 300 }, params: { value: 544, min: 50, max: 1000, customName: "Base Freq", exposedInputs: [] } },
                
                // Logic
                { id: "Math_Scale", type: "Math", position: { x: 200, y: 300 }, params: { operation: "scale", factor: 149.6, customName: "Tuning", exposedInputs: [] } },
                { id: "Math_Inv1", type: "Math", position: { x: 200, y: -100 }, params: { operation: "divide", val1: 1, exposedInputs: [] } },
                { id: "Math_Pitch1", type: "Math", position: { x: 400, y: -100 }, params: { operation: "scale", offset: 0, exposedInputs: [] } },
                { id: "Osc_1", type: "Oscillator", position: { x: 600, y: -100 }, params: { waveform: "sawtooth", amplitude: 0.5, pan: -0.5, exposedInputs: [] } }, // Explicit amplitude

                { id: "Math_Inv2", type: "Math", position: { x: 200, y: 100 }, params: { operation: "divide", val1: 1, exposedInputs: [] } },
                { id: "Math_Pitch2", type: "Math", position: { x: 400, y: 100 }, params: { operation: "scale", offset: 0, exposedInputs: [] } },
                { id: "Osc_2", type: "Oscillator", position: { x: 600, y: 100 }, params: { waveform: "square", amplitude: 0.5, pan: 0.5, exposedInputs: [] } }, // Explicit amplitude

                // Filter Logic
                { id: "Math_Filter", type: "Math", position: { x: 600, y: 300 }, params: { operation: "scale", factor: -8000, offset: 8200, exposedInputs: [] } },
                { id: "Param_Reso", type: "Parameter", position: { x: 800, y: 300 }, params: { value: 4.5, min: 0, max: 20, customName: "Reso", exposedInputs: [] } },

                // Chain
                { id: "Mixer", type: "Mixer", position: { x: 800, y: 0 }, params: { exposedInputs: [] } },
                { id: "Filter", type: "Filter", position: { x: 1000, y: 0 }, params: { type: "lowpass", drive: 1.5, exposedInputs: ["cutoff", "q"] } },
                { id: "Reverb", type: "Reverb", position: { x: 1200, y: 0 }, params: { decay: 0.9, size: 1.0, mix: 0.45, exposedInputs: [] } },
                { id: "Param_Vol", type: "Parameter", position: { x: 1200, y: 200 }, params: { value: 0.3, customName: "Volume", exposedInputs: [] } },
                { id: "Gain", type: "Gain", position: { x: 1400, y: 0 }, params: { exposedInputs: ["gain"] } },
            ],
            connections: [
                { id: "c1", fromNodeId: "Param_Base", fromOutput: "out", toNodeId: "Math_Scale", toInput: "val1", pathPoints: [] },
                { id: "c2", fromNodeId: "Math_Scale", fromOutput: "out", toNodeId: "Math_Pitch1", toInput: "factor", pathPoints: [] },
                { id: "c3", fromNodeId: "Math_Scale", fromOutput: "out", toNodeId: "Math_Pitch2", toInput: "factor", pathPoints: [] },
                { id: "c4", fromNodeId: "Data_Source", fromOutput: "fromOrbitRadius", toNodeId: "Math_Inv1", toInput: "val2", pathPoints: [] },
                { id: "c5", fromNodeId: "Math_Inv1", fromOutput: "out", toNodeId: "Math_Pitch1", toInput: "val1", pathPoints: [] },
                { id: "c6", fromNodeId: "Math_Pitch1", fromOutput: "out", toNodeId: "Osc_1", toInput: "frequency", pathPoints: [] },
                { id: "c7", fromNodeId: "Data_Source", fromOutput: "toOrbitRadius", toNodeId: "Math_Inv2", toInput: "val2", pathPoints: [] },
                { id: "c8", fromNodeId: "Math_Inv2", fromOutput: "out", toNodeId: "Math_Pitch2", toInput: "val1", pathPoints: [] },
                { id: "c9", fromNodeId: "Math_Pitch2", fromOutput: "out", toNodeId: "Osc_2", toInput: "frequency", pathPoints: [] },
                { id: "c10", fromNodeId: "Osc_1", fromOutput: "out", toNodeId: "Mixer", toInput: "in1", pathPoints: [] },
                { id: "c11", fromNodeId: "Osc_2", fromOutput: "out", toNodeId: "Mixer", toInput: "in2", pathPoints: [] },
                { id: "c12", fromNodeId: "Data_Source", fromOutput: "relativeDistance", toNodeId: "Math_Filter", toInput: "val1", pathPoints: [] },
                { id: "c13", fromNodeId: "Math_Filter", fromOutput: "out", toNodeId: "Filter", toInput: "cutoff", pathPoints: [] },
                { id: "c14", fromNodeId: "Param_Reso", fromOutput: "out", toNodeId: "Filter", toInput: "q", pathPoints: [] },
                { id: "c15", fromNodeId: "Mixer", fromOutput: "out", toNodeId: "Filter", toInput: "in", pathPoints: [] },
                { id: "c16", fromNodeId: "Filter", fromOutput: "out", toNodeId: "Reverb", toInput: "in", pathPoints: [] },
                { id: "c17", fromNodeId: "Reverb", fromOutput: "out", toNodeId: "Gain", toInput: "in", pathPoints: [] },
                { id: "c18", fromNodeId: "Param_Vol", fromOutput: "out", toNodeId: "Gain", toInput: "gain", pathPoints: [] },
            ]
        }
    }
];
