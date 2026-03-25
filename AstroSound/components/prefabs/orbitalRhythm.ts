import type { NodePrefab } from '../../types';

export const orbitalRhythmPrefab: NodePrefab = {
    name: "Orbital Rhythm",
    description: "Uses orbit lengths to create rhythmic pulses for volume and filter cutoff.",
    nodes: [
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Orbital Data', displayColor: '#845EC2', activeOutputs: ['fromOrbitLength', 'toOrbitLength'], isBypassed: false }, relPos: { x: 0, y: 200 } },
        { type: 'Math', params: { operation: 'scale', factor: 0.0001, offset: 0.2, val1: 0, val2: 0, customName: 'From Rhythm', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 100 } },
        { type: 'Math', params: { operation: 'scale', factor: 0.00005, offset: 0.3, val1: 0, val2: 0, customName: 'To Rhythm', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 300 } },
        { type: 'LFO', params: { waveform: 'sine', frequency: 2, amplitude: 1, customName: 'Filter LFO', displayColor: '#FF6B6B', isBypassed: false }, relPos: { x: 500, y: 100 } },
        { type: 'LFO', params: { waveform: 'sine', frequency: 1, amplitude: 0.8, customName: 'Volume LFO', displayColor: '#FF9E7D', isBypassed: false }, relPos: { x: 500, y: 300 } },
        { type: 'Math', params: { operation: 'scale', factor: 1500, offset: 1200, val1: 0, val2: 0, customName: 'Filter Freq', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 750, y: 100 } },
        { type: 'Math', params: { operation: 'scale', factor: 0.8, offset: 0.2, val1: 0, val2: 0, customName: 'Volume Amt', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 750, y: 300 } },
        { type: 'Oscillator', params: { waveform: 'sawtooth', frequency: 220, amplitude: 0.4, customName: 'Main Voice', displayColor: '#6BCF7F', isBypassed: false }, relPos: { x: 250, y: 0 } },
        { type: 'Filter', params: { type: 'lowpass', cutoff: 1200, q: 3, drive: 3, customName: 'Rhythm Filter', displayColor: '#FFD93D', isBypassed: false }, relPos: { x: 500, y: 0 } },
        { type: 'Gain', params: { gain: 1, customName: 'VCA', displayColor: '#5C7CFA', isBypassed: false }, relPos: { x: 750, y: 0 } },
        { type: 'Pan', params: { pan: 0, customName: 'Panner', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 1000, y: 0 } },
        { type: 'Output', params: { volume: 0.4, customName: '', displayColor: '#C34A36', isBypassed: false }, relPos: { x: 1250, y: 0 } }
    ],
    connections: [
        { from: 0, fromOutput: 'fromOrbitLength', to: 1, toInput: 'val1' },
        { from: 1, fromOutput: 'out', to: 3, toInput: 'frequency' },
        { from: 3, fromOutput: 'out', to: 5, toInput: 'val1' },
        { from: 5, fromOutput: 'out', to: 8, toInput: 'cutoff' },
        { from: 0, fromOutput: 'toOrbitLength', to: 2, toInput: 'val1' },
        { from: 2, fromOutput: 'out', to: 4, toInput: 'frequency' },
        { from: 4, fromOutput: 'out', to: 6, toInput: 'val1' },
        { from: 6, fromOutput: 'out', to: 9, toInput: 'gain' },
        { from: 7, fromOutput: 'out', to: 8, toInput: 'in' },
        { from: 8, fromOutput: 'out', to: 9, toInput: 'in' },
        { from: 9, fromOutput: 'out', to: 10, toInput: 'in' },
        { from: 10, fromOutput: 'out', to: 11, toInput: 'in' }
    ]
};