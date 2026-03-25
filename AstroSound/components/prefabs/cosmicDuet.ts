import type { NodePrefab } from '../../types';

export const cosmicDuetPrefab: NodePrefab = {
    name: "Cosmic Duet",
    description: "A two-oscillator harmony where pitch is inversely related to distance and the interval is controlled by the orbital ratio.",
    nodes: [
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Cosmic Data', displayColor: '#845EC2', activeOutputs: ['realtimeDistance', 'synodicPeriod', 'orbitalRatio'], isBypassed: false }, relPos: { x: 0, y: 150 } },
        { type: 'Math', params: { operation: 'scale', factor: -1, offset: 0, customName: 'Distance Inverter', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 0 } },
        { type: 'Math', params: { operation: 'add', customName: 'Pitch Base', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 500, y: 0 } },
        { type: 'Oscillator', params: { waveform: 'sine', frequency: 440, amplitude: 0.4, customName: 'Primary Voice', displayColor: '#6BCF7F', isBypassed: false }, relPos: { x: 750, y: 0 } },
        { type: 'Math', params: { operation: 'multiply', customName: 'Harmonizer', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 500, y: 200 } },
        { type: 'Oscillator', params: { waveform: 'sine', frequency: 440, amplitude: 0.4, customName: 'Harmonic Voice', displayColor: '#9BDB69', isBypassed: false }, relPos: { x: 750, y: 200 } },
        { type: 'Pan', params: { pan: -0.8, customName: 'Pan Left', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 1000, y: 0 } },
        { type: 'Pan', params: { pan: 0.8, customName: 'Pan Right', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 1000, y: 200 } },
        { type: 'Mixer', params: { customName: 'Duet Mixer', displayColor: '#5C7CFA', isBypassed: false }, relPos: { x: 1250, y: 100 } },
        { type: 'Filter', params: { type: 'lowpass', cutoff: 4000, q: 0.7, drive: 1.2 }, relPos: { x: 1350, y: 100 } }, // Added subtle warming filter
        { type: 'Output', params: { volume: 0.5, customName: '', displayColor: '#C34A36', isBypassed: false }, relPos: { x: 1500, y: 100 } }
    ],
    connections: [
        { from: 0, fromOutput: 'realtimeDistance', to: 1, toInput: 'val1' },
        { from: 0, fromOutput: 'synodicPeriod', to: 2, toInput: 'val2' },
        { from: 1, fromOutput: 'out', to: 2, toInput: 'val1' },
        { from: 2, fromOutput: 'out', to: 3, toInput: 'frequency' },
        { from: 2, fromOutput: 'out', to: 4, toInput: 'val1' },
        { from: 0, fromOutput: 'orbitalRatio', to: 4, toInput: 'val2' },
        { from: 4, fromOutput: 'out', to: 5, toInput: 'frequency' },
        { from: 3, fromOutput: 'out', to: 6, toInput: 'in' },
        { from: 5, fromOutput: 'out', to: 7, toInput: 'in' },
        { from: 6, fromOutput: 'out', to: 8, toInput: 'in1' },
        { from: 7, fromOutput: 'out', to: 8, toInput: 'in2' },
        { from: 8, fromOutput: 'out', to: 9, toInput: 'in' },
        { from: 9, fromOutput: 'out', to: 10, toInput: 'in' }
    ]
};