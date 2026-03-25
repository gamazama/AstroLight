
import * as THREE from 'three';
import type { AppState } from '../../../types/index';
import { createGradientPlane } from './objects/scenePrimitives';
import { createNebula } from './objects/nebula';
import { createWebGLStars, MAX_WEBGL_STARS } from './objects/starfield';
import { threeJsBridge } from '../threeJsBridge';
import { SKYBOX_IMAGES } from '../../../data/skyboxData';
import { useAppStore } from '../../../store/appStore';
import { skyboxVertexShader, skyboxFragmentShader } from './shaders/skybox';

const textureCache = new Map<string, THREE.Texture>();

// Reusable temp objects to avoid GC
const tempVec = new THREE.Vector3();
const tempCamPersp = new THREE.PerspectiveCamera();
const tempCamOrtho = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

// Calculate the Screen Space Pivot (NDC)
function getClipSpacePivot(state: AppState): THREE.Vector2 | null {
    if (!state.pivotPoint) return null;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewPivotSim = state.pivotPoint;
    
    // Calculate camera Z-shift. In Perspective, the camera is at +Z.
    // To convert System-Centered coordinates (App) to Camera-Centered coordinates (GL View Space),
    // we must subtract the camera distance from Z.
    let zShift = 0;
    if (state.renderMode === 'perspective') {
        const cameraDistance = 4000 / state.actualZoom;
        zShift = -cameraDistance;
    }
    
    // Base Pivot (View Space -> GL Space)
    // App (x, y, z) -> GL View (x, -y, -z + shift)
    tempVec.set(viewPivotSim.x, -viewPivotSim.y, -viewPivotSim.z + zShift);
    
    if (state.renderMode === 'perspective') {
        tempCamPersp.aspect = width / height;
        tempCamPersp.fov = state.actualFov;
        // Apply the full foreground View Offset
        if (state.viewOffsetX !== 0 || state.viewOffsetY !== 0) {
            tempCamPersp.setViewOffset(width, height, -state.viewOffsetX, -state.viewOffsetY, width, height);
        } else {
            tempCamPersp.clearViewOffset();
        }
        tempCamPersp.updateProjectionMatrix();
        
        tempVec.applyMatrix4(tempCamPersp.projectionMatrix);
        
    } else {
        const effectiveZoom = state.actualZoom * 0.5;
        const frustumWidth = width / effectiveZoom;
        const frustumHeight = height / effectiveZoom;
        const worldPanX = state.viewOffsetX / effectiveZoom;
        const worldPanY = -state.viewOffsetY / effectiveZoom;

        tempCamOrtho.left = (-frustumWidth / 2) - worldPanX;
        tempCamOrtho.right = (frustumWidth / 2) - worldPanX;
        tempCamOrtho.top = (frustumHeight / 2) - worldPanY;
        tempCamOrtho.bottom = (-frustumHeight / 2) - worldPanY;
        
        tempCamOrtho.updateProjectionMatrix();
        
        tempVec.applyMatrix4(tempCamOrtho.projectionMatrix);
    }
    
    return new THREE.Vector2(tempVec.x, tempVec.y);
}

const shouldPreload = (): boolean => {
    const nav = navigator as any;
    if (nav.deviceMemory && nav.deviceMemory < 4) {
        return false;
    }
    return true;
};

