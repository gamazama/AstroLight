
import * as THREE from 'three';
import type { AppState, Particle } from '../../../types/index';
import { hexToRgb } from '../../../utils/colorUtils';
import { applyCameraTransform } from '../calculations';

// --- Particle Shaders ---
const particleVertexShader = `
  attribute vec3 particleColor;
  attribute vec4 lifeInfo; // x: life, y: maxLife, z: size, w: random phase
  attribute float isFlash;
  
  uniform bool u_isPerspective;
  uniform float u_time;
  uniform float u_diamondRatio;
  uniform float u_cameraDistance;

  // World Transform
  uniform vec3 u_pivotOffset; 
  uniform vec3 u_worldRotation;
  uniform vec3 u_viewPivot; // View Space Pivot
  uniform float u_hasPivot; 

  // DoF
  uniform float u_dofStrength;
  uniform float u_dofExponent;
  uniform float u_focusDistance;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vLifeRatio;
  varying float vIsFlash;
  varying float vIsDiamond;
  varying float vCoc;
  varying float vViewZ;

  vec3 applyGizmoTransform(vec3 viewPos) {
    if (u_hasPivot < 0.5) return viewPos;
    
    vec3 systemViewPos = viewPos;
    if (u_isPerspective) {
        systemViewPos.z += u_cameraDistance;
    }

    // 1. Local
    vec3 p = systemViewPos - u_viewPivot;
    // 2. Rotate
    vec3 rad = u_worldRotation * 0.0174532925;
    if (rad.x != 0.0) { float c = cos(rad.x); float s = sin(rad.x); p.yz = vec2(p.y * c - p.z * s, p.y * s + p.z * c); }
    if (rad.y != 0.0) { float c = cos(rad.y); float s = sin(rad.y); p.xz = vec2(p.x * c + p.z * s, -p.x * s + p.z * c); }
    if (rad.z != 0.0) { float c = cos(rad.z); float s = sin(rad.z); p.xy = vec2(p.x * c - p.y * s, p.x * s + p.y * c); }
    
    // 3. Back + Offset
    vec3 result = p + u_viewPivot + u_pivotOffset;

    if (u_isPerspective) {
        result.z -= u_cameraDistance;
    }
    return result;
  }

  void main() {
    vColor = particleColor;
    vIsFlash = isFlash;
    vIsDiamond = (lifeInfo.w < u_diamondRatio) ? 1.0 : 0.0;
    
    float lifeRatio = clamp(lifeInfo.x / lifeInfo.y, 0.0, 1.0);
    vLifeRatio = lifeRatio;

    float randomPhase = lifeInfo.w;
    float twinkle = 0.6 + 0.4 * sin(u_time * 0.0003 + randomPhase * 6.28318);
    
    vAlpha = lifeRatio * twinkle;
    
    // 1. Transform to View Space
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // 2. Gizmo Transform
    vec3 rotatedViewPos = applyGizmoTransform(mvPosition.xyz);
    mvPosition = vec4(rotatedViewPos, 1.0);
    
    float progress = 1.0 - lifeRatio;
    float peakTime = 0.1; 
    float sizePulse;
    if (progress < peakTime) {
        float growthProgress = progress / peakTime;
        sizePulse = sin(growthProgress * 1.570796); 
    } else {
        float decayProgress = (progress - peakTime) / (1.0 - peakTime);
        sizePulse = 1.0 - decayProgress;
    }
    float pointSize = lifeInfo.z * sizePulse;

    if (u_dofStrength > 0.0) {
        float viewZ = -mvPosition.z;
        float distRatio;
        if (u_isPerspective) {
             float safeZ = max(0.1, viewZ);
             distRatio = abs(safeZ - u_focusDistance) / safeZ;
             vViewZ = safeZ;
        } else {
             distRatio = abs(viewZ - u_focusDistance) / 1000.0;
             vViewZ = viewZ;
        }
        distRatio = min(10.0, distRatio);
        float blurFactor = smoothstep(0.0, u_dofExponent, distRatio);
        float coc = u_dofStrength * blurFactor;
        if (!u_isPerspective) coc *= 33.0;
        vCoc = coc;
        pointSize += coc;
    } else {
        vCoc = 0.0;
        vViewZ = -mvPosition.z;
    }

    if (u_isPerspective) {
      pointSize *= (1500.0 / -mvPosition.z);
    }
    
    gl_PointSize = pointSize * 5.0;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform vec3 uHotColor;
  uniform float u_glowGamma;
  uniform float u_focusDistance;
  uniform int u_blurType; 
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLifeRatio;
  varying float vIsFlash;
  varying float vIsDiamond;
  varying float vCoc;
  varying float vViewZ;

  void main() {
    if (vAlpha < 0.01) discard;

    float finalAlpha = vAlpha;
    float dist = distance(gl_PointCoord, vec2(0.5));
    float shapeAlpha = 0.0;

    if (vIsDiamond > 0.5) {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float diamondDist = abs(coord.x) + abs(coord.y);
      float edgeSoftness = 0.05 + vCoc * 0.1; 
      shapeAlpha = 1.0 - smoothstep(0.5 - edgeSoftness, 0.5, diamondDist);
    } else {
        if (u_blurType == 1 && vCoc > 2.0) {
            shapeAlpha = 1.0 - smoothstep(0.45, 0.5, dist);
        } else {
            float effectiveGamma = max(1.0, u_glowGamma - vCoc * 0.5); 
            shapeAlpha = pow(max(0.0, 1.0 - dist * 2.0), effectiveGamma);
        }
    }
    
    finalAlpha *= shapeAlpha;

    if (vCoc > 1.0) {
        float expansionRatio = 1.0 / (1.0 + vCoc * 0.3);
        if (vViewZ < u_focusDistance) {
             finalAlpha *= pow(expansionRatio, 0.1);
        } else {
             finalAlpha *= expansionRatio;
        }
    }

    if (finalAlpha < 0.01) discard;
    
    vec3 finalColor = vColor; 

    if (vIsFlash > 0.5) {
        float fadeProgress = clamp((1.0 - vLifeRatio) / 0.75, 0.0, 1.0);
        finalColor = mix(uHotColor, vColor, fadeProgress);
    }

    gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
  }
`;

