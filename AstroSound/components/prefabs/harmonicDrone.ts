import type { NodePrefab } from '../../types';

export const harmonicDronePrefab: NodePrefab = {
    name: "Harmonic Drone",
    description: "Creates a two-oscillator drone where the interval is set by the planets' orbital ratio.",
    nodes: [
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Cosmic Ratios', displayColor: '#845EC2', activeOutputs: ['synodicPeriod', 'orbitalRatio', 'relativeDistance'], isBypassed: false }, relPos: { x: 0, y: 150 } },
        { type: 'Math', params: { operation: 'scale', factor: 0.1, offset: 55, val1: 0, val2: 0, customName: 'Root Pitch', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 0 } },
        { type: 'Oscillator', params: { waveform: 'sine', frequency: 110, amplitude: 0.4, customName: 'Root', displayColor: '#6BCF7F', isBypassed: false }, relPos: { x: 500, y: 0 } },
        { type: 'Math', params: { operation: 'multiply', customName: 'Harmonizer', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 200 } },
        { type: 'Oscillator', params: { waveform: 'sine', frequency: 165, amplitude: 0.4, customName: 'Harmony', displayColor: '#9BDB69', isBypassed: false }, relPos: { x: 500, y: 200 } },
        { type: 'Pan', params: { pan: -0.6, customName: 'Pan Left', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 750, y: 0 } },
        { type: 'Pan', params: { pan: 0.6, customName: 'Pan Right', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 750, y: 200 } },
        { type: 'Mixer', params: { customName: 'Drone Mixer', displayColor: '#5C7CFA', isBypassed: false }, relPos: { x: 1000, y: 100 } },
        { type: 'Filter', params: { type: 'lowpass', cutoff: 300, q: 1.5, drive: 2.0, customName: 'Sub Filter', displayColor: '#FFD93D', isBypassed: false }, relPos: { x: 1250, y: 100 } },
        { type: 'Math', params: { operation: 'scale', factor: 500, offset: 200, val1: 0, val2: 0, customName: 'Filter Brightness', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 1000, y: 300 } },
        { type: 'Reverb', params: { decay: 0.8, size: 0.9, damping: 0.8, mix: 0.3 }, relPos: { x: 1400, y: 100 } },
        { type: 'Output', params: { volume: 0.4, customName: '', displayColor: '#C34A36', isBypassed: false }, relPos: { x: 1600, y: 100 } }
    ],
    connections: [
        { from: 0, fromOutput: 'synodicPeriod', to: 1, toInput: 'val1' },
        { from: 1, fromOutput: 'out', to: 2, toInput: 'frequency' },
        { from: 1, fromOutput: 'out', to: 3, toInput: 'val1' },
        { from: 0, fromOutput: 'orbitalRatio', to: 3, toInput: 'val2' },
        { from: 3, fromOutput: 'out', to: 4, toInput: 'frequency' },
        { from: 2, fromOutput: 'out', to: 5, toInput: 'in' },
        { from: 4, fromOutput: 'out', to: 6, toInput: 'in' },
        { from: 5, fromOutput: 'out', to: 7, toInput: 'in1' },
        { from: 6, fromOutput: 'out', to: 7, toInput: 'in2' },
        { from: 7, fromOutput: 'out', to: 8, toInput: 'in' },
        { from: 0, fromOutput: 'relativeDistance', to: 9, toInput: 'val1' },
        { from: 9, fromOutput: 'out', to: 8, toInput: 'cutoff' },
        { from: 8, fromOutput: 'out', to: 10, toInput: 'in' },
        { from: 10, fromOutput: 'out', to: 11, toInput: 'in' }
    ]
};