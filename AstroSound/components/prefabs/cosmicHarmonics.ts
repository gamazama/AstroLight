import type { NodePrefab } from '../../types';

export const cosmicHarmonicsPrefab: NodePrefab = {
    name: "Cosmic Harmonics",
    description: "An advanced drone generator. Pitch is derived from inverse orbit radii, with stereo-panned harmonics. Distance controls filter brightness.",
    nodes: [
        // --- DATA & PARAMS ---
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Planetary Data', displayColor: '#845EC2', activeOutputs: ['fromOrbitRadius', 'relativeDistance'] }, relPos: { x: 0, y: 150 } }, // 0
        { type: 'Parameter', params: { value: 0.3, min: 0, max: 1, step: 0.01, defaultValue: 0.3, customName: 'Volume' }, relPos: { x: 250, y: 500 } }, // 1
        { type: 'Parameter', params: { value: 200, min: 20, max: 10000, step: 1, defaultValue: 200, log: true, customName: 'Filter Freq' }, relPos: { x: 750, y: 300 } }, // 2
        { type: 'Parameter', params: { value: 2, min: 0.1, max: 30, step: 0.1, defaultValue: 2, log: true, customName: 'Filter Reso' }, relPos: { x: 1000, y: 300 } }, // 3
        { type: 'Parameter', params: { value: 0.4, min: 0, max: 1, step: 0.01, defaultValue: 0.4, customName: 'Reverb Mix' }, relPos: { x: 1250, y: 300 } }, // 4

        // --- PITCH ---
        { type: 'Math', params: { operation: 'divide', val1: 1, customName: 'Inv Radius', displayColor: '#45B7D1' }, relPos: { x: 250, y: 150 } }, // 5
        { type: 'Math', params: { operation: 'scale', factor: 48300, offset: 47, customName: 'Pitch Scaler', displayColor: '#45B7D1' }, relPos: { x: 500, y: 150 } }, // 6

        // --- OSCILLATOR ---
        { type: 'Oscillator', params: { waveform: 'sawtooth' }, relPos: { x: 750, y: 150 } }, // 7

        // --- FILTER ---
        { type: 'Math', params: { operation: 'scale', factor: 5000, customName: 'Filter Control', displayColor: '#FFD93D' }, relPos: { x: 500, y: 300 } }, // 8
        { type: 'Filter', params: { type: 'lowpass', drive: 1.2 }, relPos: { x: 1000, y: 150 } }, // 9
        
        // --- FX & OUTPUT ---
        { type: 'Reverb', params: { decay: 0.85, size: 0.9, damping: 0.2 }, relPos: { x: 1250, y: 150 } }, // 10
        { type: 'Output', params: {}, relPos: { x: 1500, y: 150 } }, // 11
    ],
    connections: [
        // Pitch Control
        { from: 0, fromOutput: 'fromOrbitRadius', to: 5, toInput: 'val2' },
        { from: 5, fromOutput: 'out', to: 6, toInput: 'val1' },
        { from: 6, fromOutput: 'out', to: 7, toInput: 'frequency' },
        
        // Volume Control
        { from: 1, fromOutput: 'out', to: 7, toInput: 'amplitude' },

        // Filter Control
        { from: 0, fromOutput: 'relativeDistance', to: 8, toInput: 'val1' },
        { from: 2, fromOutput: 'out', to: 8, toInput: 'offset' },
        { from: 8, fromOutput: 'out', to: 9, toInput: 'cutoff' },
        { from: 3, fromOutput: 'out', to: 9, toInput: 'q' },

        // FX Control
        { from: 4, fromOutput: 'out', to: 10, toInput: 'mix' },
        
        // Main Audio Path
        { from: 7, fromOutput: 'out', to: 9, toInput: 'in' },
        { from: 9, fromOutput: 'out', to: 10, toInput: 'in' },
        { from: 10, fromOutput: 'out', to: 11, toInput: 'in' },
    ]
};