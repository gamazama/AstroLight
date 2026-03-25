
import type { StoreSet, StoreGet } from '../appStore';
import type { AppState, Preset } from '../../types';
import { APP_URL, APP_VERSION } from '../../constants';
import { renderHighResolutionImage } from '../../utils/export/imageExport';
import { generateOBJ } from '../../utils/export/modelExport';
import { generateSVG } from '../../utils/export/svgExport';
import { initialSimulationState, initialBackgroundState, initialVisualsState, initialUIState } from '../../initialState';
import { initialSoundState } from '../../AstroSound/soundStore';
import { keyMap } from '../../data/serializationConfig';

declare const pako: any;

const fullInitialState = {
    ...initialSimulationState,
    ...initialBackgroundState,
    ...initialVisualsState,
    ...initialUIState,
    ...initialSoundState,
};

const pluck = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        result[key] = obj[key];
    });
    return result;
}

export const createExportActions = (set: StoreSet, get: StoreGet) => ({
    getCanvasImageData: (): string | null => {
        const tempCanvas = document.createElement('canvas');
        const width = window.innerWidth;
        const height = window.innerHeight;
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return null;

        const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
        const orbitCanvas = document.getElementById('orbit-display-canvas') as HTMLCanvasElement;
        const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
        
        if (webglCanvas) tempCtx.drawImage(webglCanvas, 0, 0);
        if (orbitCanvas) tempCtx.drawImage(orbitCanvas, 0, 0);
        if (mainCanvas) tempCtx.drawImage(mainCanvas, 0, 0);

        return tempCanvas.toDataURL('image/png');
    },

    saveImage: (options?: { showWatermark?: boolean, use8k?: boolean }) => {
        const is8k = options?.use8k ?? false;
        set({ notification: is8k ? 'Generating **8K Ultra-Res Image**... (This may take a moment)' : 'Generating **High-Res Image**...' });
        
        // Default to 4500px, upgrade to 7680px for 8K mode
        const resolution = is8k ? 7680 : 4500;

        setTimeout(() => {
            const state = get();
            renderHighResolutionImage(state, { showWatermark: options?.showWatermark ?? true, resolution })
                .then(blob => {
                    // 1. Short Current User Date (YY-MM-DD)
                    const now = new Date();
                    const shortDate = now.toISOString().slice(2, 10); 

                    // 2. Short Connections (e.g., MerVen-EarMar)
                    // Shortening Logic:
                    // - Sol System: First 3 chars (Mer, Ven)
                    // - Others: Remove common catalog prefixes (Kepler-, TRAPPIST-, Gliese, etc)
                    const shortenName = (name: string) => {
                        if (state.currentSystem.includes('Sol') || state.currentSystem === 'Geo-centric') {
                            return name.slice(0, 3);
                        }
                        // Remove common exoplanet catalog prefixes to shorten e.g. "Kepler-90d" to "90d"
                        let short = name.replace(/^(Kepler-|TRAPPIST-|Gliese\s?|Proxima\s?|HD\s?|HIP\s?)/i, '');
                        // Remove spaces
                        short = short.replace(/\s/g, '');
                        return short;
                    };

                    const shortConnections = state.connections.length > 0 
                        ? state.connections.map(c => {
                            const from = state.planetNodes.find(p => p.id === c.from)?.name;
                            const to = state.planetNodes.find(p => p.id === c.to)?.name;
                            if (!from || !to) return '';
                            return `${shortenName(from)}${shortenName(to)}`;
                        }).join('-')
                        : 'NoConn';

                    // 3. Length of timespan in yrs
                    const years = Math.round(state.time / 365.25);
                    const timeSpan = `${years}y`;

                    // 4. Realism type
                    let realismType = 'Simple';
                    if (state.useRealisticPhysics) {
                         if (state.useJplHorizons) {
                             realismType = 'NASA-JPL';
                         } else {
                             realismType = 'Kepler';
                         }
                    } else {
                         if (state.logarithmicOrbits) {
                             realismType = 'SimpleLog';
                         }
                    }
                    
                    // 5. System Prefix (if not Sol)
                    let filenamePrefix = "";
                    if (state.currentSystem !== 'Sol' && state.currentSystem !== 'Sol (Extended)') {
                        // Clean system name for filename (remove spaces/special chars)
                        filenamePrefix = `${state.currentSystem.replace(/[^a-zA-Z0-9]/g, '')}_`;
                    }
                    
                    // 6. Suffix for 8k
                    const suffix = is8k ? '_8K' : '';

                    const filename = `${filenamePrefix}${shortDate}_${shortConnections}_${timeSpan}_${realismType}${suffix}.png`;

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    set({ notification: '**Image Saved** successfully.' });
                })
                .catch(error => {
                    console.error("Save image error:", error);
                    set({ notification: `**Error**: ${error.message}` });
                });
        }, 50);
    },

    export3DModel: () => {
        const state = get();
        if (state.lineHistory.length === 0) {
            set({ notification: '**No lines** to export.' });
            return;
        }
        set({ notification: 'Generating **3D Model (.obj)**...' });
        
        // Run in timeout to allow UI to update
        setTimeout(() => {
            try {
                const blob = generateOBJ(state);
                const filename = `${state.documentName || 'AstroLight_Model'}.obj`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                set({ notification: `**${filename}** exported successfully.` });
                get().actions.markFeatureUsed('export_obj');
            } catch (e: any) {
                console.error("Export OBJ Error:", e);
                set({ notification: `**Error**: ${e.message}` });
            }
        }, 50);
    },

    exportSVG: () => {
        const state = get();
        set({ notification: 'Generating **Vector SVG**...' });
        
        setTimeout(() => {
            try {
                const blob = generateSVG(state);
                const filename = `${state.documentName || 'AstroLight_Vector'}.svg`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                set({ notification: `**${filename}** exported successfully.` });
                get().actions.markFeatureUsed('export_svg');
            } catch (e: any) {
                console.error("Export SVG Error:", e);
                set({ notification: `**Error**: ${e.message}` });
            }
        }, 50);
    },

    shareConfiguration: () => {
        const state = get();
        
        const minifiedSettings: { [key: string]: any } = {};
        
        for (const longKey of Object.keys(keyMap)) {
            const key = longKey as Extract<keyof AppState, string>;
            const shortKey = keyMap[key];
            const currentValue = state[key];
            const defaultValue = fullInitialState[key];
            
            let isDefault = false;
            if (key === 'planetDataOverrides') {
                isDefault = Object.keys(currentValue as object).length === 0;
            } else if (key === 'startDate') {
                isDefault = false;
            } else if (currentValue instanceof Date && defaultValue instanceof Date) {
                isDefault = currentValue.getTime() === defaultValue.getTime();
            } else if (typeof currentValue === 'object' && currentValue !== null) {
                isDefault = JSON.stringify(currentValue) === JSON.stringify(defaultValue);
            } else {
                isDefault = currentValue === defaultValue;
            }
            
            if (!isDefault) {
                minifiedSettings[shortKey] = currentValue;
            }
        }

        const config = {
            v: APP_VERSION,
            s: state.currentSystem,
            p: state.planetNodes,
            c: state.connections,
            ms: minifiedSettings
        };
        
        try {
            const jsonString = JSON.stringify(config);
            const compressed = pako.deflate(jsonString);
            let binaryString = '';
            for (let i = 0; i < compressed.length; i++) binaryString += String.fromCharCode(compressed[i]);
            const urlSafeBase64 = btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            navigator.clipboard.writeText(`${APP_URL}?cconfig=${urlSafeBase64}`).then(() => {
                set({ notification: '**Share link** copied to clipboard!' });
                set({ shareSnapshotEffect: { startTime: performance.now() } });
            });
        } catch (e) { console.error("Share error:", e); set({ notification: '**Error**: Could not create share link.' }); }
    },
    exportConfig: (presetName?: string) => {
        const state = get();
        
        const keysToSave = (Object.keys(keyMap) as (keyof AppState)[]).filter(key => key in state);

        const configToExport: Preset = {
            system: state.currentSystem,
            planetNodes: state.planetNodes.map(({ id, name, color }) => ({ id, name, color })),
            connections: state.connections,
            settings: {
                ...pluck(state, keysToSave)
            }
        };
        
        const filename = `${presetName || state.documentName || 'AstroLight_Creation'}.ass`;
        const fileContent = `export const preset: Preset = ${JSON.stringify(configToExport, (key, value) => {
            if (value instanceof Date) { return value.toISOString(); }
            return value;
        }, 2)};`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        set({ notification: `**${filename}** saved.` });
    },
});
