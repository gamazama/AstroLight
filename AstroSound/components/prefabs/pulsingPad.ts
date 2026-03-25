import type { NodePrefab } from '../../types';

export const pulsingPadPrefab: NodePrefab = {
    name: "Pulsing Pad",
    description: "An LFO modulates the volume of an oscillator to create a rhythmic pulse.",
    nodes: [
        { type: 'LFO', params: { waveform: 'sine', frequency: 2, amplitude: 0.5, customName: 'Pulse', displayColor: '#845EC2', isBypassed: false }, relPos: { x: 250, y: 150 } },
        { type: 'Math', params: { operation: 'scale', factor: 0.5, offset: 0.5, val1: 0, val2: 0, customName: 'Pulse Shaper', displayColor: '#45B7D1', isBypassed: false }, relPos: { x: 500, y: 150 } },
        { type: 'Oscillator', params: { waveform: 'sawtooth', frequency: 220, amplitude: 0.3, customName: 'Pad Voice', displayColor: '#6BCF7F', isBypassed: false }, relPos: { x: 0, y: 0 } },
        { type: 'Gain', params: { gain: 1, customName: 'VCA', displayColor: '#4ECDC4', isBypassed: false }, relPos: { x: 250, y: 0 } },
        { type: 'Pan', params: { pan: 0, customName: 'Panner', displayColor: '#5C7CFA', isBypassed: false }, relPos: { x: 500, y: 0 } },
        { type: 'Output', params: { volume: 0.5, customName: '', displayColor: '#C34A36', isBypassed: false }, relPos: { x: 750, y: 0 } }
    ],
    connections: [
        { from: 0, fromOutput: 'out', to: 1, toInput: 'val1' },
        { from: 1, fromOutput: 'out', to: 3, toInput: 'gain' },
        { from: 2, fromOutput: 'out', to: 3, toInput: 'in' },
        { from: 3, fromOutput: 'out', to: 4, toInput: 'in' },
        { from: 4, fromOutput: 'out', to: 5, toInput: 'in' },
    ]
};