class WebGLParticleRenderer {
    public mesh: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;

    private positions: Float32Array;
    private colors: Float32Array;
    private lifeInfos: Float32Array;
    private isFlash: Float32Array;

    private maxParticles: number;

    constructor() {
        this.maxParticles = 200000; 
        this.geometry = new THREE.BufferGeometry();

        this.positions = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.lifeInfos = new Float32Array(this.maxParticles * 4);
        this.isFlash = new Float32Array(this.maxParticles);

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('particleColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('lifeInfo', new THREE.BufferAttribute(this.lifeInfos, 4).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('isFlash', new THREE.BufferAttribute(this.isFlash, 1).setUsage(THREE.DynamicDrawUsage));

        this.material = new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                uHotColor: { value: new THREE.Color('#FFFFFF') }, 
                u_isPerspective: { value: true },
                u_time: { value: 0.0 },
                u_diamondRatio: { value: 0.0 },
                u_glowGamma: { value: 3.5 },
                u_dofStrength: { value: 0.0 },
                u_dofExponent: { value: 1.0 },
                u_focusDistance: { value: 800.0 },
                u_blurType: { value: 1 },
                u_cameraDistance: { value: 0.0 },
                // World Transform
                u_viewPivot: { value: new THREE.Vector3(0,0,0) }, // Ensure present
                u_pivotOffset: { value: new THREE.Vector3(0,0,0) },
                u_worldRotation: { value: new THREE.Vector3(0,0,0) },
                u_hasPivot: { value: 0.0 },
            },
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            premultipliedAlpha: true,
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.frustumCulled = false;
    }

    public dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }

    public update(particles: Particle[], state: AppState, elapsedTime: number) {
        let particleCount = 0;

        this.material.uniforms.u_isPerspective.value = state.renderMode === 'perspective';
        this.material.uniforms.u_time.value = elapsedTime;
        this.material.uniforms.u_diamondRatio.value = state.particleDiamondRatio;
        this.material.uniforms.u_glowGamma.value = state.particleGlowGamma;
        
        this.material.uniforms.u_dofStrength.value = state.dofStrength * 0.001;
        this.material.uniforms.u_dofExponent.value = state.dofExponent;
        this.material.uniforms.u_blurType.value = state.dofBlurType === 'bokeh' ? 1 : 0;
        
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
        
        if (state.renderMode === 'orthographic') {
            this.material.uniforms.u_focusDistance.value = state.dofFocusDistance;
            this.material.uniforms.u_cameraDistance.value = 0.0;
        } else {
            const cameraDistance = 4000 / state.actualZoom;
            this.material.uniforms.u_focusDistance.value = cameraDistance + state.dofFocusDistance;
            this.material.uniforms.u_cameraDistance.value = cameraDistance;
        }

        for (const particle of particles) {
            if (particleCount >= this.maxParticles) break;

            const pIdx = particleCount * 3;
            const lIdx = particleCount * 4;

            this.positions[pIdx] = particle.x;
            this.positions[pIdx + 1] = -particle.y; // Invert Y for GL
            this.positions[pIdx + 2] = -particle.z; // Invert Z for GL

            const rgb = hexToRgb(particle.color);
            if (rgb) {
                this.colors[pIdx] = rgb.r / 255;
                this.colors[pIdx + 1] = rgb.g / 255;
                this.colors[pIdx + 2] = rgb.b / 255;
            }

            this.lifeInfos[lIdx] = particle.life;
            this.lifeInfos[lIdx + 1] = particle.maxLife;
            this.lifeInfos[lIdx + 2] = state.renderMode === 'perspective' 
                ? particle.size 
                : particle.size * state.actualZoom * 0.5;
            this.lifeInfos[lIdx + 3] = particle.randomPhase; 
            
            this.isFlash[particleCount] = particle.isFlashParticle ? 1.0 : 0.0;
            
            particleCount++;
        }

        this.geometry.setDrawRange(0, particleCount);
        (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.particleColor as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.lifeInfo as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.attributes.isFlash as THREE.BufferAttribute).needsUpdate = true;
    }
}

export function init(scene: THREE.Scene): WebGLParticleRenderer {
    const particleRenderer = new WebGLParticleRenderer();
    scene.add(particleRenderer.mesh);
    return particleRenderer;
}

export function update(state: AppState, camera: THREE.Camera, renderer: WebGLParticleRenderer, elapsedTime: number) {
    renderer.mesh.visible = state.isSparkleMode && !state.debugDisableParticles;
    if (renderer.mesh.visible) {
        renderer.update(state.particles, state, elapsedTime);
    }
}

export function dispose(renderer: WebGLParticleRenderer) {
    renderer.dispose();
}
