import type { NodePrefab } from '../../types';

export const filterSweepPrefab: NodePrefab = {
    name: "Filter Sweep",
    description: "An LFO sweeps a filter's cutoff frequency, creating a classic 'wah' effect.",
    nodes: [
        { type: 'Oscillator', params: { waveform: 'sawtooth', frequency: 110, amplitude: 0.4, customName: 'Sweep Source', displayColor: '#6BCF7F', isBypassed: false }, relPos: { x: 0, y: 0 } },
        { type: 'LFO', params: { waveform: 'sine', frequency: 0.5, amplitude: 1, customName: 'Sweep LFO', displayColor: '#845EC2', isBypassed: false }, relPos: { x: 0, y: 150 } },
        { type: 'Math', params: { operation: 'scale', factor: 2500, offset: 2800, val1: 0, val2: 0, customName: 'Sweep Range', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 250, y: 150 } },
        { type: 'Filter', params: { type: 'lowpass', cutoff: 2200, q: 8, drive: 2.0, customName: 'Wah Filter', displayColor: '#FFD93D', isBypassed: false }, relPos: { x: 250, y: 0 } },
        { type: 'Pan', params: { pan: 0, customName: 'Panner', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 500, y: 0 } },
        { type: 'Output', params: { volume: 0.5, customName: '', displayColor: '#C34A36', isBypassed: false }, relPos: { x: 750, y: 0 } }
    ],
    connections: [
        { from: 0, fromOutput: 'out', to: 3, toInput: 'in' },
        { from: 1, fromOutput: 'out', to: 2, toInput: 'val1' },
        { from: 2, fromOutput: 'out', to: 3, toInput: 'cutoff' },
        { from: 3, fromOutput: 'out', to: 4, toInput: 'in' },
        { from: 4, fromOutput: 'out', to: 5, toInput: 'in' },
    ]
};