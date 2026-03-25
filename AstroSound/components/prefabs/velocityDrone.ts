import type { NodePrefab } from '../../types';

export const velocityDronePrefab: NodePrefab = {
    name: "Velocity Drone",
    description: "A dual-voice cinematic drone where pitch is derived from orbital radius, modulated by the planet's velocity.",
    nodes: [
        // 0: Data Source
        { 
            type: 'DataSource', 
            params: { 
                connectionIndex: 0, 
                customName: 'Orbit Data', 
                activeOutputs: ['fromOrbitRadius', 'fromVelocity', 'toOrbitRadius', 'toVelocity'] 
            }, 
            relPos: { x: 0, y: 150 } 
        },
        
        // Voice 1 (Source)
        // 1: Math (Velocity Scale)
        { 
            type: 'Math', 
            params: { 
                operation: 'multiply', 
                val2: 1000000000, 
                customName: 'Vel Scale A' 
            }, 
            relPos: { x: 300, y: 0 } 
        },
        // 2: Octaver
        { 
            type: 'Cosmic Octaver', 
            params: { 
                inputType: 'distance', 
                distanceUnit: 'Mkm', 
                speedConstant: 'custom', 
                customName: 'Pitch A' 
            }, 
            relPos: { x: 550, y: 0 } 
        },
        // 3: Oscillator
        { 
            type: 'Cross-Oscillator', 
            params: { 
                waveform: 'sine', 
                amplitude: 0.23, 
                pan: -0.4, 
                fmEnabled: true, 
                fmAmount: 1,
                customName: 'Voice A'
            }, 
            relPos: { x: 850, y: 0 } 
        },

        // Voice 2 (Target)
        // 4: Math (Velocity Scale)
        { 
            type: 'Math', 
            params: { 
                operation: 'multiply', 
                val2: 1000000000, 
                customName: 'Vel Scale B' 
            }, 
            relPos: { x: 300, y: 300 } 
        },
        // 5: Octaver
        { 
            type: 'Cosmic Octaver', 
            params: { 
                inputType: 'distance', 
                distanceUnit: 'Mkm', 
                speedConstant: 'custom', 
                customName: 'Pitch B' 
            }, 
            relPos: { x: 550, y: 300 } 
        },
        // 6: Oscillator
        { 
            type: 'Cross-Oscillator', 
            params: { 
                waveform: 'sine', 
                amplitude: 0.23, 
                pan: 0.4, 
                fmEnabled: true, 
                fmAmount: 1,
                customName: 'Voice B'
            }, 
            relPos: { x: 850, y: 300 } 
        },

        // Mixing & FX
        // 7: Mixer
        { type: 'Mixer', params: {}, relPos: { x: 1150, y: 150 } },
        // 8: Filter
        { 
            type: 'Filter', 
            params: { 
                type: 'lowpass', 
                cutoff: 333, 
                q: 1.2, 
                drive: 0.9 
            }, 
            relPos: { x: 1400, y: 150 } 
        },
        // 9: Reverb
        { 
            type: 'Reverb', 
            params: { 
                mix: 0.4, 
                decay: 0.8, 
                size: 0.9 
            }, 
            relPos: { x: 1650, y: 150 } 
        },
        // 10: Output
        { type: 'Output', params: {}, relPos: { x: 1900, y: 150 } },
    ],
    connections: [
        // Voice 1
        { from: 0, fromOutput: 'fromVelocity', to: 1, toInput: 'val1' },
        { from: 1, fromOutput: 'out', to: 2, toInput: 'customVelocity' },
        { from: 0, fromOutput: 'fromOrbitRadius', to: 2, toInput: 'value' },
        { from: 2, fromOutput: 'out', to: 3, toInput: 'frequency' },
        { from: 3, fromOutput: 'out', to: 7, toInput: 'in1' },

        // Voice 2
        { from: 0, fromOutput: 'toVelocity', to: 4, toInput: 'val1' },
        { from: 4, fromOutput: 'out', to: 5, toInput: 'customVelocity' },
        { from: 0, fromOutput: 'toOrbitRadius', to: 5, toInput: 'value' },
        { from: 5, fromOutput: 'out', to: 6, toInput: 'frequency' },
        { from: 6, fromOutput: 'out', to: 7, toInput: 'in2' },

        // Chain
        { from: 7, fromOutput: 'out', to: 8, toInput: 'in' },
        { from: 8, fromOutput: 'out', to: 9, toInput: 'in' },
        { from: 9, fromOutput: 'out', to: 10, toInput: 'in' },
    ]
};