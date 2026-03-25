
export const skyboxVertexShader = `
varying vec2 vUv;
varying float vViewZ;

uniform vec3 u_worldRotation;
uniform vec2 u_pivotClip; // NDC space pivot (-1 to 1)
uniform vec2 u_offsetClip; // NDC space offset compensation
uniform float u_hasPivot;

void main() {
  vUv = uv;
  
  // 1. Camera Transform (View Space)
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // 2. Gizmo X/Y Rotation (Around Camera Origin 0,0,0)
  vec3 rad = u_worldRotation * 0.0174532925; // Deg to Rad
  
  if (rad.x != 0.0) { 
      float c = cos(rad.x); float s = sin(rad.x); 
      mvPosition.yz = vec2(mvPosition.y * c - mvPosition.z * s, mvPosition.y * s + mvPosition.z * c); 
  }
  if (rad.y != 0.0) { 
      float c = cos(rad.y); float s = sin(rad.y); 
      mvPosition.xz = vec2(mvPosition.x * c + mvPosition.z * s, -mvPosition.x * s + mvPosition.z * c); 
  }

  vViewZ = -mvPosition.z;
  
  // 3. Project to Clip Space
  gl_Position = projectionMatrix * mvPosition;
  
  // 4. Gizmo Z Rotation (Screen Space Roll around Projected Pivot)
  if (u_hasPivot > 0.5 && rad.z != 0.0) {
      // Convert to NDC for rotation (removes depth/w influence)
      vec2 ndc = gl_Position.xy / gl_Position.w;
      
      float aspect = projectionMatrix[1][1] / projectionMatrix[0][0];
      
      vec2 diff = ndc - u_pivotClip;
      diff.x *= aspect;
      
      float c = cos(rad.z);
      float s = sin(rad.z);
      diff = vec2(diff.x * c - diff.y * s, diff.x * s + diff.y * c);
      
      diff.x /= aspect;
      
      // Apply Rotation + Offset Compensation
      ndc = u_pivotClip + diff + u_offsetClip;
      
      // Convert back to Homogeneous Clip Space
      gl_Position.xy = ndc * gl_Position.w;
  } else if (u_hasPivot > 0.5) {
      // Even if not rotating Z, we must apply the offset if a pivot exists
      // This handles the "jump" when moving the pivot point.
      vec2 ndc = gl_Position.xy / gl_Position.w;
      ndc += u_offsetClip;
      gl_Position.xy = ndc * gl_Position.w;
  }
}
`;

export const skyboxFragmentShader = `
uniform sampler2D map;
uniform sampler2D mapNext; 
uniform float uMix;        
uniform float uOpacity;

uniform bool u_isPerspective;
uniform float u_dofStrength;
uniform float u_dofExponent;
uniform float u_focusDistance;

varying vec2 vUv;
varying float vViewZ;

void main() {
  float blur = 0.0;
  
  if (u_dofStrength > 0.0) {
      float distRatio;
      if (u_isPerspective) {
          float safeZ = max(0.1, vViewZ);
          distRatio = abs(safeZ - u_focusDistance) / safeZ;
      } else {
          distRatio = abs(vViewZ - u_focusDistance) / 1000.0;
      }
      distRatio = min(1.0, distRatio); 
      float blurFactor = smoothstep(0.0, u_dofExponent, distRatio);
      blur = u_dofStrength * blurFactor * 0.08; 
  }
  
  vec4 color1 = texture2D(map, vUv, blur);
  vec4 color2 = texture2D(mapNext, vUv, blur);
  vec3 finalColor = mix(color1.rgb, color2.rgb, uMix);
  gl_FragColor = vec4(finalColor, uOpacity); 
}
`;
