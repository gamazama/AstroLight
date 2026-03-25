
import type { SoundNodeType } from '../../types';

export const inputNodes: SoundNodeType[] = [
    {
        type: 'DataSource',
        label: 'Data Source',
        category: 'Input',
        width: 240, // Slightly wider for longer labels
        inputs: [],
        outputs: [], // Outputs are now dynamic
        parameters: [
            {
                name: 'sourceType',
                label: 'Source Type',
                type: 'select',
                options: [
                    { value: 'connection', label: 'Connection' },
                    { value: 'planet', label: 'Single Planet' },
                ],
                defaultValue: 'connection',
            },
            {
                name: 'connectionIndex',
                label: 'Connection',
                type: 'connection_select',
                defaultValue: null,
            },
            {
                name: 'planetId',
                label: 'Planet',
                type: 'planet_select',
                defaultValue: null,
            },
            {
                name: 'activeOutputs',
                label: 'Active Outputs',
                type: 'multi-select-checkbox',
                options: [
                    {
                        group: 'Connection Physics',
                        items: [
                            { value: 'realtimeDistance', label: 'Distance (Mkm)' },
                            { value: 'relativeDistance', label: 'Relative Dist (0-1)' },
                            { value: 'synodicPeriod', label: 'Synodic Period (Days)' },
                            { value: 'orbitalRatio', label: 'Orbital Ratio' },
                        ]
                    },
                    {
                        group: 'Source Body', // Will be dynamically renamed to Planet Name
                        items: [
                            { value: 'fromOrbitRadius', label: 'Orbit Radius (Mkm)' },
                            { value: 'fromOrbitPeriod', label: 'Orbit Period (Days)' },
                            { value: 'fromVelocity', label: 'Velocity (km/s)' },
                            { value: 'fromPhysicalRadius', label: 'Physical Radius (km)' },
                        ]
                    },
                    {
                        group: 'Target Body', // Will be dynamically renamed to Planet Name
                        items: [
                            { value: 'toOrbitRadius', label: 'Orbit Radius (Mkm)' },
                            { value: 'toOrbitPeriod', label: 'Orbit Period (Days)' },
                            { value: 'toVelocity', label: 'Velocity (km/s)' },
                            { value: 'toPhysicalRadius', label: 'Physical Radius (km)' },
                        ]
                    },
                ],
                defaultValue: ['relativeDistance'],
            }
        ]
    },
    {
        type: 'Interaction',
        label: 'Interaction Data',
        category: 'Input',
        width: 208,
        inputs: [],
        outputs: [], // Dynamic
        parameters: [
            {
                name: 'activeOutputs',
                label: 'Active Outputs',
                type: 'multi-select-checkbox',
                options: [
                    {
                        group: 'Mouse',
                        items: [
                            { value: 'mouseX', label: 'Mouse X (-1 to 1)' },
                            { value: 'mouseY', label: 'Mouse Y (-1 to 1)' },
                            { value: 'mouseXRaw', label: 'Mouse X (Pixels)' },
                            { value: 'mouseYRaw', label: 'Mouse Y (Pixels)' },
                        ]
                    },
                    {
                        group: 'Camera',
                        items: [
                            { value: 'tilt', label: 'Tilt (Degrees)' },
                            { value: 'rotation', label: 'Rotation (Degrees)' },
                            { value: 'zoom', label: 'Zoom Level' },
                            { value: 'zoomLog', label: 'Zoom (Logarithmic)' },
                        ]
                    },
                    {
                        group: 'Simulation',
                        items: [
                            { value: 'timeSpeed', label: 'Time Speed' },
                            { value: 'isPlaying', label: 'Is Playing (0/1)' },
                            { value: 'time', label: 'Sim Time (Days)' },
                        ]
                    }
                ],
                defaultValue: ['mouseX', 'mouseY'],
            }
        ]
    },
    {
        type: 'Static Source',
        label: 'Static Source',
        category: 'Input',
        width: 208,
        inputs: [
            // Static inputs are now converted to modulatable parameters
        ],
        outputs: [
            { name: 'out', label: 'Out', type: 'audio' },
        ],
        parameters: [
            { name: 'mode', label: 'Mode', type: 'select', options: [{value: 'value', label: 'Value'}, {value: 'oscillator', label: 'Oscillator'}], defaultValue: 'value' },
            { name: 'value', label: 'Value', type: 'slider', min: -1, max: 1, step: 0.01, defaultValue: 0.5, modulatable: true },
            { name: 'waveform', label: 'Waveform', type: 'select', options: [ { value: 'sine', label: 'Sine' }, { value: 'square', label: 'Square' }, { value: 'sawtooth', label: 'Sawtooth' }, { value: 'triangle', label: 'Triangle' }, { value: 'noise', label: 'S&H / Noise' }], defaultValue: 'sine' },
            { name: 'frequency', label: 'Frequency', type: 'slider', min: 0.01, max: 10000, step: 1, log: true, defaultValue: 440, modulatable: true },
            { name: 'amplitude', label: 'Amplitude', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 1, modulatable: true },
            { name: 'pulseWidth', label: 'Pulse Width', type: 'slider', min: 0.01, max: 0.99, step: 0.01, defaultValue: 0.5, modulatable: true },
            { name: 'pan', label: 'Pan', type: 'slider', min: -1, max: 1, step: 0.01, defaultValue: 0, modulatable: true }
        ]
    }
];
