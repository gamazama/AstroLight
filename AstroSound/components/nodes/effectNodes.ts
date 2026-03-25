
import type { SoundNodeType } from '../../types';

export const effectNodes: SoundNodeType[] = [
    {
        type: 'Filter',
        label: 'Filter',
        category: 'Effect',
        width: 280,
        inputs: [
            { name: 'in', label: 'In', type: 'audio' },
        ],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: [
            {
                name: 'type',
                label: 'Type',
                type: 'select',
                options: [
                    { value: 'lowpass', label: 'Lowpass' },
                    { value: 'highpass', label: 'Highpass' },
                    { value: 'bandpass', label: 'Bandpass' },
                    { value: 'notch', label: 'Notch' },
                    { value: 'peaking', label: 'Peaking' },
                    { value: 'lowshelf', label: 'Lowshelf' },
                    { value: 'highshelf', label: 'Highshelf' },
                ],
                defaultValue: 'lowpass',
            },
            {
                name: 'cutoff',
                label: 'Frequency',
                type: 'slider',
                min: 20,
                max: 10000,
                step: 1,
                log: true,
                defaultValue: 8000,
                modulatable: true,
            },
            {
                name: 'q',
                label: 'Resonance',
                type: 'slider',
                min: 0.1,
                max: 30,
                step: 0.1,
                log: true,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'gain',
                label: 'Gain (dB)',
                type: 'slider',
                min: -24,
                max: 24,
                step: 0.1,
                defaultValue: 0,
                modulatable: true,
            },
            {
                name: 'drive',
                label: 'Drive',
                type: 'slider',
                min: 1, max: 20, step: 0.1, log: true, defaultValue: 1, modulatable: true
            },
            {
                name: 'slope',
                label: 'Slope',
                type: 'select',
                options: [{value: '12db', label: '12 dB/oct'}, {value: '24db', label: '24 dB/oct'}],
                defaultValue: '12db',
            },
            {
                name: 'lfoAmount',
                label: 'LFO Amount',
                type: 'slider',
                min: 0, max: 1, step: 0.01, defaultValue: 0, modulatable: true
            },
            {
                name: 'lfoShape',
                label: 'LFO Shape',
                type: 'select',
                options: [ { value: 'sine', label: 'Sine' }, { value: 'triangle', label: 'Triangle' }, { value: 'sawtooth', label: 'Sawtooth' }, { value: 'square', label: 'Square' }, { value: 'random', label: 'S&H' } ],
                defaultValue: 'sine'
            },
            {
                name: 'lfoRate',
                label: 'LFO Rate',
                type: 'slider',
                min: 0.01, max: 30, step: 0.01, log: true, defaultValue: 1, modulatable: true
            },
            {
                name: 'lfoPhase',
                label: 'LFO Phase',
                type: 'slider',
                min: 0, max: 360, step: 1, defaultValue: 0, modulatable: true
            }
        ]
    },
    {
        type: 'Delay',
        label: 'Delay',
        category: 'Effect',
        width: 208,
        inputs: [
            { name: 'in', label: 'In', type: 'audio' },
        ],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: [
            {
                name: 'time',
                label: 'Time (s)',
                type: 'slider',
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: 0.5,
                modulatable: true,
            },
            {
                name: 'feedback',
                label: 'Feedback',
                type: 'slider',
                min: 0,
                max: 0.95,
                step: 0.01,
                defaultValue: 0.5,
                modulatable: true,
            },
            {
                name: 'mix',
                label: 'Mix (Wet/Dry)',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.5,
                modulatable: true,
            },
        ]
    },
    {
        type: 'Reverb',
        label: 'Reverb',
        category: 'Effect',
        width: 208,
        inputs: [ { name: 'in', label: 'In', type: 'audio' } ],
        outputs: [ { name: 'out', label: 'Out', type: 'audio' } ],
        parameters: [
            {
                name: 'preset',
                label: 'Preset',
                type: 'select',
                options: [
                    { value: 'custom', label: 'Custom' },
                    { value: 'small_room', label: 'Small Room' },
                    { value: 'hall', label: 'Hall' },
                    { value: 'space_ambient', label: 'Space/Ambient' },
                ],
                defaultValue: 'custom',
            },
            { name: 'inputGain', label: 'Input Gain', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 1.0, modulatable: true },
            { name: 'preDelay', label: 'Pre-Delay (s)', type: 'slider', min: 0, max: 0.5, step: 0.001, defaultValue: 0.02, modulatable: true },
            { name: 'mix', label: 'Mix', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.25, modulatable: true },
            { name: 'decay', label: 'Decay', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.6, modulatable: true },
            { name: 'size', label: 'Size', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.9, modulatable: true },
            { name: 'damping', label: 'Damping', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.4, modulatable: true },
            { name: 'width', label: 'Stereo Width', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 1.0, modulatable: true },
        ]
    },
    {
        type: 'Waveshaper',
        label: 'Waveshaper',
        category: 'Effect',
        width: 208,
        inputs: [{ name: 'in', label: 'In', type: 'audio' }],
        outputs: [{ name: 'out', label: 'Out', type: 'audio' }],
        parameters: [
            {
                name: 'type',
                label: 'Type',
                type: 'select',
                options: [
                    { value: 'tanh', label: 'Soft Clip (tanh)' },
                    { value: 'atan', label: 'Soft Clip (atan)' },
                    { value: 'wavefolder', label: 'Wavefolder' },
                    { value: 'hard clip', label: 'Hard Clip' },
                ],
                defaultValue: 'tanh',
            },
            {
                name: 'drive',
                label: 'Drive',
                type: 'slider',
                min: 1,
                max: 50,
                step: 0.1,
                log: true,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'mix',
                label: 'Mix',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1,
                modulatable: true,
            },
            {
                name: 'tone',
                label: 'Tone',
                type: 'slider',
                min: 100,
                max: 10000,
                step: 1,
                log: true,
                defaultValue: 10000,
                modulatable: true,
            },
            {
                name: 'outputLevel',
                label: 'Output Level',
                type: 'slider',
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: 1,
                modulatable: true,
            },
        ]
    }
];
