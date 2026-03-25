import type { Connection, AppState } from './index';

export interface Preset {
    system: string;
    planetNodes: { name: string, color: string, id: number }[];
    connections: Connection[];
    settings: Partial<AppState>;
}
