
export type DataSource = 'none' | 'realtimeDistance' | 'relativeDistance' | 'synodicPeriod' | 'orbitalRatio' | 'cameraRotationVelocity';

export interface ModulationControl {
    base: number;
    modulator: DataSource;
    intensity: number;
}

export interface SoundNodePort {
    name: string;
    label: string;
    type: 'audio' | 'value';
}

export interface SoundNodeParameter {
    name:string;
    label: string;
    type: 'number' | 'slider' | 'select' | 'text' | 'color' | 'connection_select' | 'multi-select-checkbox' | 'planet_select';
    options?: ({ value: string | number; label: string } | { group: string; items: { value: string | number; label: string }[] })[];
    min?: number;
    max?: number;
    hardMin?: number; // New: Allow extended range for text input
    hardMax?: number; // New: Allow extended range for text input
    step?: number;
    log?: boolean;
    defaultValue: any;
    modulatable?: boolean;
}

export interface SoundNodeType {
    type: string;
    label: string;
    category: 'Input' | 'Generator' | 'Effect' | 'Utility' | 'Output';
    width?: number;
    height?: number;
    inputs: SoundNodePort[];
    outputs: SoundNodePort[];
    parameters: SoundNodeParameter[];
}

export interface SoundNode {
  id: string;
  type: string; 
  position: { x: number; y: number };
  params: Record<string, any> & {
    exposedInputs: string[];
  };
}

export interface SoundConnection {
  id: string;
  fromNodeId: string;
  fromOutput: string;
  toNodeId: string;
  toInput: string;
  pathPoints: { x: number; y: number }[];
}

export interface SoundGraph {
  nodes: SoundNode[];
  connections: SoundConnection[];
}

export interface NodePrefab {
    name: string;
    description: string;
    nodes: { type: string; params: Record<string, any>; relPos: { x: number, y: number } }[];
    connections: { from: number; fromOutput: string; to: number; toInput: string; }[];
}

export interface Instrument {
    name: string;
    description: string;
    graph: SoundGraph;
    parameters: {
        nodeId: string;
        label: string;
        min: number;
        max: number;
        step: number;
        defaultValue: number;
        log?: boolean;
    }[];
    dataSources: {
        nodeId: string;
        label: string;
    }[];
    outputNodeId: string;
}