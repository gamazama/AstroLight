
import * as THREE from 'three';
import type { AppState, Line } from '../../../../types/index';
import { hexToRgb } from '../../../../utils/colorUtils';
import { LINE_FADE_SECONDS } from '../../../../constants';
import { threeJsBridge } from '../../threeJsBridge';
import { historyLineVertexShader } from '../shaders/historyLine.vert';
import { lineFragmentShader } from '../shaders/line.frag';
import { applyCameraTransform } from '../../calculations';

export class HistoryLineRenderer {
    public mesh: THREE.Mesh;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;

    private startPositions: Float32Array;
    private endPositions: Float32Array;
    private colors: Float32Array;
    private timeInfos: Float32Array;
    private dyingParams: Float32Array;
    
    private maxLines: number;
    private flowTime: number = 0;
    private noiseTime: number = 0;
    private textureTime: number = 0; 
    private lastTime: number = 0;

    constructor(maxLines: number) {
        this.maxLines = maxLines;
        const totalQuads = maxLines; 

        this.geometry = new THREE.BufferGeometry();
        
        this.startPositions = new Float32Array(totalQuads * 4 * 3);
        this.endPositions = new Float32Array(totalQuads * 4 * 3);
        this.colors = new Float32Array(totalQuads * 4 * 3);
        this.timeInfos = new Float32Array(totalQuads * 4 * 2);
        this.dyingParams = new Float32Array(totalQuads * 4 * 3);
        
        const uvs = new Float32Array(totalQuads * 4 * 2);
        
        for (let i = 0; i < maxLines; i++) {
            const base = i * 4 * 2;
            uvs[base + 0] = 0; uvs[base + 1] = 0;
            uvs[base + 2] = 1; uvs[base + 3] = 0;
            uvs[base + 4] = 0; uvs[base + 5] = 1;
            uvs[base + 6] = 1; uvs[base + 7] = 1;
        }

        const indices = new Uint32Array(totalQuads * 6);
        for (let i = 0; i < totalQuads; i++) {
            const base = i * 4;
            indices[i * 6 + 0] = base + 0;
            indices[i * 6 + 1] = base + 1;
            indices[i * 6 + 2] = base + 2;
            indices[i * 6 + 3] = base + 1;
            indices[i * 6 + 4] = base + 3;
            indices[i * 6 + 5] = base + 2;
        }
        this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        this.geometry.setAttribute('startPosition', new THREE.BufferAttribute(this.startPositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('endPosition', new THREE.BufferAttribute(this.endPositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('lineUv', new THREE.BufferAttribute(uvs, 2));
        this.geometry.setAttribute('lineColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('timeInfo', new THREE.BufferAttribute(this.timeInfos, 2).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('dyingParams', new THREE.BufferAttribute(this.dyingParams, 3).setUsage(THREE.DynamicDrawUsage));

        this.material = new THREE.ShaderMaterial({
            vertexShader: historyLineVertexShader,
            fragmentShader: lineFragmentShader,
            uniforms: {
                u_currentTime: { value: 0.0 },
                u_elapsedTime: { value: 0.0 },
                u_opacity: { value: 1.0 },
                u_lineWidth: { value: 1.0 },
                u_lineFadeSeconds: { value: LINE_FADE_SECONDS },
                u_isOrthographic: { value: 0.0 },
                u_lineSoftness: { value: 0.5 },
                u_isMycelium: { value: 0.0 }, 
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
                // World Transform Uniforms
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

    private _updateUniforms(state: AppState) {
        const now = performance.now();
        if (this.lastTime === 0) this.lastTime = now;
        
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        if (state.isMyceliumMode) {
            this.flowTime += dt * state.myceliumFlowSpeed;
            const speedCurve = 0.5 + 0.9 * Math.log10(Math.max(1, state.timeSpeed));
            this.noiseTime += dt * speedCurve * 1.5 * state.myceliumWiggleSpeed;
            this.textureTime += dt * state.myceliumTextureSpeed;
        }

        this.material.uniforms.u_currentTime.value = state.time;
        this.material.uniforms.u_elapsedTime.value = now / 1000.0;
        this.material.uniforms.u_opacity.value = state.lineOpacityMultiplier * state.webglLineBrightness;
        this.material.uniforms.u_lineSoftness.value = state.lineSoftness;
        this.material.uniforms.u_isMycelium.value = state.isMyceliumMode ? 1.0 : 0.0;
        
        this.material.uniforms.u_dofStrength.value = state.dofStrength * 0.001; 
        this.material.uniforms.u_dofExponent.value = state.dofExponent;
        this.material.uniforms.u_dofBlurBrightness.value = state.dofBlurBrightness;
        this.material.uniforms.u_blurType.value = state.dofBlurType === 'bokeh' ? 1 : 0;
        this.material.uniforms.u_minAlpha.value = state.minLineAlpha;
        
        // World Transform Uniforms
        if (state.pivotPoint) {
             this.material.uniforms.u_hasPivot.value = 1.0;
             
             // PivotPoint is already in View Space, just need to flip Y/Z for GL coordinate space.
             // DO NOT re-apply camera transform here.
             const viewPivotSim = state.pivotPoint;
             
             // Invert Y/Z for WebGL Coordinate Space
             this.material.uniforms.u_viewPivot.value.set(viewPivotSim.x, -viewPivotSim.y, -viewPivotSim.z);

             // Invert Y/Z rotation to match Canvas Gizmo logic in this coordinate space
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
        
        if (state.isMyceliumMode) {
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
        
        const NORMAL_LINE_WIDTH = 0.2;
        const relativeWidth = Math.max(0.1, state.lineWidth / NORMAL_LINE_WIDTH);
        const scaledRelativeWidth = Math.pow(relativeWidth, 0.5);

        const baseConstant = state.isMyceliumMode ? 3.0 : 1.6;
        const desiredThickness = baseConstant * scaledRelativeWidth;

        const renderer = threeJsBridge.renderer;
        const viewportHeight = renderer ? renderer.getSize(new THREE.Vector2()).height : window.innerHeight;

        if (state.renderMode === 'orthographic') {
            this.material.uniforms.u_lineWidth.value = (desiredThickness * 2.0) / state.actualZoom;
            this.material.uniforms.u_isOrthographic.value = 1.0;
        
        } else { // Perspective
            const fovInRadians = state.actualFov * Math.PI / 180;
            const tanHalfFov = Math.tan(fovInRadians / 2);
            const finalLineWidthFactor = desiredThickness * tanHalfFov * 2.0 / viewportHeight;
            
            this.material.uniforms.u_lineWidth.value = finalLineWidthFactor;
            this.material.uniforms.u_isOrthographic.value = 0.0;
        }
    }

    private _updateBlending(state: AppState) {
        if (state.debugDoFMode !== 'none') {
            this.material.blending = THREE.NormalBlending;
            this.material.depthWrite = true;
        } else {
            this.material.depthWrite = false;
            
            if (state.lineBlendMode === 'multiply') {
                this.material.blending = THREE.CustomBlending;
                this.material.blendEquation = THREE.AddEquation;
                this.material.blendSrc = THREE.DstColorFactor;
                this.material.blendDst = THREE.OneMinusSrcAlphaFactor;
            } else if (state.lineBlendMode === 'screen') {
                this.material.blending = THREE.CustomBlending;
                this.material.blendEquation = THREE.AddEquation;
                this.material.blendSrc = THREE.OneMinusDstColorFactor;
                this.material.blendDst = THREE.OneFactor;
            } else if (state.lineBlendMode === 'lighter') {
                this.material.blending = THREE.AdditiveBlending;
            } else { // 'source-over'
                this.material.blending = THREE.NormalBlending;
            }
        }
        this.material.needsUpdate = true;
    }

    private _updateGeometry(lines: Line[], state: AppState) {
        let quadCount = 0;
        const zOffsets = state.actualZOffsets;
        const brightnessBoost = state.webglLineBrightness;

        for (const line of lines) {
            if (quadCount >= this.maxLines) break;

            const currentQuadIndex = quadCount;
            const spIdx = currentQuadIndex * 4 * 3;
            const epIdx = currentQuadIndex * 4 * 3;
            const cIdx = currentQuadIndex * 4 * 3;
            const tIdx = currentQuadIndex * 4 * 2;
            const dIdx = currentQuadIndex * 4 * 3;

            const fromOffset = zOffsets[line.fromPlanetName] ?? 0;
            const toOffset = zOffsets[line.toPlanetName] ?? 0;
            
            // Store RAW world positions (WebGL Y is Up, Canvas is Down, invert appropriately)
            const fx = line.from.x;
            const fy = -line.from.y;
            const fz = -(line.from.z + fromOffset);
            
            const tx = line.to.x;
            const ty = -line.to.y;
            const tz = -(line.to.z + toOffset);

            const rgb = hexToRgb(line.color);
            const r = rgb ? rgb.r / 255 : 1;
            const g = rgb ? rgb.g / 255 : 1;
            const b = rgb ? rgb.b / 255 : 1;
            
            const dyingX = line.isDying ? 1.0 : 0.0;
            const dyingY = line.isDying ? (line.timeToLive ?? 0.0) : 0.0;
            const dyingZ = line.isDying ? (line.startFadeOpacity ?? 1.0) * brightnessBoost : 0.0;

            for(let i=0; i<4; i++) {
                this.startPositions[spIdx + i*3 + 0] = fx;
                this.startPositions[spIdx + i*3 + 1] = fy;
                this.startPositions[spIdx + i*3 + 2] = fz;

                this.endPositions[epIdx + i*3 + 0] = tx;
                this.endPositions[epIdx + i*3 + 1] = ty;
                this.endPositions[epIdx + i*3 + 2] = tz;

                this.colors[cIdx + i*3 + 0] = r;
                this.colors[cIdx + i*3 + 1] = g;
                this.colors[cIdx + i*3 + 2] = b;
                
                this.timeInfos[tIdx + i*2 + 0] = line.time;
                this.timeInfos[tIdx + i*2 + 1] = line.persistence;

                this.dyingParams[dIdx + i*3 + 0] = dyingX;
                this.dyingParams[dIdx + i*3 + 1] = dyingY;
                this.dyingParams[dIdx + i*3 + 2] = dyingZ;
            }
            
            quadCount++;
        }

        this.geometry.setDrawRange(0, quadCount * 6);
        (this.geometry.attributes.startPosition as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.endPosition as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.lineColor as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.timeInfo as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.dyingParams as THREE.BufferAttribute).needsUpdate = true;
    }

    public update(lines: Line[], state: AppState) {
        this._updateUniforms(state);
        this._updateBlending(state);
        this._updateGeometry(lines, state);
    }
}
