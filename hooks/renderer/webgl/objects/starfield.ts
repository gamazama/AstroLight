
import * as THREE from 'three';
import { webglStarVertexShader } from '../shaders/starfield.vert';
import { webglStarFragmentShader } from '../shaders/starfield.frag';

export const MAX_WEBGL_STARS = 50000;
const STAR_SPREAD = 30000;

export const createWebGLStars = (): THREE.Points => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_WEBGL_STARS*3);
    const colors = new Float32Array(MAX_WEBGL_STARS*3);
    const infos = new Float32Array(MAX_WEBGL_STARS*3);
    const STAR_COLORS = [
        new THREE.Color('#B7B9D4'), 
        new THREE.Color('#F9C74F'), 
        new THREE.Color('#E94560'), 
        new THREE.Color('#F9FBCB'), 
        new THREE.Color('#1A1A2E'), 
        new THREE.Color('#2C3E50')
    ];
    for(let i=0; i<MAX_WEBGL_STARS; i++){
        positions[i*3]=(Math.random()-.5)*STAR_SPREAD; positions[i*3+1]=(Math.random()-.5)*STAR_SPREAD; positions[i*3+2]=(Math.random()-.5)*STAR_SPREAD;
        const color = STAR_COLORS[Math.floor(Math.random()*STAR_COLORS.length)];
        colors[i*3]=color.r; colors[i*3+1]=color.g; colors[i*3+2]=color.b;
        infos[i*3]=Math.random(); infos[i*3+1]=Math.random(); infos[i*3+2]=Math.random()*.5+.5;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors,3));
    geometry.setAttribute('aInfo', new THREE.BufferAttribute(infos,3)); 
    const material = new THREE.ShaderMaterial({ 
        vertexShader: webglStarVertexShader, 
        fragmentShader: webglStarFragmentShader, 
        uniforms: {
            uTime: { value: 0 }, 
            uSize: { value: 1 }, 
            uColor: { value: new THREE.Color('#ffffff') }, 
            uDrift: { value: new THREE.Vector3(0,0,0) }, 
            uFar: { value: 4e4 }, 
            uOpacity: { value: .7 }, 
            uShowStarColors: { value: 1.0 }, 
            uTwinkleAmount: { value: 0.4 },
            u_cameraDistance: { value: 0.0 },
            // DoF Uniforms
            u_isPerspective: { value: true },
            u_dofStrength: { value: 0.0 },
            u_dofExponent: { value: 1.0 },
            u_focusDistance: { value: 800.0 },
            u_viewportHeight: { value: 1080.0 },
            // World Transform (Gizmo)
            u_viewPivot: { value: new THREE.Vector3(0,0,0) }, 
            u_pivotPoint: { value: new THREE.Vector3(0,0,0) },
            u_pivotOffset: { value: new THREE.Vector3(0,0,0) },
            u_worldRotation: { value: new THREE.Vector3(0,0,0) },
            u_hasPivot: { value: 0.0 }
        }, 
        blending: THREE.AdditiveBlending, 
        transparent: true, 
        depthWrite: false, 
        depthTest: false 
    });
    return new THREE.Points(geometry, material);
}
