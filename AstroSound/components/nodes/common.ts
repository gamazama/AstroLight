import type { SoundNodeType, SoundNodeParameter } from '../../types';

export const BASIC_NODE_PARAMETERS: SoundNodeParameter[] = [
    {
        name: 'customName',
        label: 'Name',
        type: 'text',
        defaultValue: '',
    },
    {
        name: 'displayColor',
        label: 'Display Color',
        type: 'color',
        defaultValue: '#4a5568', // a neutral gray
    },
    {
        name: 'isBypassed',
        label: 'Bypass',
        type: 'select', // Internally it's a boolean, but handled as a toggle
        defaultValue: false,
    }
];

export const withBasicNodeProps = (nodeDef: SoundNodeType): SoundNodeType => {
    return {
        ...nodeDef,
        parameters: [
            ...BASIC_NODE_PARAMETERS,
            ...nodeDef.parameters,
        ],
    };
};