import type { NodePrefab } from '../../types';

export const etherealPadPrefab: NodePrefab = {
    name: "Ethereal Pad",
    description: "A classic dual-oscillator subtractive synth pad with PWM and filter modulation. Creates a rich, evolving, and spacious sound.",
    nodes: [
        // Oscillators & Mixer
        { type: 'Oscillator', params: { waveform: 'sawtooth', amplitude: 0.35, pan: -0.3, customName: 'Saw Voice' }, relPos: { x: 0, y: 0 } }, // 0
        { type: 'Oscillator', params: { waveform: 'square', amplitude: 0.25, pan: 0.3, customName: 'Square Voice' }, relPos: { x: 0, y: 150 } }, // 1
        { type: 'Mixer', params: { customName: 'Osc Mixer' }, relPos: { x: 250, y: 75 } }, // 2

        // PWM section for Square Voice
        { type: 'LFO', params: { waveform: 'triangle', frequency: 0.2, amplitude: 0.5, customName: 'PWM LFO' }, relPos: { x: -250, y: 300 } }, // 3

        // Filter section
        { type: 'LFO', params: { waveform: 'sine', frequency: 0.1, amplitude: 1, customName: 'Filter LFO' }, relPos: { x: 250, y: 300 } }, // 4
        { type: 'Math', params: { operation: 'scale', factor: 1500, offset: 2000, customName: 'Filter Sweep' }, relPos: { x: 500, y: 300 } }, // 5
        { type: 'Filter', params: { type: 'lowpass', q: 2.5, drive: 1.1, customName: 'Main Filter' }, relPos: { x: 500, y: 75 } }, // 6

        // Effects & Output
        { type: 'Delay', params: { time: 0.5, feedback: 0.6, mix: 0.35, customName: 'Echo' }, relPos: { x: 750, y: 75 } }, // 7
        { type: 'Reverb', params: { decay: 0.92, size: 1.0, mix: 0.45, damping: 0.2, customName: 'Space' }, relPos: { x: 1000, y: 75 } }, // 8
        { type: 'Output', params: {}, relPos: { x: 1250, y: 75 } } // 9
    ],
    connections: [
        // Audio Path
        { from: 0, fromOutput: 'out', to: 2, toInput: 'in1' },
        { from: 1, fromOutput: 'out', to: 2, toInput: 'in2' },
        { from: 2, fromOutput: 'out', to: 6, toInput: 'in' },
        { from: 6, fromOutput: 'out', to: 7, toInput: 'in' },
        { from: 7, fromOutput: 'out', to: 8, toInput: 'in' },
        { from: 8, fromOutput: 'out', to: 9, toInput: 'in' },

        // Modulation Paths
        { from: 3, fromOutput: 'out', to: 1, toInput: 'pulseWidth' }, // PWM
        { from: 4, fromOutput: 'out', to: 5, toInput: 'val1' }, // Filter LFO
        { from: 5, fromOutput: 'out', to: 6, toInput: 'cutoff' },
    ]
};