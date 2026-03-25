import type { NodePrefab } from '../../types';

export const harmonicResonatorPrefab: NodePrefab = {
    name: "Harmonic Resonator",
    description: "A dual-voice stereo drone. Pitch is inversely scaled to orbit radius, with a tunable base frequency (defaulted to 544.4 Hz for Earth's orbit). Distance inversely controls filter cutoff.",
    nodes: [
        // --- DATA & PARAMS ---
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Planetary Data', activeOutputs: ['fromOrbitRadius', 'toOrbitRadius', 'relativeDistance'] }, relPos: { x: 0, y: 300 } }, // 0
        { type: 'Parameter', params: { value: 0.25, min: 0, max: 1, step: 0.01, defaultValue: 0.25, customName: 'Volume' }, relPos: { x: 250, y: 600 } }, // 1
        { type: 'Parameter', params: { value: 8200, min: 200, max: 15000, step: 1, defaultValue: 8200, log: true, customName: 'Filter Freq' }, relPos: { x: 1000, y: 500 } }, // 2
        { type: 'Parameter', params: { value: 4.5, min: 0.1, max: 20, step: 0.1, defaultValue: 4.5, log: true, customName: 'Filter Reso' }, relPos: { x: 1250, y: 500 } }, // 3
        { type: 'Parameter', params: { value: 0.45, min: 0, max: 1, step: 0.01, defaultValue: 0.45, customName: 'Reverb Mix' }, relPos: { x: 1500, y: 500 } }, // 4
        { type: 'Parameter', params: { value: 544.4, min: 20, max: 2000, step: 0.1, defaultValue: 544.4, log: true, customName: 'Base Frequency' }, relPos: { x: 250, y: 450 } }, // 5 (NEW)
        
        // --- TUNING & PITCH ---
        { type: 'Math', params: { operation: 'scale', factor: 149.6, offset: 0, customName: 'Tuning Scaler' }, relPos: { x: 500, y: 450 } }, // 6 (NEW)
        { type: 'Math', params: { operation: 'divide', val1: 1, customName: 'Inv From Radius' }, relPos: { x: 250, y: 0 } }, // 7
        { type: 'Math', params: { operation: 'scale', offset: 0, customName: 'Scale From Pitch' }, relPos: { x: 500, y: 0 } }, // 8
        { type: 'Oscillator', params: { waveform: 'sawtooth', pan: -0.6, customName: 'From Voice' }, relPos: { x: 750, y: 0 } }, // 9
        { type: 'Math', params: { operation: 'divide', val1: 1, customName: 'Inv To Radius' }, relPos: { x: 250, y: 200 } }, // 10
        { type: 'Math', params: { operation: 'scale', offset: 0, customName: 'Scale To Pitch' }, relPos: { x: 500, y: 200 } }, // 11
        { type: 'Oscillator', params: { waveform: 'square', pan: 0.6, customName: 'To Voice' }, relPos: { x: 750, y: 200 } }, // 12

        // --- MIX & FILTER ---
        { type: 'Mixer', params: { customName: 'Voice Mixer' }, relPos: { x: 1000, y: 100 } }, // 13
        { type: 'Math', params: { operation: 'scale', factor: -8000, customName: 'Filter Distance Control' }, relPos: { x: 750, y: 350 } }, // 14
        { type: 'Filter', params: { type: 'lowpass', drive: 1.5 }, relPos: { x: 1250, y: 100 } }, // 15

        // --- FINAL OUTPUT ---
        { type: 'Reverb', params: { decay: 0.92, size: 1.0, damping: 0.2 }, relPos: { x: 1500, y: 100 } }, // 16
        { type: 'Output', params: {}, relPos: { x: 1750, y: 100 } }, // 17
    ],
    connections: [
        // Volume
        { from: 1, fromOutput: 'out', to: 9, toInput: 'amplitude' },
        { from: 1, fromOutput: 'out', to: 12, toInput: 'amplitude' },

        // Tuning
        { from: 5, fromOutput: 'out', to: 6, toInput: 'val1' },
        { from: 6, fromOutput: 'out', to: 8, toInput: 'factor' },
        { from: 6, fromOutput: 'out', to: 11, toInput: 'factor' },

        // Voice 1 Pitch
        { from: 0, fromOutput: 'fromOrbitRadius', to: 7, toInput: 'val2' },
        { from: 7, fromOutput: 'out', to: 8, toInput: 'val1' },
        { from: 8, fromOutput: 'out', to: 9, toInput: 'frequency' },

        // Voice 2 Pitch
        { from: 0, fromOutput: 'toOrbitRadius', to: 10, toInput: 'val2' },
        { from: 10, fromOutput: 'out', to: 11, toInput: 'val1' },
        { from: 11, fromOutput: 'out', to: 12, toInput: 'frequency' },

        // Audio Path to Mixer
        { from: 9, fromOutput: 'out', to: 13, toInput: 'in1' },
        { from: 12, fromOutput: 'out', to: 13, toInput: 'in2' },

        // Filter Controls
        { from: 0, fromOutput: 'relativeDistance', to: 14, toInput: 'val1' },
        { from: 2, fromOutput: 'out', to: 14, toInput: 'offset' },
        { from: 14, fromOutput: 'out', to: 15, toInput: 'cutoff' },
        { from: 3, fromOutput: 'out', to: 15, toInput: 'q' },
        
        // Reverb Control
        { from: 4, fromOutput: 'out', to: 16, toInput: 'mix' },

        // Final Audio Path
        { from: 13, fromOutput: 'out', to: 15, toInput: 'in' },
        { from: 15, fromOutput: 'out', to: 16, toInput: 'in' },
        { from: 16, fromOutput: 'out', to: 17, toInput: 'in' },
    ]
};