
import * as THREE from 'three';
import type { AppState, CelestialBodyData, Connection, PlanetNode, Vector3D } from '../../../../types/index';
import { hexToRgb, lerpRGB, rgbToHex, sampleGradient } from '../../../../utils/colorUtils';
import { threeJsBridge } from '../../threeJsBridge';
import { calculatePlanetPosition, applyCameraTransform } from '../../calculations';
import { STAR_SYSTEMS } from '../../../../data/starSystems';
import { liveLineVertexShader } from '../shaders/liveLine.vert';
import { lineFragmentShader } from '../shaders/line.frag';
import { lerp } from '../../../../utils/mathUtils';

interface FadingConnection {
    connection: Connection;
    progress: number;
}

export class LiveLineRenderer {
    public mesh: THREE.Mesh;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;

    private startPositions: Float32Array;
    private endPositions: Float32Array;
    private colors: Float32Array;
    private opacities: Float32Array;
    
    private maxLiveLines: number;
    private segmentsPerLine: number = 50; 
    private flowTime: number = 0; 
    private noiseTime: number = 0; 
    private textureTime: number = 0;
    private lastTime: number = 0;

    private fadingConnections: FadingConnection[] = [];
    private previousConnections: Connection[] = [];

    constructor(maxLiveLines: number) {
        this.maxLiveLines = maxLiveLines;
        const totalQuads = maxLiveLines * this.segmentsPerLine;

        this.geometry = new THREE.BufferGeometry();
        
        this.startPositions = new Float32Array(totalQuads * 4 * 3);
        this.endPositions = new Float32Array(totalQuads * 4 * 3);
        this.colors = new Float32Array(totalQuads * 4 * 3);
        this.opacities = new Float32Array(totalQuads * 4 * 1);
        
        const uvs = new Float32Array(totalQuads * 4 * 2);
        for (let i = 0; i < maxLiveLines; i++) {
            for (let s = 0; s < this.segmentsPerLine; s++) {
                const quadIndex = i * this.segmentsPerLine + s;
                const base = quadIndex * 4 * 2;
                
                const uStart = s / this.segmentsPerLine;
                const uEnd = (s + 1) / this.segmentsPerLine;

                uvs[base + 0] = uStart; uvs[base + 1] = 0;
                uvs[base + 2] = uEnd;   uvs[base + 3] = 0;
                uvs[base + 4] = uStart; uvs[base + 5] = 1;
                uvs[base + 6] = uEnd;   uvs[base + 7] = 1;
            }
        }

        const indices = new Uint32Array(totalQuads * 6);
        for (let i = 0; i < totalQuads; i++) {
            const base = i * 4;
            indices[i * 6 + 0] = base + 0; indices[i * 6 + 1] = base + 1; indices[i * 6 + 2] = base + 2;
            indices[i * 6 + 3] = base + 1; indices[i * 6 + 4] = base + 3; indices[i * 6 + 5] = base + 2;
        }
        this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        this.geometry.setAttribute('startPosition', new THREE.BufferAttribute(this.startPositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('endPosition', new THREE.BufferAttribute(this.endPositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('lineUv', new THREE.BufferAttribute(uvs, 2));
        this.geometry.setAttribute('lineColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('lineOpacity', new THREE.BufferAttribute(this.opacities, 1).setUsage(THREE.DynamicDrawUsage));

        this.material = new THREE.ShaderMaterial({
            vertexShader: liveLineVertexShader,
            fragmentShader: lineFragmentShader,
            uniforms: {
                u_opacity: { value: 1.0 },
                u_lineWidth: { value: 1.0 },
                u_isOrthographic: { value: 0.0 },
                u_lineSoftness: { value: 0.5 },
                u_isMycelium: { value: 0.0 },
                u_currentTime: { value: 0.0 },
                u_myceliumFlowTime: { value: 0.0 },
                u_myceliumTextureTime: { value: 0.0 },
                u_myceliumPulseDensity: { value: 1.0 },
                u_myceliumPulseWidth: { value: 0.5 },
                u_myceliumVisualActivity: { value: 1.0 },
                u_myceliumFlowIntensity: { value: 1.0 },
                u_myceliumDisplacement: { value: 1.0 },
                u_myceliumDisplacementScale: { value: 1.0 },
                u_myceliumNoiseScale: { value: 1.0 },
                u_myceliumTextureStretch: { value: 1.0 },
                u_myceliumGlow: { value: 1.0 },
                u_noiseTime: { value: 0.0 },
                u_dofStrength: { value: 0.0 },
                u_dofExponent: { value: 1.0 },
                u_focusDistance: { value: 800.0 },
                u_dofBlurBrightness: { value: 1.0 },
                u_blurType: { value: 1 },
                u_minAlpha: { value: 0.001 },
                u_debugDoFMode: { value: 0 },
                u_cameraDistance: { value: 0.0 },
                // World Transform
                u_viewPivot: { value: new THREE.Vector3(0,0,0) }, // Ensure present
                u_pivotOffset: { value: new THREE.Vector3(0,0,0) },
                u_worldRotation: { value: new THREE.Vector3(0,0,0) },
                u_hasPivot: { value: 0.0 },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            premultipliedAlpha: true,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
    }

    public dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
    
    public update(state: AppState) {
        let lineCount = 0;
        const { connections, planetNodes, actualZOffsets, time, liveLineWidth, liveLineOpacity, lineSoftness, lineBlendMode, isMyceliumMode } = state;
        const getCelestialBody = (name: string): CelestialBodyData | undefined => {
            const systemData = STAR_SYSTEMS[state.currentSystem];
            const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
            if (!basePlanetData) return undefined;
            return { ...basePlanetData, ...state.planetDataOverrides[name] };
        };

        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        if (isMyceliumMode) {
            this.flowTime += dt * state.myceliumFlowSpeed;
            const speedCurve = 0.5 + 0.9 * Math.log10(Math.max(1, state.timeSpeed));
            this.noiseTime += dt * speedCurve * 1.5 * state.myceliumWiggleSpeed;
            this.textureTime += dt * state.myceliumTextureSpeed;
        }

        // --- Update Uniforms ---
        this.material.uniforms.u_opacity.value = liveLineOpacity;
        this.material.uniforms.u_lineSoftness.value = lineSoftness;
        this.material.uniforms.u_isMycelium.value = isMyceliumMode ? 1.0 : 0.0;
        this.material.uniforms.u_currentTime.value = time;
        
        this.material.uniforms.u_dofStrength.value = state.dofStrength * 0.001;
        this.material.uniforms.u_dofExponent.value = state.dofExponent;
        this.material.uniforms.u_dofBlurBrightness.value = state.dofBlurBrightness;
        this.material.uniforms.u_blurType.value = state.dofBlurType === 'bokeh' ? 1 : 0;
        this.material.uniforms.u_minAlpha.value = state.minLineAlpha;
        
        // World Transform Uniforms
        if (state.pivotPoint) {
             this.material.uniforms.u_hasPivot.value = 1.0;
             
             // PivotPoint is already in View Space, just need to flip Y/Z for GL coordinate space.
             const viewPivotSim = state.pivotPoint;
             
             this.material.uniforms.u_viewPivot.value.set(viewPivotSim.x, -viewPivotSim.y, -viewPivotSim.z);
             this.material.uniforms.u_worldRotation.value.set(state.worldRotation.x, -state.worldRotation.y, -state.worldRotation.z);
             
             const offset = state.pivotOffset || { x: 0, y: 0, z: 0 };
             this.material.uniforms.u_pivotOffset.value.set(offset.x, -offset.y, -offset.z);
        } else {
             this.material.uniforms.u_hasPivot.value = 0.0;
        }
        
        let debugModeInt = 0;
        if (state.debugDoFMode === 'coc') debugModeInt = 1;
        if (state.debugDoFMode === 'depth') debugModeInt = 2;
        if (state.debugDoFMode === 'cap') debugModeInt = 3;
        this.material.uniforms.u_debugDoFMode.value = debugModeInt;
        
        if (state.renderMode === 'orthographic') {
             this.material.uniforms.u_focusDistance.value = state.dofFocusDistance;
             this.material.uniforms.u_cameraDistance.value = 0.0;
        } else {
             const cameraDistance = 4000 / state.actualZoom;
             this.material.uniforms.u_focusDistance.value = cameraDistance + state.dofFocusDistance;
             this.material.uniforms.u_cameraDistance.value = cameraDistance;
        }
        
        if (isMyceliumMode) {
            this.material.uniforms.u_myceliumFlowTime.value = this.flowTime;
            this.material.uniforms.u_myceliumTextureTime.value = this.textureTime;
            this.material.uniforms.u_myceliumPulseDensity.value = state.myceliumPulseDensity;
            this.material.uniforms.u_myceliumPulseWidth.value = state.myceliumPulseWidth;
            this.material.uniforms.u_myceliumVisualActivity.value = state.myceliumVisualActivity;
            this.material.uniforms.u_myceliumFlowIntensity.value = state.myceliumFlowIntensity;
            this.material.uniforms.u_myceliumDisplacement.value = state.myceliumDisplacement;
            this.material.uniforms.u_myceliumDisplacementScale.value = state.myceliumDisplacementScale;
            this.material.uniforms.u_myceliumNoiseScale.value = state.myceliumNoiseScale;
            this.material.uniforms.u_myceliumTextureStretch.value = state.myceliumTextureStretch;
            this.material.uniforms.u_myceliumGlow.value = state.myceliumGlow;
            this.material.uniforms.u_noiseTime.value = this.noiseTime;
        }

        const NORMAL_LIVE_LINE_WIDTH = 0.75;
        const relativeWidth = Math.max(0.1, liveLineWidth / NORMAL_LIVE_LINE_WIDTH);
        const scaledRelativeWidth = Math.pow(relativeWidth, 0.5);
        const baseConstant = isMyceliumMode ? 6.0 : 3.2;
        const desiredThickness = baseConstant * scaledRelativeWidth;

        const renderer = threeJsBridge.renderer;
        const viewportHeight = renderer ? renderer.getSize(new THREE.Vector2()).height : window.innerHeight;

        if (state.renderMode === 'orthographic') {
            this.material.uniforms.u_lineWidth.value = (desiredThickness * 2.0) / state.actualZoom;
            this.material.uniforms.u_isOrthographic.value = 1.0;
        } else {
            const fovInRadians = state.actualFov * Math.PI / 180;
            const tanHalfFov = Math.tan(fovInRadians / 2);
            const finalLineWidthFactor = desiredThickness * tanHalfFov * 2.0 / viewportHeight;
            this.material.uniforms.u_lineWidth.value = finalLineWidthFactor;
            this.material.uniforms.u_isOrthographic.value = 0.0;
        }

        if (state.debugDoFMode !== 'none') {
            this.material.blending = THREE.NormalBlending;
            this.material.depthWrite = true;
        } else {
            this.material.depthWrite = false;
            if (lineBlendMode === 'multiply') { this.material.blending = THREE.CustomBlending; this.material.blendEquation = THREE.AddEquation; this.material.blendSrc = THREE.DstColorFactor; this.material.blendDst = THREE.OneMinusSrcAlphaFactor;
            } else if (lineBlendMode === 'screen') { this.material.blending = THREE.CustomBlending; this.material.blendEquation = THREE.AddEquation; this.material.blendSrc = THREE.OneMinusDstColorFactor; this.material.blendDst = THREE.OneFactor;
            } else if (lineBlendMode === 'lighter') { this.material.blending = THREE.AdditiveBlending;
            } else { this.material.blending = THREE.NormalBlending; }
        }
        this.material.needsUpdate = true;
        
        const currentIds = new Set(connections.map(c => c.id));
        
        for (const prevConn of this.previousConnections) {
            if (!currentIds.has(prevConn.id)) {
                this.fadingConnections.push({ connection: prevConn, progress: 0 });
            }
        }
        this.previousConnections = connections;

        const ZIP_SPEED = 3.0; 

        const activeFading: FadingConnection[] = [];
        for (const fading of this.fadingConnections) {
            fading.progress += dt * ZIP_SPEED;
            if (fading.progress < 1.0) {
                activeFading.push(fading);
            }
        }
        this.fadingConnections = activeFading;

        const drawConnection = (conn: Connection, progress: number) => {
             if (lineCount >= this.maxLiveLines) return;

            const fromNode = planetNodes.find(n => n.id === conn.from);
            const toNode = planetNodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return;

            const fromPlanet = getCelestialBody(fromNode.name);
            const toPlanet = getCelestialBody(toNode.name);
            if (!fromPlanet || !toPlanet) return;

            let fromPos3D = calculatePlanetPosition(fromPlanet, time, state);
            fromPos3D.z += actualZOffsets[fromPlanet.name] ?? 0;
            let toPos3D = calculatePlanetPosition(toPlanet, time, state);
            toPos3D.z += actualZOffsets[toPlanet.name] ?? 0;

            const t = progress * progress;
            
            // RAW world coords for GL shader
            const currentFromX = lerp(fromPos3D.x, toPos3D.x, t);
            const currentFromY = -lerp(fromPos3D.y, toPos3D.y, t);
            const currentFromZ = -lerp(fromPos3D.z, toPos3D.z, t);

            const tx = toPos3D.x;
            const ty = -toPos3D.y;
            const tz = -toPos3D.z;

            const currentOpacity = 1.0 - progress;

            let finalColor = conn.color;
            if (progress === 0) {
                 if (state.lineColorMode === 'distance') {
                    const getRadius = (planet: CelestialBodyData, s: AppState) => {
                        const rLinear = planet.orbitRadius * s.sceneScale;
                        const rLog = (Math.log(planet.orbitRadius + 1) * 100) * s.sceneScale;
                        return lerp(rLinear, rLog, s.logarithmicOrbitsT);
                    };
                    const r1 = getRadius(fromPlanet, state);
                    const r2 = getRadius(toPlanet, state);
                    const maxDist = r1 + r2;
                    const minDist = Math.abs(r1 - r2);
                    const currentDist = Math.hypot(toPos3D.x - fromPos3D.x, toPos3D.y - fromPos3D.y, toPos3D.z - fromPos3D.z);
                    const range = maxDist - minDist;
                    const normalizedDist = range > 0.001 ? Math.max(0, Math.min(1, (currentDist - minDist) / range)) : 0;
                    finalColor = sampleGradient(state.lineGradient, normalizedDist);
                } else if (state.lineColorMode === 'orbit') {
                     const period = fromPlanet.period || 365.25;
                     const phase = (state.time % period) / period;
                     finalColor = sampleGradient(state.lineGradient, phase);
                }
            }

            const rgb = hexToRgb(finalColor);
            const r = rgb ? rgb.r / 255 : 1;
            const g = rgb ? rgb.g / 255 : 1;
            const b = rgb ? rgb.b / 255 : 1;

            for (let s = 0; s < this.segmentsPerLine; s++) {
                const quadIndex = lineCount * this.segmentsPerLine + s;
                for (let i = 0; i < 4; i++) {
                    const baseIdx = (quadIndex * 4 + i) * 3;
                    this.startPositions[baseIdx + 0] = currentFromX; 
                    this.startPositions[baseIdx + 1] = currentFromY; 
                    this.startPositions[baseIdx + 2] = currentFromZ;
                    
                    this.endPositions[baseIdx + 0] = tx; 
                    this.endPositions[baseIdx + 1] = ty; 
                    this.endPositions[baseIdx + 2] = tz;
                    
                    this.colors[baseIdx + 0] = r;
                    this.colors[baseIdx + 1] = g;
                    this.colors[baseIdx + 2] = b;
                    
                    this.opacities[quadIndex * 4 + i] = currentOpacity;
                }
            }
            lineCount++;
        }

        for (const fading of this.fadingConnections) {
            drawConnection(fading.connection, fading.progress);
        }

        for (const conn of connections) {
            drawConnection(conn, 0);
        }
        
        this.geometry.setDrawRange(0, lineCount * this.segmentsPerLine * 6);
        (this.geometry.attributes.startPosition as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.endPosition as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.lineColor as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.lineOpacity as THREE.BufferAttribute).needsUpdate = true;
    }
}
