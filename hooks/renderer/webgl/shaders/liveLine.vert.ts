
import { simplexNoise3D, gizmoCommon } from './chunks';

export const liveLineVertexShader = `
  attribute vec3 startPosition;
  attribute vec3 endPosition;
  attribute vec2 lineUv;
  attribute vec3 lineColor;
  attribute float lineOpacity;

  uniform float u_opacity;
  uniform float u_lineWidth;
  uniform float u_isOrthographic;
  uniform float u_isMycelium;
  uniform float u_currentTime;
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
    vAlpha = u_opacity * lineOpacity;
    vDestruction = lineOpacity;
    vLineLength = distance(startPosition, endPosition); 
    vLinearMetric = vLineLength * lineUv.x;

    // Interpolate raw world pos for noise
    vWorldPos = mix(startPosition, endPosition, lineUv.x);

    // 1. Transform to View Space (Standard)
    vec4 viewStart = modelViewMatrix * vec4(startPosition, 1.0);
    vec4 viewEnd = modelViewMatrix * vec4(endPosition, 1.0);
    vec4 viewPos = mix(viewStart, viewEnd, lineUv.x);

    // 2. Gizmo Transform (View -> Rotated View)
    vec3 rotatedViewPos = applyGizmoTransform(viewPos.xyz);
    viewPos = vec4(rotatedViewPos, 1.0);

    // 3. Line Geometry
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
        finalWidth += pointCoc; 
        vCoc = pointCoc;
    } else {
        vCoc = 0.0;
        vViewZ = -viewPos.z;
    }

    // --- Mycelium Mode ---
    if (u_isMycelium > 0.5) {
        float t = u_noiseTime;
        float autoScale = 350.0 / (length(vWorldPos) + 50.0);
        float noiseScale = 0.004 * u_myceliumDisplacementScale * autoScale;
        if (u_myceliumDisplacement > 0.0) {
            float d1 = snoise(vWorldPos * noiseScale + vec3(0.0, t, 0.0));
            float d2 = snoise(vWorldPos * noiseScale + vec3(100.0, t * 0.8, 100.0));
            float adaptiveAmplitude = (log(vLineLength + 10.0) + length(vWorldPos) * 0.05) * u_myceliumDisplacement; 
            adaptiveAmplitude *= sin(lineUv.x * 3.14159);
            vec3 displacement = vec3(d1, d2, d1 * d2) * adaptiveAmplitude;
            viewPos.xyz += displacement;
            float widthNoise = snoise(vWorldPos * 0.05 + vec3(t * 0.5));
            finalWidth *= (1.0 + 0.5 * widthNoise * clamp(u_myceliumDisplacement * 2.0, 0.0, 1.0));
        }
    }

    vec3 offset = normal * finalWidth * 0.5 * side * thicknessMultiplier;
    viewPos.xyz += offset;
    gl_Position = projectionMatrix * viewPos;
  }
`;
