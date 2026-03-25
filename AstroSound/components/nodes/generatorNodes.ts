
import type { SoundNodeType } from '../../types';

export const generatorNodes: SoundNodeType[] = [
    {
        type: 'Oscillator',
        label: 'Oscillator',
        category: 'Generator',
        width: 208,
        inputs: [],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: [
            {
                name: 'waveform',
                label: 'Waveform',
                type: 'select',
                options: [
                    { value: 'sine', label: 'Sine' },
                    { value: 'square', label: 'Square' },
                    { value: 'sawtooth', label: 'Sawtooth' },
                    { value: 'triangle', label: 'Triangle' },
                    { value: 'noise', label: 'Noise' },
                ],
                defaultValue: 'sine',
            },
            {
                name: 'frequency',
                label: 'Frequency',
                type: 'slider',
                min: 20,
                max: 10000,
                step: 1,
                log: true,
                defaultValue: 440,
                modulatable: true,
            },
            {
                name: 'amplitude',
                label: 'Amplitude',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.5,
                modulatable: true,
            },
            {
                name: 'pulseWidth',
                label: 'Pulse Width',
                type: 'slider',
                min: 0.01,
                max: 0.99,
                step: 0.01,
                defaultValue: 0.5,
                modulatable: true,
            },
            {
                name: 'pan',
                label: 'Pan',
                type: 'slider',
                min: -1,
                max: 1,
                step: 0.01,
                defaultValue: 0,
                modulatable: true,
            },
        ]
    },
    {
        type: 'Curve',
        label: 'Curve',
        category: 'Generator',
        width: 280,
        height: 240,
        inputs: [],
        outputs: [
            { name: 'value', label: 'Value', type: 'value' },
            { name: 'audio', label: 'Audio', type: 'audio' },
        ],
        parameters: [
            {
                name: 'frequency',
                label: 'Rate / Freq',
                type: 'slider',
                min: 0.01,
                max: 1000,
                step: 0.01,
                log: true,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'amplitude',
                label: 'Amplitude',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'interpolation',
                label: 'Mode',
                type: 'select',
                options: [
                    { value: 'linear', label: 'Linear' },
                    { value: 'step', label: 'Step' },
                    { value: 'smooth', label: 'Smooth (Cosine)' }
                ],
                defaultValue: 'linear',
            },
            {
                name: 'points',
                label: 'Points',
                type: 'text', // Hidden/managed by Viz
                defaultValue: [{x:0, y:0}, {x:0.25, y:1}, {x:0.75, y:-1}, {x:1, y:0}],
            }
        ]
    },
    {
        type: 'Cross-Oscillator',
        label: 'Cross-Oscillator',
        category: 'Generator',
        width: 280,
        inputs: [],
        outputs: [{ name: 'out', label: 'Out', type: 'audio' }],
        parameters: [
            { name: 'preset', label: 'Preset', type: 'select', options: [ { value: 'custom', label: 'Custom' }, { value: 'warm_saw', label: 'Warm Saw' }, { value: 'supersaw_lead', label: 'Supersaw Lead' }, { value: 'hard_sync_bass', label: 'Hard Sync Bass' }, { value: 'fm_bell', label: 'FM Bell' }, { value: 'rich_pad', label: 'Rich Pad' } ], defaultValue: 'warm_saw' },
            { name: 'waveform', label: 'Waveform', type: 'select', options: [ { value: 'sawtooth', label: 'Sawtooth' }, { value: 'square', label: 'Square' }, { value: 'sine', label: 'Sine' }, { value: 'triangle', label: 'Triangle' }], defaultValue: 'sawtooth' },
            { name: 'frequency', label: 'Frequency', type: 'slider', min: 20, max: 10000, step: 1, log: true, defaultValue: 440, modulatable: true },
            { name: 'detune', label: 'Detune (cents)', type: 'slider', min: -100, max: 100, step: 0.1, defaultValue: 0, modulatable: true },
            { name: 'amplitude', label: 'Amplitude', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.5, modulatable: true },
            { name: 'pan', label: 'Pan', type: 'slider', min: -1, max: 1, step: 0.01, defaultValue: 0, modulatable: true },
            // Unison
            { name: 'unisonVoices', label: 'Unison Voices', type: 'slider', min: 1, max: 16, step: 1, defaultValue: 1, modulatable: true },
            { name: 'unisonSpread', label: 'Unison Spread', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.1, modulatable: true },
            // Hard Sync
            { name: 'syncEnabled', label: 'Hard Sync', type: 'select', defaultValue: false },
            { name: 'syncRatio', label: 'Sync Ratio', type: 'slider', min: 0.1, max: 20, step: 0.01, log: true, defaultValue: 2, modulatable: true },
            // FM
            { name: 'fmEnabled', label: 'FM Enabled', type: 'select', defaultValue: false },
            { name: 'fmWaveform', label: 'FM Waveform', type: 'select', options: [ { value: 'sine', label: 'Sine' }, { value: 'square', label: 'Square' }, { value: 'sawtooth', label: 'Sawtooth' }, { value: 'triangle', label: 'Triangle' }], defaultValue: 'sine' },
            { name: 'fmRatio', label: 'FM Ratio', type: 'slider', min: 0.1, max: 20, step: 0.01, log: true, defaultValue: 1, modulatable: true },
            { name: 'fmAmount', label: 'FM Amount', type: 'slider', min: 0, max: 1000, step: 1, log: true, defaultValue: 0, modulatable: true },
            // Sub
            { name: 'subOctave', label: 'Sub Oscillator', type: 'select', options: [{value: 'off', label: 'Off'}, {value: '-1', label: '-1 Octave'}, {value: '-2', label: '-2 Octave'}], defaultValue: 'off' },
            { name: 'subLevel', label: 'Sub Level', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0, modulatable: true }
        ]
    },
    {
        type: 'LFO',
        label: 'LFO',
        category: 'Generator',
        width: 208,
        inputs: [],
        outputs: [
            { name: 'out', label: 'Out', type: 'value' },
        ],
        parameters: [
            {
                name: 'waveform',
                label: 'Waveform',
                type: 'select',
                options: [
                    { value: 'sine', label: 'Sine' },
                    { value: 'square', label: 'Square' },
                    { value: 'sawtooth', label: 'Sawtooth' },
                    { value: 'triangle', label: 'Triangle' },
                    { value: 'noise', label: 'S&H / Noise' },
                ],
                defaultValue: 'sine',
            },
            {
                name: 'frequency',
                label: 'Frequency',
                type: 'slider',
                min: 0.01,
                max: 50,
                step: 0.01,
                log: true,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'amplitude',
                label: 'Amplitude',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'pulseWidth',
                label: 'Pulse Width',
                type: 'slider',
                min: 0.01,
                max: 0.99,
                step: 0.01,
                defaultValue: 0.5,
                modulatable: true,
            },
        ]
    }
];
