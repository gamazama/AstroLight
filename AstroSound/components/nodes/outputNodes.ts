import type { SoundNodeType } from '../../types';

export const outputNodes: SoundNodeType[] = [
    {
        type: 'Output',
        label: 'Master Output',
        category: 'Output',
        inputs: [
            { name: 'in', label: 'Audio In', type: 'audio' },
        ],
        outputs: [],
        parameters: []
    },
];