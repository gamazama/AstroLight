import * as THREE from 'three';

const createNebulaTexture = (): THREE.Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

// --- Hybrid Gizmo Transform with Offset Compensation ---
const nebulaVertexShader = `
uniform vec3 u_worldRotation;
uniform vec2 u_pivotClip; // NDC space pivot
uniform vec2 u_offsetClip; // NDC space offset compensation
uniform float u_hasPivot;
uniform float uSizeScale;
attribute float particleSize;
varying vec3 vColor;

void main() {
    vColor = color;
    
    // 1. Camera Transform (View Space)
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // 2. Gizmo X/Y Rotation (Around Camera Origin 0,0,0)
    vec3 rad = u_worldRotation * 0.0174532925;
    
    if (rad.x != 0.0) { 
        float c = cos(rad.x); float s = sin(rad.x); 
        mvPosition.yz = vec2(mvPosition.y * c - mvPosition.z * s, mvPosition.y * s + mvPosition.z * c); 
    }
    if (rad.y != 0.0) { 
        float c = cos(rad.y); float s = sin(rad.y); 
        mvPosition.xz = vec2(mvPosition.x * c + mvPosition.z * s, -mvPosition.x * s + mvPosition.z * c); 
    }
    
    // 3. Project to Clip Space
    gl_Position = projectionMatrix * mvPosition;
    
    // 4. Gizmo Z Rotation & Offset
    if (u_hasPivot > 0.5) {
        vec2 ndc = gl_Position.xy / gl_Position.w;
        
        if (rad.z != 0.0) {
             float aspect = projectionMatrix[1][1] / projectionMatrix[0][0];
             vec2 diff = ndc - u_pivotClip;
             diff.x *= aspect;
             float c = cos(rad.z);
             float s = sin(rad.z);
             diff = vec2(diff.x * c - diff.y * s, diff.x * s + diff.y * c);
             diff.x /= aspect;
             ndc = u_pivotClip + diff;
        }
        
        // Apply the offset compensation to match foreground
        ndc += u_offsetClip;
        
        gl_Position.xy = ndc * gl_Position.w;
    }
    
    float z = -mvPosition.z;
    if (z < 0.1) z = 0.1;
    gl_PointSize = particleSize * uSizeScale * (500.0 / z); 
}
`;

const nebulaFragmentShader = `
uniform sampler2D map;
uniform float uOpacity;
varying vec3 vColor;

void main() {
    vec4 texColor = texture2D(map, gl_PointCoord);
    gl_FragColor = vec4(vColor, uOpacity) * texColor;
}
`;

export const createNebula = (): THREE.Points => {
    const geometry = new THREE.BufferGeometry();
    const count = 20000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const nebulaColors = [
        new THREE.Color('rgb(30,10,50)'), 
        new THREE.Color('rgb(10,30,50)'), 
        new THREE.Color('rgb(40,20,20)')
    ];

    for (let i = 0; i < count; i++) {
        positions[i*3] = (Math.random()-0.5)*3000;
        positions[i*3+1] = (Math.random()-0.5)*300;
        positions[i*3+2] = (Math.random()-0.5)*3000;
        
        const color = nebulaColors[Math.floor(Math.random()*3)];
        colors[i*3] = color.r; 
        colors[i*3+1] = color.g; 
        colors[i*3+2] = color.b;
        
        sizes[i] = Math.random()*1.5 + 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('particleSize', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({ 
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        uniforms: {
            map: { value: createNebulaTexture() },
            uOpacity: { value: 0.12 },
            uSizeScale: { value: 150.0 },
            
            u_worldRotation: { value: new THREE.Vector3(0,0,0) },
            u_pivotClip: { value: new THREE.Vector2(0,0) },
            u_offsetClip: { value: new THREE.Vector2(0,0) },
            u_hasPivot: { value: 0.0 },
            
            u_isPerspective: { value: true },
        },
        blending: THREE.AdditiveBlending, 
        transparent: true, 
        depthWrite: false, 
        depthTest: false,
        vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; 
    return points;
};