function resolveAssetUrl(url: string): string {
    const base = import.meta.env.BASE_URL;
    // Already absolute with base prefix, or a full URL — use as-is
    if (url.startsWith(base) || url.startsWith('http')) return url;
    // Strip leading slash if present, then prepend base
    return base + url.replace(/^\//, '');
}

async function loadAndCacheTexture(imageUrl: string): Promise<THREE.Texture | null> {
    if (textureCache.has(imageUrl)) {
        return textureCache.get(imageUrl)!;
    }

    try {
        const response = await fetch(resolveAssetUrl(imageUrl));
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const blob = await response.blob();

        const imageBitmap = await createImageBitmap(blob);

        const texture = new THREE.Texture(imageBitmap);
        texture.needsUpdate = true;
        
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter; 
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const renderer = threeJsBridge.renderer;
        if (renderer) {
            renderer.initTexture(texture);
        }

        textureCache.set(imageUrl, texture);
        return texture;

    } catch (error) {
        console.error(`Error loading texture ${imageUrl}:`, error);
        return null;
    }
}

async function triggerTextureLoad(imageUrl: string, objects: BackgroundObjects) {
    if (!imageUrl || objects.isLoadingTexture) return;
    objects.isLoadingTexture = true; 
    
    const texture = await loadAndCacheTexture(imageUrl);
    
    if (texture) {
        objects.nextTexture = texture;
        objects.isCrossfading = true;
        objects.crossfadeProgress = 0;
    } else {
        objects.pendingTextureUrl = null; // Abort if failed
    }
    objects.isLoadingTexture = false;
}

async function triggerPerformanceLoad(imageUrl: string, objects: BackgroundObjects) {
    if (!imageUrl || objects.isLoadingTexture) return;
    objects.isLoadingTexture = true;

    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        const texture = new THREE.Texture(imageBitmap);
        texture.needsUpdate = true;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter; 
        texture.colorSpace = THREE.SRGBColorSpace;
        
        if (objects.activeTexture) {
            objects.activeTexture.dispose();
            for (const [key, val] of textureCache.entries()) {
                if (val === objects.activeTexture) textureCache.delete(key);
            }
        }

        objects.activeTexture = texture;
        const mat = objects.skyboxSphere.material as THREE.ShaderMaterial;
        mat.uniforms.map.value = texture;
        mat.uniforms.mapNext.value = null;
        mat.uniforms.uMix.value = 0.0;
        
        objects.currentTextureUrl = imageUrl;
        objects.transitionPhase = 'FADING_IN';

    } catch (e) {
        console.error("Performance load failed", e);
        objects.transitionPhase = 'IDLE'; 
    } finally {
        objects.isLoadingTexture = false;
    }
}

