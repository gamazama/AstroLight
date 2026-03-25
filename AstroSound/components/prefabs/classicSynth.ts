import type { NodePrefab } from '../../types';

export const classicSynthPrefab: NodePrefab = {
    name: "Classic Synth Pad",
    description: "A dual-detuned sawtooth synth with LFO filter sweep and spatial effects, responsive to simulation data.",
    nodes: [
        // Data and Pitch Control
        { type: 'DataSource', params: { connectionIndex: 0, customName: 'Simulation Data', activeOutputs: ['relativeDistance'] }, relPos: { x: 0, y: 300 } }, // 0
        { type: 'Math', params: { operation: 'scale', factor: 440, offset: 110, customName: 'Pitch Scaler' }, relPos: { x: 250, y: 0 } }, // 1
        { type: 'Math', params: { operation: 'multiply', val2: 0.994, customName: 'Detune (-10c)' }, relPos: { x: 500, y: -75 } }, // 2
        { type: 'Math', params: { operation: 'multiply', val2: 1.006, customName: 'Detune (+10c)' }, relPos: { x: 500, y: 75 } }, // 3

        // Oscillators & Mixer
        { type: 'Oscillator', params: { waveform: 'sawtooth', amplitude: 0.35, pan: -0.3, customName: 'Osc 1' }, relPos: { x: 750, y: -75 } }, // 4
        { type: 'Oscillator', params: { waveform: 'sawtooth', amplitude: 0.35, pan: 0.3, customName: 'Osc 2' }, relPos: { x: 750, y: 75 } }, // 5
        { type: 'Mixer', params: {}, relPos: { x: 1000, y: 0 } }, // 6

        // Filter Modulation
        { type: 'LFO', params: { waveform: 'sine', frequency: 0.15, amplitude: 0.8, customName: 'Filter LFO' }, relPos: { x: 500, y: 450 } }, // 7
        { type: 'Math', params: { operation: 'multiply', val2: 1500, customName: 'LFO Scale' }, relPos: { x: 750, y: 450 } }, // 8
        { type: 'Math', params: { operation: 'scale', factor: 3000, offset: 0, customName: 'Data Scale' }, relPos: { x: 250, y: 450 } }, // 9
        { type: 'Static Source', params: { mode: 'value', value: 2500, customName: 'Base Cutoff' }, relPos: { x: 750, y: 600 } }, // 10
        { type: 'Math', params: { operation: 'add', customName: 'Combine Mods' }, relPos: { x: 1000, y: 450 } }, // 11
        { type: 'Math', params: { operation: 'add', customName: 'Add Base Freq' }, relPos: { x: 1250, y: 525 } }, // 12

        // Main Audio Path
        { type: 'Filter', params: { type: 'lowpass', q: 2.0, drive: 2.0 }, relPos: { x: 1250, y: 0 } }, // 13
        { type: 'Delay', params: { time: 0.4, feedback: 0.5, mix: 0.3 }, relPos: { x: 1500, y: 0 } }, // 14
        { type: 'Reverb', params: { decay: 0.6, mix: 0.4, damping: 0.6, size: 0.8 }, relPos: { x: 1750, y: 0 } }, // 15
        { type: 'Gain', params: { gain: 0.8 }, relPos: { x: 2000, y: 0 } }, // 16
        { type: 'Output', params: {}, relPos: { x: 2250, y: 0 } }, // 17
    ],
    connections: [
        // Pitch Path
        { from: 0, fromOutput: 'relativeDistance', to: 1, toInput: 'val1' }, // Data -> Pitch Scaler
        { from: 1, fromOutput: 'out', to: 2, toInput: 'val1' }, // Scaled Pitch -> Detune 1
        { from: 1, fromOutput: 'out', to: 3, toInput: 'val1' }, // Scaled Pitch -> Detune 2
        { from: 2, fromOutput: 'out', to: 4, toInput: 'frequency' }, // Detuned -> Osc 1
        { from: 3, fromOutput: 'out', to: 5, toInput: 'frequency' }, // Detuned -> Osc 2

        // Audio Path
        { from: 4, fromOutput: 'out', to: 6, toInput: 'in1' }, // Osc 1 -> Mixer
        { from: 5, fromOutput: 'out', to: 6, toInput: 'in2' }, // Osc 2 -> Mixer
        { from: 6, fromOutput: 'out', to: 13, toInput: 'in' }, // Mixer -> Filter
        { from: 13, fromOutput: 'out', to: 14, toInput: 'in' }, // Filter -> Delay
        { from: 14, fromOutput: 'out', to: 15, toInput: 'in' }, // Delay -> Reverb
        { from: 15, fromOutput: 'out', to: 16, toInput: 'in' }, // Reverb -> Gain
        { from: 16, fromOutput: 'out', to: 17, toInput: 'in' }, // Gain -> Master Out

        // Filter Modulation Path
        { from: 7, fromOutput: 'out', to: 8, toInput: 'val1' }, // LFO -> LFO Scale
        { from: 0, fromOutput: 'relativeDistance', to: 9, toInput: 'val1' }, // Data -> Data Scale
        { from: 8, fromOutput: 'out', to: 11, toInput: 'val1' }, // LFO Scaled -> Combine Mods
        { from: 9, fromOutput: 'out', to: 11, toInput: 'val2' }, // Data Scaled -> Combine Mods
        { from: 11, fromOutput: 'out', to: 12, toInput: 'val1' }, // Combined Mods -> Add Base
        { from: 10, fromOutput: 'out', to: 12, toInput: 'val2' }, // Base Cutoff -> Add Base
        { from: 12, fromOutput: 'out', to: 13, toInput: 'cutoff' }, // Final Cutoff -> Filter
    ]
};