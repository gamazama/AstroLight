
import { simplexNoise3D, gizmoCommon } from './chunks';

export const historyLineVertexShader = `
  // Attributes sent for each vertex
  attribute vec3 startPosition;
  attribute vec3 endPosition;
  attribute vec2 lineUv; // Renamed from uv
  attribute vec3 lineColor; // Renamed from color
  attribute vec2 timeInfo; // x: birthTime, y: persistence
  attribute vec3 dyingParams; // x: isDying, y: timeToLive, z: startFadeOpacity

  // Uniforms sent for each frame
  uniform float u_currentTime;
  uniform float u_elapsedTime;
  uniform float u_opacity;
  uniform float u_lineWidth;
  uniform float u_lineFadeSeconds;
  uniform float u_isOrthographic;
  uniform float u_isMycelium;
  uniform float u_cameraDistance;
  
  // Mycelium Controls
  uniform float u_myceliumFlowTime;
  uniform float u_myceliumDisplacement;
  uniform float u_myceliumDisplacementScale; 
  uniform float u_noiseTime;
  
  // DoF Controls
  uniform float u_dofStrength;
  uniform float u_dofExponent;
  uniform float u_focusDistance;
  uniform int u_debugDoFMode;
  
  // Varyings passed to the fragment shader
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vLineUv;
  varying float vLineLength;
  varying vec3 vWorldPos;
  varying float vCoc; 
  varying float vViewZ;
  varying float vLinearMetric; 
  varying float vWidthScale; 
  varying float vDestruction; 

  ${simplexNoise3D}

  ${gizmoCommon}

  void main() {
    vColor = lineColor;
    vLineUv = lineUv;
    vLineLength = distance(startPosition, endPosition);
    vLinearMetric = vLineLength * lineUv.x;
    
    // Interpolate raw world position for noise/coloring (before view transform)
    vWorldPos = mix(startPosition, endPosition, lineUv.x);

    // 1. View Transform (World -> Camera)
    // modelViewMatrix contains the Camera transform.
    vec4 viewStart = modelViewMatrix * vec4(startPosition, 1.0);
    vec4 viewEnd = modelViewMatrix * vec4(endPosition, 1.0);
    vec4 viewPos = mix(viewStart, viewEnd, lineUv.x);
    
    // 2. Gizmo Transform (Camera -> World-Rotated)
    // Applied in View Space, pivoting around u_viewPivot
    vec3 rotatedViewPos = applyGizmoTransform(viewPos.xyz);
    viewPos = vec4(rotatedViewPos, 1.0);

    // --- Line Geometry ---
    // Calculate direction in view space AFTER rotation
    
    vec3 rotatedViewStart = applyGizmoTransform(viewStart.xyz);
    vec3 rotatedViewEnd = applyGizmoTransform(viewEnd.xyz);
    
    vec3 dir = rotatedViewEnd - rotatedViewStart;
    vec3 normal = normalize(cross(dir, vec3(0.0, 0.0, -1.0)));
    float side = lineUv.y * 2.0 - 1.0;
    
    float thicknessMultiplier = 1.0;
    if (u_isOrthographic < 0.5) { 
        thicknessMultiplier = max(0.1, -viewPos.z);
    }
    vWidthScale = thicknessMultiplier;

    float finalWidth = u_lineWidth;

    // --- Depth of Field ---
    float pointCoc = 0.0;
    if (u_dofStrength > 0.0) {
        float viewZ = -viewPos.z;
        float distRatio;
        if (u_isOrthographic > 0.5) {
             distRatio = abs(viewZ - u_focusDistance) / 1000.0;
             vViewZ = viewZ;
        } else {
             float safeZ = max(0.1, viewZ);
             distRatio = abs(safeZ - u_focusDistance) / safeZ;
             vViewZ = safeZ;
        }
        distRatio = min(10.0, distRatio);
        float blurFactor = smoothstep(0.0, u_dofExponent, distRatio);
        pointCoc = u_dofStrength * blurFactor;
        
        if (u_isOrthographic > 0.5) pointCoc *= 1000.0;
        vCoc = pointCoc;
        finalWidth += pointCoc; 
    } else {
        vCoc = 0.0;
        vViewZ = -viewPos.z;
    }

    // --- Dying / Mycelium Logic ---
    if (dyingParams.x > 0.5) {
        // ... Dying logic (abbreviated, keeping world noise)
        float maxLife = u_lineFadeSeconds;
        float currentLife = dyingParams.y;
        float timeRatio = clamp(currentLife / maxLife, 0.0, 1.0);
        vAlpha = dyingParams.z * (timeRatio * timeRatio * timeRatio * timeRatio);
        vDestruction = vAlpha;
        finalWidth *= (1.0 + (1.0 - timeRatio) * 5.5);
    } else {
        float age = u_currentTime - timeInfo.x;
        float lifeRatio = 1.0 - (age / timeInfo.y);
        vAlpha = clamp(lifeRatio, 0.0, 1.0) * u_opacity;
        vDestruction = 1.0;

        if (u_isMycelium > 0.5) {
            // Noise displacement is applied in View Space to match line geometry
            float t = u_noiseTime; 
            float autoScale = 350.0 / (length(vWorldPos) + 50.0); // Use original world pos for noise coherence
            float noiseScale = 0.004 * u_myceliumDisplacementScale * autoScale;
            
            if (u_myceliumDisplacement > 0.0) {
                float d1 = snoise(vWorldPos * noiseScale + vec3(0.0, t, 0.0));
                float d2 = snoise(vWorldPos * noiseScale + vec3(100.0, t * 0.8, 100.0));
                float adaptiveAmplitude = (log(vLineLength + 10.0) + length(vWorldPos) * 0.05) * u_myceliumDisplacement; 
                
                vec3 displacement = vec3(d1, d2, d1 * d2) * adaptiveAmplitude;
                viewPos.xyz += displacement;
                
                float widthNoise = snoise(vWorldPos * 0.05 + vec3(t * 0.5));
                finalWidth *= (1.0 + 0.5 * widthNoise * clamp(u_myceliumDisplacement * 2.0, 0.0, 1.0));
            }
        }
    }

    vec3 offset = normal * finalWidth * 0.5 * side * thicknessMultiplier;
    viewPos.xyz += offset;

    gl_Position = projectionMatrix * viewPos;
  }
`;
