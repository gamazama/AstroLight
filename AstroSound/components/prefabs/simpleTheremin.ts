import type { NodePrefab } from '../../types';

export const simpleThereminPrefab: NodePrefab = {
    name: "Simple Theremin",
    description: "Connects planetary distance to oscillator pitch.",
    nodes: [
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Distance Sensor', displayColor: '#845EC2', activeOutputs: ['relativeDistance'], isBypassed: false }, relPos: { x: 0, y: 50 } },
        { type: 'Math', params: { operation: 'scale', factor: 880, offset: 110, val1: 0, val2: 0, customName: 'Pitch Scaler', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 0 } },
        { type: 'Oscillator', params: { waveform: 'sine', frequency: 440, amplitude: 0.5, customName: 'Theremin Voice', displayColor: '#6BCF7F', isBypassed: false }, relPos: { x: 500, y: 0 } },
        { type: 'Filter', params: { type: 'lowpass', cutoff: 2000, q: 1, customName: 'Tone Filter', displayColor: '#FFD93D', isBypassed: false }, relPos: { x: 750, y: 0 } },
        { type: 'Pan', params: { pan: 0, customName: 'Panner', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 1000, y: 0 } },
        { type: 'Output', params: { volume: 0.5, customName: '', displayColor: '#C34A36', isBypassed: false }, relPos: { x: 1250, y: 0 } }
    ],
    connections: [
        { from: 0, fromOutput: 'relativeDistance', to: 1, toInput: 'val1' },
        { from: 1, fromOutput: 'out', to: 2, toInput: 'frequency' },
        { from: 2, fromOutput: 'out', to: 3, toInput: 'in' },
        { from: 3, fromOutput: 'out', to: 4, toInput: 'in' },
        { from: 4, fromOutput: 'out', to: 5, toInput: 'in' },
    ]
};