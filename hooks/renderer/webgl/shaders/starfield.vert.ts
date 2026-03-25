
export const webglStarVertexShader = `
  attribute vec3 aColor;
  attribute vec3 aInfo; // x: random phase, y: random speed, z: size multiplier
  
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uDrift;
  uniform float uTwinkleAmount;
  uniform float u_cameraDistance;
  
  // DoF
  uniform bool u_isPerspective;
  uniform float u_dofStrength;
  uniform float u_dofExponent;
  uniform float u_focusDistance;

  // World Transform
  uniform vec3 u_pivotOffset; 
  uniform vec3 u_worldRotation;
  uniform vec3 u_viewPivot; // View Space Pivot
  uniform float u_hasPivot; 
  
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vDepth;
  varying float vCoc; 
  varying float vBaseSize; 
  
  vec3 wrap(vec3 p, float size) { return mod(p + size/2.0, size) - size/2.0; }

  vec3 applyGizmoTransform(vec3 viewPos) {
    if (u_hasPivot < 0.5) return viewPos;
    
    vec3 systemViewPos = viewPos;
    if (u_isPerspective) {
        systemViewPos.z += u_cameraDistance;
    }

    vec3 p = systemViewPos - u_viewPivot;
    vec3 rad = u_worldRotation * 0.0174532925; 
    if (rad.x != 0.0) { float c=cos(rad.x); float s=sin(rad.x); p.yz=vec2(p.y*c-p.z*s, p.y*s+p.z*c); }
    if (rad.y != 0.0) { float c=cos(rad.y); float s=sin(rad.y); p.xz=vec2(p.x*c+p.z*s, -p.x*s+p.z*c); }
    if (rad.z != 0.0) { float c=cos(rad.z); float s=sin(rad.z); p.xy=vec2(p.x*c-p.y*s, p.x*s+p.y*c); }
    
    vec3 result = p + u_viewPivot + u_pivotOffset;
    
    if (u_isPerspective) {
        result.z -= u_cameraDistance;
    }
    
    return result;
  }
  
  void main() {
    vColor = aColor;
    float twinkleSpeed = aInfo.y * 2.0 + 0.5;
    float baseTwinkle = (sin(uTime * twinkleSpeed + aInfo.x * 6.28) + 1.0) * 0.5;
    vTwinkle = 1.0 - uTwinkleAmount + baseTwinkle * uTwinkleAmount;
    
    vec3 finalPos = wrap(position + uDrift, 30000.0);
    
    // 1. Transform to View Space (Standard Camera)
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // 2. Apply Gizmo World Rotation (in View Space)
    vec3 rotatedViewPos = applyGizmoTransform(mvPosition.xyz);
    mvPosition = vec4(rotatedViewPos, 1.0);
    
    float viewZ = -mvPosition.z;
    vDepth = viewZ;
    
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = uSize * aInfo.z;
    if (u_isPerspective) {
        baseSize *= (1500.0 / viewZ);
    } else {
        baseSize *= 0.08;
    }
    vBaseSize = baseSize;

    float coc = 0.0;
    if (u_dofStrength > 0.0) {
        float distRatio;
        if (u_isPerspective) {
            float safeZ = max(0.1, viewZ);
            distRatio = abs(safeZ - u_focusDistance) / safeZ;
        } else {
            distRatio = abs(viewZ - u_focusDistance) / 1000.0;
        }
        distRatio = min(10.0, distRatio);
        float blurFactor = smoothstep(0.0, u_dofExponent, distRatio);
        coc = u_dofStrength * blurFactor;
    }
    vCoc = coc;
    gl_PointSize = baseSize + coc;
  }
`;