async function preloadAllTextures() {
    if (!shouldPreload()) return;
    const needsLoading = SKYBOX_IMAGES.some(img => !textureCache.has(img.path));
    if (!needsLoading) return;

    const actions = useAppStore.getState().actions;
    const total = SKYBOX_IMAGES.length;

    actions.updateUI({ backgroundLoadingProgress: 0 });
    
    for (let i = 0; i < total; i++) {
        const img = SKYBOX_IMAGES[i];
        if (!textureCache.has(img.path)) {
            await loadAndCacheTexture(img.path);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        actions.updateUI({ backgroundLoadingProgress: ((i + 1) / total) * 100 });
    }

    setTimeout(() => {
        actions.updateUI({ backgroundLoadingProgress: null });
    }, 500);
}

function _updateGradient(state: AppState, objects: BackgroundObjects) {
    objects.gradientPlane.visible = state.showBackgroundColor;
    if (state.showBackgroundColor) {
        const material = objects.gradientPlane.material as THREE.ShaderMaterial;
        if (state.useGradientBackground) {
            material.uniforms.color1.value.set(state.backgroundColor1);
            material.uniforms.color2.value.set(state.backgroundColor2);
        } else {
            material.uniforms.color1.value.set(state.backgroundColor2);
            material.uniforms.color2.value.set(state.backgroundColor2);
        }
    }
}

function _updateSkybox(state: AppState, delta: number, objects: BackgroundObjects) {
    const material = objects.skyboxSphere.material as THREE.ShaderMaterial;

    if (state.isPerformanceMode) {
        if (state.isSkyboxEnabled && state.skyboxImage !== objects.currentTextureUrl && objects.transitionPhase === 'IDLE') {
            objects.pendingTextureUrl = state.skyboxImage;
            objects.transitionPhase = 'FADING_OUT';
        }

        if (objects.transitionPhase === 'FADING_OUT') {
            objects.fadeOpacity -= delta * 2.0; 
            if (objects.fadeOpacity <= 0) {
                objects.fadeOpacity = 0;
                objects.transitionPhase = 'LOADING';
                if (objects.pendingTextureUrl) {
                    triggerPerformanceLoad(objects.pendingTextureUrl, objects);
                }
            }
        } else if (objects.transitionPhase === 'LOADING') {
            objects.fadeOpacity = 0;
        } else if (objects.transitionPhase === 'FADING_IN') {
            objects.fadeOpacity += delta * 1.5; 
            if (objects.fadeOpacity >= 1.0) {
                objects.fadeOpacity = 1.0;
                objects.transitionPhase = 'IDLE';
            }
        } else {
            objects.fadeOpacity = 1.0;
        }

        material.uniforms.uMix.value = 0.0;
    } 
    else {
        objects.fadeOpacity = 1.0; 
        if (state.isSkyboxEnabled && state.skyboxImage !== objects.currentTextureUrl && !objects.isCrossfading && !objects.isLoadingTexture) {
            objects.currentTextureUrl = state.skyboxImage;
            triggerTextureLoad(state.skyboxImage, objects);
        }
        if (objects.isCrossfading && objects.nextTexture) {
            material.uniforms.mapNext.value = objects.nextTexture;
            const FADE_SPEED = 1.0; 
            objects.crossfadeProgress += delta * FADE_SPEED;
            if (objects.crossfadeProgress >= 1.0) {
                objects.crossfadeProgress = 0;
                objects.isCrossfading = false;
                objects.activeTexture = objects.nextTexture;
                material.uniforms.map.value = objects.activeTexture;
                material.uniforms.uMix.value = 0.0;
                objects.nextTexture = null;
            } else {
                material.uniforms.uMix.value = objects.crossfadeProgress;
            }
        }
    }

    const baseOpacity = (objects.activeTexture || objects.isCrossfading) ? state.skyboxOpacity : 0;
    const finalOpacity = baseOpacity * objects.fadeOpacity;
    const visible = state.isSkyboxEnabled && finalOpacity > 0;

    material.uniforms.uOpacity.value = finalOpacity;
    objects.skyboxSphere.visible = visible;

    material.uniforms.u_isPerspective.value = state.renderMode === 'perspective';
    material.uniforms.u_dofStrength.value = state.dofStrength; 
    material.uniforms.u_dofExponent.value = state.dofExponent;
    
    if (state.renderMode === 'orthographic') {
        material.uniforms.u_focusDistance.value = state.dofFocusDistance;
    } else {
        const cameraDistance = 4000 / state.actualZoom;
        material.uniforms.u_focusDistance.value = cameraDistance + state.dofFocusDistance;
    }
}

function _updateNebula(state: AppState, camera: THREE.PerspectiveCamera, objects: BackgroundObjects) {
    objects.nebula.visible = state.showNebula;
    if (state.showNebula) {
        objects.nebula.rotation.y = state.time * 0.000005;
        objects.nebula.position.y = state.nebulaYOffset; // Local offset within the locked group
        
        const mat = objects.nebula.material as THREE.ShaderMaterial;
        mat.uniforms.uOpacity.value = state.nebulaOpacity;
        mat.uniforms.u_isPerspective.value = state.renderMode === 'perspective';
        
        if(mat.uniforms.uSizeScale) {
            const fovCorrection = Math.tan(75*0.5*Math.PI/180) / Math.tan(camera.fov*0.5*Math.PI/180);
            mat.uniforms.uSizeScale.value = state.nebulaParticleSize * fovCorrection;
        }
    }
}

function _updateStars(state: AppState, camera: THREE.PerspectiveCamera, objects: BackgroundObjects, delta: number) {
    objects.webglStars.visible = state.showStars && !state.debugDisableStars;
    if (objects.webglStars.visible) {
        const mat = objects.webglStars.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value += delta * state.webGLStarSpeed;
        mat.uniforms.uSize.value = state.starSize * 10;
        mat.uniforms.uColor.value.set(state.webGLStarColor);
        mat.uniforms.uFar.value = camera.far;
        mat.uniforms.uOpacity.value = state.starOpacity;
        mat.uniforms.uShowStarColors.value = state.showStarColors ? 1.0 : 0.0;
        mat.uniforms.uTwinkleAmount.value = state.starTwinkleAmount;
        
        mat.uniforms.u_isPerspective.value = state.renderMode === 'perspective';
        mat.uniforms.u_dofStrength.value = state.dofStrength * 0.2;
        mat.uniforms.u_dofExponent.value = state.dofExponent;
        
        const renderer = threeJsBridge.renderer;
        const height = renderer ? renderer.getSize(new THREE.Vector2()).height : window.innerHeight;
        mat.uniforms.u_viewportHeight.value = height;

        if (state.renderMode === 'orthographic') {
            mat.uniforms.u_focusDistance.value = state.dofFocusDistance;
            mat.uniforms.u_cameraDistance.value = 0.0;
        } else {
            const cameraDistance = 4000 / state.actualZoom;
            mat.uniforms.u_focusDistance.value = cameraDistance + state.dofFocusDistance;
            mat.uniforms.u_cameraDistance.value = cameraDistance;
        }

        // World Transform Uniforms for Stars
        if (state.pivotPoint) {
             mat.uniforms.u_hasPivot.value = 1.0;
             
             const viewPivotSim = state.pivotPoint;
             
             mat.uniforms.u_pivotPoint.value.set(state.pivotPoint.x, -state.pivotPoint.y, -state.pivotPoint.z);
             mat.uniforms.u_viewPivot.value.set(viewPivotSim.x, -viewPivotSim.y, -viewPivotSim.z);

             mat.uniforms.u_worldRotation.value.set(state.worldRotation.x, -state.worldRotation.y, -state.worldRotation.z);
             const offset = state.pivotOffset || { x: 0, y: 0, z: 0 };
             mat.uniforms.u_pivotOffset.value.set(offset.x, -offset.y, -offset.z);
        } else {
             mat.uniforms.u_hasPivot.value = 0.0;
        }

        (objects.webglStars.geometry as THREE.BufferGeometry).setDrawRange(0, Math.min(MAX_WEBGL_STARS, state.starCount));
    }
}

function _updateDrift(state: AppState, objects: BackgroundObjects, delta: number) {
    if (state.enableLineZDrift && state.lineZDriftSpeed !== 0 && state.isPlaying) {
        const driftAmount = state.lineZDriftSpeed * state.timeSpeed * delta;
        if (state.webGLStarsOpposeDrift) {
            if (state.lineDriftAxis === 'x') objects.driftOffset.x -= driftAmount;
            else objects.driftOffset.z += driftAmount;
        } else {
            objects.driftOffset[state.lineDriftAxis] -= driftAmount;
        }
    }
    (objects.webglStars.material as THREE.ShaderMaterial).uniforms.uDrift.value.copy(objects.driftOffset);
}

function _updateParallax(state: AppState, camera: THREE.PerspectiveCamera) {
    const parallaxFactor = 0.1;
    const parallaxOffsetX = -state.viewOffsetX * parallaxFactor;
    const parallaxOffsetY = -state.viewOffsetY * parallaxFactor;
    const { innerWidth, innerHeight } = window;

    if (Math.abs(state.viewOffsetX) > 0.1 || Math.abs(state.viewOffsetY) > 0.1) {
        camera.setViewOffset(innerWidth, innerHeight, parallaxOffsetX, parallaxOffsetY, innerWidth, innerHeight);
    } else if (camera.view) {
        camera.clearViewOffset();
    }
}

function _updateCameraRotation(state: AppState, camera: THREE.PerspectiveCamera) {
    const rotMultiplier = (state.enableLineZDrift && state.lineDriftAxis === 'x') ? 1 : -1;
    const finalRotRad = (state.rotation * rotMultiplier) * (Math.PI / 180);
    const finalTiltRad = (state.tilt * -1) * (Math.PI / 180);
    
    camera.rotation.order = 'ZYX';
    camera.rotation.z = finalRotRad;
    camera.rotation.x = finalTiltRad;
    camera.rotation.y = 0;
}

function _updateUniforms(state: AppState, objects: BackgroundObjects, camera: THREE.Camera) {
    const hasPivot = state.pivotPoint ? 1.0 : 0.0;
    const rotX = state.worldRotation.x;
    const rotY = -state.worldRotation.y;
    const rotZ = -state.worldRotation.z;

    // Screen Space Logic for seamless background movement when pivot changes.
    // 1. Get Current Pivot in NDC
    const currentPivot = getClipSpacePivot(state);

    // 2. Calculate accumulated offset if pivot moved
    if (currentPivot && objects.prevPivotClip && hasPivot > 0.5) {
        const diff = new THREE.Vector2().subVectors(objects.prevPivotClip, currentPivot);
        
        // If there was a meaningful shift in the pivot...
        if (diff.lengthSq() > 0.000001) {
             // Apply rotation to the difference vector to determine visual correction.
             // We need the rotation applied by the shader: Roll (Z) around the pivot.
             // Shader logic: vec2(x*c - y*s, x*s + y*c) for positive Z rotation.
             const radZ = rotZ * 0.0174532925;
             const c = Math.cos(radZ);
             const s = Math.sin(radZ);
             
             // Aspect Ratio Correction for rotation
             // (Same as shader logic to ensure circular rotation on rectangular screen)
             const aspect = camera instanceof THREE.PerspectiveCamera ? camera.aspect : (window.innerWidth / window.innerHeight);
             
             const dx = diff.x * aspect;
             const dy = diff.y;
             
             // Rotate the delta
             const rotDx = dx * c - dy * s;
             const rotDy = dx * s + dy * c;
             
             const rotatedDelta = new THREE.Vector2(rotDx / aspect, rotDy);
             
             // The visual shift caused by moving the pivot is: Delta - RotatedDelta
             const correction = new THREE.Vector2().subVectors(diff, rotatedDelta);
             
             objects.accumulatedOffset.add(correction);
        }
    } else if (!hasPivot) {
        // Reset accumulator if pivot is cleared
        objects.accumulatedOffset.set(0, 0);
    }
    
    // Update prevPivot for next frame
    if (currentPivot) {
        objects.prevPivotClip.copy(currentPivot);
    }

    const pivotToUse = currentPivot || new THREE.Vector2(0,0);

    // 1. Update Uniforms for Skybox
    const sbMat = objects.skyboxSphere.material as THREE.ShaderMaterial;
    sbMat.uniforms.u_hasPivot.value = hasPivot;
    sbMat.uniforms.u_worldRotation.value.set(rotX, rotY, rotZ);
    sbMat.uniforms.u_pivotClip.value.copy(pivotToUse);
    sbMat.uniforms.u_offsetClip.value.copy(objects.accumulatedOffset);
    
    // 2. Update Uniforms for Nebula
    const nebMat = objects.nebula.material as THREE.ShaderMaterial;
    if (nebMat.uniforms) {
        nebMat.uniforms.u_hasPivot.value = hasPivot;
        nebMat.uniforms.u_worldRotation.value.set(rotX, rotY, rotZ);
        nebMat.uniforms.u_pivotClip.value.copy(pivotToUse);
        nebMat.uniforms.u_offsetClip.value.copy(objects.accumulatedOffset);
    }
    
    // 3. Lock Background Group to Camera
    objects.backgroundGroup.position.copy(camera.position);
    objects.backgroundGroup.updateMatrixWorld();
}

export type BackgroundObjects = {
    backgroundGroup: THREE.Group;
    gradientPlane: THREE.Mesh;
    skyboxSphere: THREE.Mesh;
    nebula: THREE.Points;
    webglStars: THREE.Points;
    
    currentTextureUrl: string | null;
    pendingTextureUrl: string | null; 
    activeTexture: THREE.Texture | null; 
    nextTexture: THREE.Texture | null;   
    crossfadeProgress: number;          
    isCrossfading: boolean;
    isLoadingTexture: boolean;
    transitionPhase: 'IDLE' | 'FADING_OUT' | 'LOADING' | 'FADING_IN';
    fadeOpacity: number; 
    driftOffset: THREE.Vector3;
    
    // New fields for seamless pivot transition
    prevPivotClip: THREE.Vector2;
    accumulatedOffset: THREE.Vector2;
};

export function init(scene: THREE.Scene, camera: THREE.Camera): BackgroundObjects {
    const gradientPlane = createGradientPlane(camera);
    scene.add(camera);

    const backgroundGroup = new THREE.Group();
    scene.add(backgroundGroup);
    
    const sphereGeometry = new THREE.SphereGeometry(25000, 60, 40);
    sphereGeometry.scale(-1, 1, 1);
    
    const skyboxMaterial = new THREE.ShaderMaterial({
        vertexShader: skyboxVertexShader,
        fragmentShader: skyboxFragmentShader,
        uniforms: {
            map: { value: null },
            mapNext: { value: null },
            uMix: { value: 0.0 },
            uOpacity: { value: 0.0 },
            u_isPerspective: { value: true },
            u_dofStrength: { value: 0.0 },
            u_dofExponent: { value: 1.0 },
            u_focusDistance: { value: 0.0 },
            
            // Gizmo / World Transform
            u_worldRotation: { value: new THREE.Vector3(0,0,0) },
            u_pivotClip: { value: new THREE.Vector2(0,0) },
            u_offsetClip: { value: new THREE.Vector2(0,0) },
            u_hasPivot: { value: 0.0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
    });

    const skyboxSphere = new THREE.Mesh(sphereGeometry, skyboxMaterial);
    skyboxSphere.renderOrder = -1;
    backgroundGroup.add(skyboxSphere); 

    const nebula = createNebula();
    backgroundGroup.add(nebula); 

    const webglStars = createWebGLStars();
    scene.add(webglStars); 
    
    setTimeout(() => {
        requestIdleCallback ? requestIdleCallback(preloadAllTextures) : setTimeout(preloadAllTextures, 1000);
    }, 2500);

    return { 
        backgroundGroup, gradientPlane, skyboxSphere, nebula, webglStars, 
        currentTextureUrl: null, pendingTextureUrl: null, activeTexture: null, nextTexture: null,
        crossfadeProgress: 0, isCrossfading: false, isLoadingTexture: false,
        transitionPhase: 'IDLE', fadeOpacity: 1.0, driftOffset: new THREE.Vector3(),
        prevPivotClip: new THREE.Vector2(0,0),
        accumulatedOffset: new THREE.Vector2(0,0)
    };
}

export function update(state: AppState, delta: number, camera: THREE.PerspectiveCamera, objects: BackgroundObjects) {
    _updateGradient(state, objects);
    _updateSkybox(state, delta, objects);
    _updateNebula(state, camera, objects);
    _updateStars(state, camera, objects, delta);
    _updateDrift(state, objects, delta);
    _updateParallax(state, camera);
    _updateCameraRotation(state, camera);
    _updateUniforms(state, objects, camera);
}

export function dispose(objects: BackgroundObjects) {
    objects.gradientPlane.geometry.dispose();
    (objects.gradientPlane.material as THREE.Material).dispose();
    objects.skyboxSphere.geometry.dispose();
    const skyboxMat = objects.skyboxSphere.material as THREE.ShaderMaterial;
    skyboxMat.dispose();
    objects.nebula.geometry.dispose();
    const nebulaMat = objects.nebula.material as THREE.ShaderMaterial;
    if (nebulaMat.uniforms.map.value) nebulaMat.uniforms.map.value.dispose();
    nebulaMat.dispose();
    objects.webglStars.geometry.dispose();
    (objects.webglStars.material as THREE.Material).dispose();
}
