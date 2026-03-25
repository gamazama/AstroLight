
import type { SoundNodeType } from '../../types';

export const utilityNodes: SoundNodeType[] = [
    {
        type: 'Scaffold',
        label: 'Scaffold',
        category: 'Utility',
        inputs: [],
        outputs: [],
        parameters: [
            { name: 'width', label: 'Width', type: 'number', defaultValue: 400 },
            { name: 'height', label: 'Height', type: 'number', defaultValue: 300 },
        ],
    },
    {
        type: 'Cosmic Octaver',
        label: 'Cosmic Octaver',
        category: 'Utility',
        width: 260, // Wider to prevent layout shifts
        inputs: [], // No fixed inputs, uses modulatable parameters
        outputs: [
            { name: 'out', label: 'Frequency', type: 'value' },
            { name: 'octavesApplied', label: 'Octaves Applied', type: 'value' },
            { name: 'fundamental', label: 'Fundamental Freq', type: 'value' },
        ],
        parameters: [
            {
                name: 'value',
                label: 'Input Value',
                type: 'slider',
                min: 0.001,
                max: 100000,
                step: 0.001,
                log: true,
                defaultValue: 29.53, // Synodic Moon period
                modulatable: true,
            },
            {
                name: 'inputType',
                label: 'Input Type',
                type: 'select',
                options: [
                    { value: 'days', label: 'Period (Days)' },
                    { value: 'distance', label: 'Distance (Wavelength)' },
                ],
                defaultValue: 'days',
            },
            {
                name: 'distanceUnit',
                label: 'Distance Unit',
                type: 'select',
                options: [
                    { value: 'm', label: 'Meters (m)' },
                    { value: 'km', label: 'Kilometers (km)' },
                    { value: 'Mkm', label: 'Million km (Mkm)' },
                ],
                defaultValue: 'Mkm', // Default to Mkm to match DataSource outputs
            },
            {
                name: 'speedConstant',
                label: 'Speed for Wavelength',
                type: 'select',
                options: [
                    { value: 'light', label: 'Speed of Light' },
                    { value: 'sound', label: 'Speed of Sound' },
                    { value: 'custom', label: 'Custom / Input' },
                ],
                defaultValue: 'light',
            },
            {
                name: 'customVelocity',
                label: 'Velocity (m/s)',
                type: 'number',
                defaultValue: 343,
                min: 0,
                max: 1000000000, // 1 Billion to support high velocities
                step: 0.1,
                modulatable: true,
            },
            {
                name: 'octaveShift',
                label: 'Octave Shift',
                type: 'slider',
                min: -24,
                max: 24,
                step: 1,
                defaultValue: 0,
                modulatable: true,
            },
        ]
    },
    {
        type: 'Math',
        label: 'Math',
        category: 'Utility',
        width: 208,
        inputs: [],
        outputs: [
            { name: 'out', label: 'Out', type: 'value' },
        ],
        parameters: [
            {
                name: 'operation',
                label: 'Operation',
                type: 'select',
                options: [
                    { value: 'add', label: 'Add' },
                    { value: 'subtract', label: 'Subtract' },
                    { value: 'multiply', label: 'Multiply' },
                    { value: 'divide', label: 'Divide' },
                    { value: 'scale', label: 'Scale' },
                    { value: 'abs', label: 'Absolute Value' },
                    { value: 'min', label: 'Min' },
                    { value: 'max', label: 'Max' },
                    { value: 'pow', label: 'Power' },
                ],
                defaultValue: 'add',
            },
            { name: 'val1', label: 'Value 1', type: 'slider', defaultValue: 0, min: -10000, max: 10000, hardMin: -1e18, hardMax: 1e18, step: 1, modulatable: true },
            { name: 'val2', label: 'Value 2', type: 'slider', defaultValue: 0, min: -10000, max: 10000, hardMin: -1e18, hardMax: 1e18, step: 1, modulatable: true },
            { name: 'factor', label: 'Scale Factor', type: 'slider', defaultValue: 1, min: -10000, max: 10000, hardMin: -1e18, hardMax: 1e18, step: 1, modulatable: true },
            { name: 'offset', label: 'Offset', type: 'slider', defaultValue: 0, min: -10000, max: 10000, hardMin: -1e18, hardMax: 1e18, step: 1, modulatable: true },
        ]
    },
    {
        type: 'Gain',
        label: 'Gain',
        category: 'Utility',
        width: 208,
        inputs: [
            { name: 'in', label: 'In', type: 'audio' },
        ],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: [
            {
                name: 'gain',
                label: 'Gain',
                type: 'slider',
                min: 0,
                max: 2,
                step: 0.01,
                defaultValue: 1,
                modulatable: true,
            }
        ]
    },
    {
        type: 'Pan',
        label: 'Panner',
        category: 'Utility',
        width: 208,
        inputs: [
            { name: 'in', label: 'In', type: 'audio' },
        ],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: [
            {
                name: 'pan',
                label: 'Pan',
                type: 'slider',
                min: -1,
                max: 1,
                step: 0.01,
                defaultValue: 0,
                modulatable: true,
            }
        ]
    },
    {
        type: 'Mixer',
        label: 'Mixer',
        category: 'Utility',
        width: 208,
        inputs: [
            { name: 'in1', label: 'In 1', type: 'audio' },
            { name: 'in2', label: 'In 2', type: 'audio' },
            { name: 'in3', label: 'In 3', type: 'audio' },
            { name: 'in4', label: 'In 4', type: 'audio' },
        ],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: []
    },
    {
        type: 'Parameter',
        label: 'Parameter',
        category: 'Utility',
        width: 208,
        inputs: [],
        outputs: [
            { name: 'out', label: 'Out', type: 'value' },
        ],
        parameters: [
            {
                name: 'value',
                label: 'Value',
                type: 'slider',
                // These are now just placeholders, the AttributePanel will override them
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.5,
            },
            {
                name: 'min',
                label: 'Min Value',
                type: 'number',
                defaultValue: 0,
            },
            {
                name: 'max',
                label: 'Max Value',
                type: 'number',
                defaultValue: 1,
            },
            {
                name: 'step',
                label: 'Step Amount',
                type: 'number',
                defaultValue: 0.01,
            },
            {
                name: 'defaultValue',
                label: 'Default Value',
                type: 'number',
                defaultValue: 0.5
            }
        ]
    },
    {
        type: 'Audio Rerouter',
        label: 'Rerouter (Audio)',
        category: 'Utility',
        inputs: [{ name: 'in', label: 'In', type: 'audio' }],
        outputs: [{ name: 'out', label: 'Out', type: 'audio' }],
        parameters: []
    },
    {
        type: 'Value Rerouter',
        label: 'Rerouter (Value)',
        category: 'Utility',
        inputs: [{ name: 'in', label: 'In', type: 'value' }],
        outputs: [{ name: 'out', label: 'Out', type: 'value' }],
        parameters: []
    },
    {
        type: 'Oscilloscope',
        label: 'Oscilloscope',
        category: 'Utility',
        width: 280, // Custom width for the visualization
        inputs: [{ name: 'in', label: 'In', type: 'audio' }],
        outputs: [],
        parameters: [
            { name: 'timeScale', label: 'Time Scale', type: 'slider', min: 1, max: 100, step: 0.1, log: true, defaultValue: 10 },
            {
                name: 'autoTrigger',
                label: 'Auto Trigger',
                type: 'select',
                defaultValue: true
            },
            { name: 'trigger', label: 'Trigger Level', type: 'slider', min: -1, max: 1, step: 0.01, defaultValue: 0.01, modulatable: true },
            {
                name: 'triggerSlope',
                label: 'Trigger Slope',
                type: 'select',
                options: [
                    { value: 'rising', label: 'Rising' },
                    { value: 'falling', label: 'Falling' },
                ],
                defaultValue: 'rising',
            },
        ]
    }
];