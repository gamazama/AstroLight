import type { SoundGraph, ModulationControl, Instrument } from './soundCreator';

export interface ActiveInstrumentInstance {
  id: string; // A unique ID for this specific instance of an instrument
  instrumentName: string;
  prefix: string; // The prefix added to all node/connection IDs for this instance
  outputConnectionId: string; // The ID of the connection from the instrument's output to the master out
}


export interface SoundState {
  isSoundEnabled: boolean;
  masterVolume: number;
  graph: SoundGraph;
  instruments: Instrument[];
  activeInstrumentInstances: ActiveInstrumentInstance[];

  isDroneEnabled: boolean;
  isLineSoundEnabled: boolean;
  
  isFilterEnabled: boolean;
  filterCutoff: ModulationControl;
  filterResonance: ModulationControl;

  isDelayEnabled: boolean;
  delayTime: ModulationControl;
  delayFeedback: ModulationControl;

  /** Holds the last known real-time output values of all sound nodes. */
  soundNodeOutputs: Record<string, Record<string, number | number[]>>;
  clippingOutputs: Record<string, boolean>;
  oscilloscopeData: Record<string, Float32Array>;
}