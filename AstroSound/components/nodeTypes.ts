import type { SoundNodeType } from '../types/soundCreator';
import { inputNodes } from './nodes/inputNodes';
import { generatorNodes } from './nodes/generatorNodes';
import { utilityNodes } from './nodes/utilityNodes';
import { effectNodes } from './nodes/effectNodes';
import { outputNodes } from './nodes/outputNodes';
import { withBasicNodeProps } from './nodes/common';

export { SoundNodeType };

export const ALL_NODE_TYPES: SoundNodeType[] = [
    ...inputNodes.map(withBasicNodeProps),
    ...generatorNodes.map(withBasicNodeProps),
    ...utilityNodes.map(withBasicNodeProps),
    ...effectNodes.map(withBasicNodeProps),
    ...outputNodes.map(withBasicNodeProps),
];

// Public-facing node types (excludes the special 'Output' node)
export const NODE_TYPES: SoundNodeType[] = ALL_NODE_TYPES.filter(n => n.type !== 'Output');