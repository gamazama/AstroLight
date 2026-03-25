
import { useRef, useEffect, useCallback } from 'react';
import type { AppState, CelestialBodyData, SoundState, UIState, Vector3D } from '../../types/index';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { audioWorkletProxy } from '../audioWorkletProxy';
import { calculatePlanetPosition } from '../../hooks/renderer/calculations';

const getCelestialBodyForSound = (name: string): CelestialBodyData | undefined => {
    const s = useAppStore.getState();
    const systemData = STAR_SYSTEMS[s.currentSystem];
    const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
    if (!basePlanetData) return undefined;
    return { ...basePlanetData, ...s.planetDataOverrides[name] };
};

export const useSoundEngine = () => {
    const { updateSound, updateUI } = useAppStore(state => ({
        updateSound: state.actions.updateSound,
        updateUI: state.actions.updateUI,
    }), shallow);
    
    const isSoundEnabled = useAppStore(state => state.isSoundEnabled);
    const masterVolume = useAppStore(state => state.masterVolume);
    const soundUiUpdateRate = useAppStore(state => state.soundUiUpdateRate);
    
    // Create a stable dependency that represents the graph structure and parameters,
    // but ignores cosmetic changes like node positions.
    const graphSyncDependency = useAppStore(state => JSON.stringify({
        nodes: state.graph.nodes.map(({ position, ...rest }) => rest),
        connections: state.graph.connections,
    }));


    const audioContextRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);

    const initAudio = useCallback(async () => {
        if (audioContextRef.current) return;

        updateUI({ soundEngineStatus: { isLoading: true, error: null } });

        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;

            const base = import.meta.env.BASE_URL;
            const workletURLs = [
                // DSP classes must be loaded first as they are dependencies
                `${base}worklet/dsp/BiquadFilter.js`,
                `${base}worklet/dsp/FDNReverb.js`,
                // Utility functions used by the processor and node logic
                `${base}worklet/utils/graph.js`,
                `${base}worklet/utils/wavetable.js`,
                `${base}worklet/utils/processor.js`,
                // Individual node processing logic files
                `${base}worklet/node-processors/dataSource.js`,
                `${base}worklet/node-processors/interaction.js`,
                `${base}worklet/node-processors/staticSource.js`,
                `${base}worklet/node-processors/parameter.js`,
                `${base}worklet/node-processors/lfo.js`,
                `${base}worklet/node-processors/curve.js`,
                `${base}worklet/node-processors/oscillator.js`,
                `${base}worklet/node-processors/crossOscillator.js`,
                `${base}worklet/node-processors/math.js`,
                `${base}worklet/node-processors/gain.js`,
                `${base}worklet/node-processors/pan.js`,
                `${base}worklet/node-processors/mixer.js`,
                `${base}worklet/node-processors/filter.js`,
                `${base}worklet/node-processors/delay.js`,
                `${base}worklet/node-processors/reverb.js`,
                `${base}worklet/node-processors/output.js`,
                `${base}worklet/node-processors/oscilloscope.js`,
                `${base}worklet/node-processors/waveshaper.js`,
                `${base}worklet/node-processors/cosmicOctaver.js`,
                `${base}worklet/node-processors/rerouter.js`,
                // The main processor class, which depends on all of the above
                `${base}worklet/LineSoundProcessor.js`
            ];
            
            let blobUrl = '';
            
            try {
                const responses = await Promise.all(workletURLs.map(url => fetch(url)));

                for (const response of responses) {
                    if (!response.ok) {
                        throw new Error(`Fetch failed for ${response.url} (${response.status} ${response.statusText})`);
                    }
                }
                
                const scripts = await Promise.all(responses.map(res => res.text()));
                const scriptContent = scripts.join('\n\n// --- MODULE SEPARATOR ---\n\n');
                
                const blob = new Blob([scriptContent], { type: 'application/javascript' });
                blobUrl = URL.createObjectURL(blob);

                await context.audioWorklet.addModule(blobUrl);
                
                const masterGain = context.createGain();
                masterGain.gain.value = 0;
                masterGain.connect(context.destination);
                masterGainRef.current = masterGain;

                const workletNode = new AudioWorkletNode(context, 'line-sound-processor', {
                    outputChannelCount: [2]
                });
                workletNode.connect(masterGain);
                workletNodeRef.current = workletNode;
                audioWorkletProxy.port = workletNode.port;

                // --- INITIALIZE WORKLET STATE IMMEDIATELY ---
                // Send the current graph state immediately to the new worklet.
                // This prevents the "no sound until interaction" bug caused by the React effect not re-firing.
                const currentState = useAppStore.getState();
                workletNode.port.postMessage({
                    type: 'GRAPH_STRUCTURE_CHANGED',
                    payload: { graph: currentState.graph }
                });
                workletNode.port.postMessage({
                    type: 'UPDATE_MASTER_VOLUME',
                    payload: { volume: currentState.masterVolume }
                });
                workletNode.port.postMessage({
                    type: 'UI_UPDATE_RATE_CHANGED',
                    payload: { rate: currentState.soundUiUpdateRate }
                });
                
                workletNode.port.onmessage = (event) => {
                    if (event.data.type === 'UI_UPDATE') {
                        const { nodeOutputs, clippingOutputs, oscilloscopeData } = event.data.payload;
                        updateSound({ 
                            soundNodeOutputs: nodeOutputs || {},
                            clippingOutputs: clippingOutputs || {},
                            oscilloscopeData: oscilloscopeData || {}
                        });
                    }
                };
                
                updateUI({ soundEngineStatus: { isLoading: false, error: null } });

            } catch (e: any) {
                console.error('Failed to load AudioWorklet processor:', e);
                const errorMessage = `Failed to load AudioWorklet modules. Check console for details. Message: ${e.message}`;
                updateUI({ soundEngineStatus: { isLoading: false, error: errorMessage } });
            } finally {
                if (blobUrl) {
                    URL.revokeObjectURL(blobUrl);
                }
            }

        } catch (e: any) {
            console.error("Web Audio API is not supported in this browser", e);
            const errorMessage = `Web Audio API is not supported in this browser. AstroSound™ Pro BETA cannot be initialized.\nMessage: ${e.message}`;
            updateUI({ soundEngineStatus: { isLoading: false, error: errorMessage } });
        }
    }, [updateUI, updateSound]);

    useEffect(() => {
        if (isSoundEnabled) {
            if (!audioContextRef.current) {
                initAudio();
            }
            audioContextRef.current?.resume();
        } else {
            audioContextRef.current?.suspend();
        }
    }, [isSoundEnabled, initAudio]);

    useEffect(() => {
        if (audioWorkletProxy.port) {
            const { graph } = useAppStore.getState();
            audioWorkletProxy.port.postMessage({
                type: 'GRAPH_STRUCTURE_CHANGED',
                payload: { graph }
            });
        }
    }, [graphSyncDependency]);
    
    useEffect(() => {
        if (audioWorkletProxy.port) {
            audioWorkletProxy.port.postMessage({
                type: 'UPDATE_MASTER_VOLUME',
                payload: { volume: masterVolume }
            });
        }
    }, [masterVolume]);

    useEffect(() => {
        if (audioWorkletProxy.port) {
            audioWorkletProxy.port.postMessage({
                type: 'UI_UPDATE_RATE_CHANGED',
                payload: { rate: soundUiUpdateRate }
            });
        }
    }, [soundUiUpdateRate]);

    useEffect(() => {
        const update = () => {
            const s = useAppStore.getState();
            const context = audioContextRef.current;
            
            if (!context || !audioWorkletProxy.port) {
                requestAnimationFrame(update);
                return;
            }

            const now = context.currentTime;
            
            if (!s.isSoundEnabled || context.state !== 'running') {
                if (masterGainRef.current && masterGainRef.current.gain.value > 0) {
                     masterGainRef.current.gain.setTargetAtTime(0, now, 0.02);
                }
                requestAnimationFrame(update);
                return;
            }
            
            masterGainRef.current?.gain.setTargetAtTime(1, now, 0.02);
            
            const { innerWidth, innerHeight } = window;

            // Helper to calculate Position and Velocity
            const getPhysicsState = (body: CelestialBodyData) => {
                const pos = calculatePlanetPosition(body, s.time, s);
                
                // Calculate instantaneous velocity using finite difference
                // dt of 0.001 days is small enough for precision but large enough to avoid precision loss
                const dt = 0.001; 
                const nextPos = calculatePlanetPosition(body, s.time + dt, s);

                const x = pos.x / s.sceneScale;
                const y = pos.y / s.sceneScale;
                const z = pos.z / s.sceneScale;

                const nextX = nextPos.x / s.sceneScale;
                const nextY = nextPos.y / s.sceneScale;
                const nextZ = nextPos.z / s.sceneScale;

                // Velocity in Mkm/day
                const vx = (nextX - x) / dt;
                const vy = (nextY - y) / dt;
                const vz = (nextZ - z) / dt;

                return {
                    livePos: { x, y, z },
                    liveVel: { x: vx, y: vy, z: vz }
                };
            };

            const simStatePayload = {
                time: s.time,
                timeSpeed: s.timeSpeed,
                isPlaying: s.isPlaying,
                mousePosition: s.mousePosition,
                canvasDimensions: { width: innerWidth, height: innerHeight },
                camera: {
                    tilt: s.tilt,
                    rotation: s.rotation,
                    zoom: s.actualZoom,
                },
                dataSources: s.graph.nodes
                    .filter(node => node.type === 'DataSource')
                    .map(node => {
                        if (node.params.sourceType === 'planet' && node.params.planetId !== null) {
                            const planetNode = s.planetNodes.find(n => n.id === node.params.planetId);
                            if (planetNode) {
                                const body = getCelestialBodyForSound(planetNode.name);
                                if (body) {
                                    const physics = getPhysicsState(body);
                                    return {
                                        nodeId: node.id,
                                        mode: 'planet',
                                        body: { ...body, ...physics },
                                    };
                                }
                            }
                        }
                        else if (node.params.connectionIndex !== null && s.connections[node.params.connectionIndex]) {
                            const conn = s.connections[node.params.connectionIndex];
                            const fromNode = s.planetNodes.find(n => n.id === conn.from);
                            const toNode = s.planetNodes.find(n => n.id === conn.to);
                            if (fromNode && toNode) {
                                const fromBody = getCelestialBodyForSound(fromNode.name);
                                const toBody = getCelestialBodyForSound(toNode.name);
                                
                                if (fromBody && toBody) {
                                    const fromPhysics = getPhysicsState(fromBody);
                                    const toPhysics = getPhysicsState(toBody);

                                    return {
                                        nodeId: node.id,
                                        mode: 'connection',
                                        from: { ...fromBody, ...fromPhysics },
                                        to: { ...toBody, ...toPhysics },
                                    };
                                }
                            }
                        }
                        return null;
                    }).filter((item): item is NonNullable<typeof item> => item !== null),
            };

            audioWorkletProxy.port.postMessage({ type: 'SIM_STATE_TICK', payload: simStatePayload });
            
            requestAnimationFrame(update);
        };
        
        const animationFrameId = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(animationFrameId);
            audioWorkletProxy.port = null;
        };
    }, []);
};
