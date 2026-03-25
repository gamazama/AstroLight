
import { simplexNoise3D } from './chunks';

export const lineFragmentShader = `
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

  uniform float u_lineSoftness;
  uniform float u_lineWidth;
  uniform float u_isMycelium;
  uniform float u_currentTime;
  uniform float u_dofStrength;
  uniform float u_focusDistance;
  uniform float u_dofBlurBrightness;
  uniform float u_minAlpha;
  uniform int u_debugDoFMode;
  uniform int u_blurType; // 0 = Gaussian (Soft), 1 = Bokeh (Hard)
  
  // New Uniforms for per-pixel CoC calculation
  uniform float u_dofExponent;
  uniform float u_isOrthographic;
  
  uniform float u_noiseTime; 

  // Mycelium Controls
  uniform float u_myceliumFlowTime;
  uniform float u_myceliumTextureTime;
  uniform float u_myceliumPulseDensity;
  uniform float u_myceliumPulseWidth;
  uniform float u_myceliumVisualActivity; 
  uniform float u_myceliumFlowIntensity; 
  uniform float u_myceliumGlow;
  uniform float u_myceliumNoiseScale; 
  uniform float u_myceliumTextureStretch; 

  ${simplexNoise3D}

  float snoise2D(vec2 v) { return snoise(vec3(v, 0.0)); }
  
  vec3 thermalGradient(float t) {
      t = clamp(t, 0.0, 1.0);
      vec3 col;
      if (t < 0.33) col = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), t / 0.33);
      else if (t < 0.66) col = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.33) / 0.33);
      else col = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), (t - 0.66) / 0.34);
      return col;
  }

  void main() {
    // --- RE-CALCULATE CoC PER PIXEL ---
    // We use the interpolated view depth (vViewZ) to calculate the Circle of Confusion
    // exactly for this fragment, rather than relying on the interpolated vCoc from the vertex shader.
    // This ensures gradients align perfectly with the depth map and eliminates interpolation artifacts.
    float pixelCoc = 0.0;
    
    if (u_dofStrength > 0.0) {
        float distRatio;
        if (u_isOrthographic > 0.5) {
            // Orthographic: Linear distance, no perspective scaling
            distRatio = abs(vViewZ - u_focusDistance) / 1000.0;
        } else {
            // Perspective: Ratio based
            float safeZ = max(0.1, vViewZ);
            distRatio = abs(safeZ - u_focusDistance) / safeZ;
        }
        
        // Use smoothstep for the blur curve.
        // u_dofExponent now effectively acts as the "Focus Range".
        float blurFactor = smoothstep(0.0, u_dofExponent, distRatio);
        
        pixelCoc = u_dofStrength * blurFactor;

        // Apply scaling fix for Orthographic mode to match visible scale
        if (u_isOrthographic > 0.5) {
            pixelCoc *= 1000.0;
        }
    }

    // --- INWARD FADE LOGIC ---
    float worldLineWidth = u_lineWidth * vWidthScale;
    float worldCoc = pixelCoc * vWidthScale;

    float distFromStart = vLineUv.x * vLineLength;
    float distFromEnd = (1.0 - vLineUv.x) * vLineLength;
    float distToTip = min(distFromStart, distFromEnd);
    
    float fadeLength = max(worldLineWidth * 0.5, worldCoc);
    fadeLength = max(fadeLength, 0.0001);
    
    float tipAlpha = smoothstep(0.0, fadeLength, distToTip);

    // --- DEBUG VISUALIZATION ---
    if (u_debugDoFMode == 3) { // Tip Fade Debug
        if (distToTip < fadeLength) {
            gl_FragColor = vec4(1.0, tipAlpha, tipAlpha, 1.0);
        } else {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
        return;
    }
    if (u_debugDoFMode == 1) { // CoC Heatmap
        float cocIntensity = clamp(pixelCoc / (u_isOrthographic > 0.5 ? 100.0 : 0.1), 0.0, 1.0);
        gl_FragColor = vec4(thermalGradient(cocIntensity), 1.0);
        return;
    }
    if (u_debugDoFMode == 2) { // Depth Map
        float distFromFocus = vViewZ - u_focusDistance;
        float normDist = clamp(distFromFocus / 2000.0, -1.0, 1.0);
        vec3 depthColor = normDist < 0.0 ? mix(vec3(0.0), vec3(0.0, 0.0, 1.0), abs(normDist)) : mix(vec3(0.0), vec3(1.0, 0.0, 0.0), normDist);
        gl_FragColor = vec4(depthColor, 1.0);
        return;
    }

    float geometryAlpha = vAlpha;
    float energyMult = 1.0;
    vec3 baseColor = vColor;
    float blurDominance = 0.0;

    if (u_dofStrength > 0.0) {
         float physicalWidth = u_lineWidth + pixelCoc;
         float originalWidth = max(0.001, u_lineWidth);
         float expansionRatio = physicalWidth / originalWidth;
         
         // Physical falloff (1/w) - Conserves total energy, lines get very dim when wide.
         float falloffPhysical = 1.0 / expansionRatio;
         
         // Artistic falloff (1/sqrt(w)) - Lines stay brighter.
         float falloffArtistic = 1.0 / sqrt(expansionRatio);
         
         // Determine base falloff based on depth
         float baseFalloff;
         
         if (vViewZ > u_focusDistance) {
             // BACKGROUND: Use strict physical falloff to prevent distant blurred lines from overwhelming the scene.
             baseFalloff = falloffPhysical;
         } else {
             // FOREGROUND: Blend between physical and artistic (50/50) to keep foreground bokeh visible but not blown out.
             baseFalloff = mix(falloffPhysical, falloffArtistic, 0.5); 
         }

         // Apply user's "Blur Brightness" slider (u_dofBlurBrightness).
         // This allows boosting from the calculated base up to fully flat brightness (1.0).
         float compensationFactor = min(20.0, mix(baseFalloff, 1.0, u_dofBlurBrightness));
         
         energyMult *= compensationFactor;
         
         blurDominance = clamp(pixelCoc / (physicalWidth + 0.001), 0.0, 1.0);
    }

    if (u_isMycelium > 0.5) {
        // 1. Texture / Structure Logic (Cylindrical Projection)
        float distToCenter = length(vWorldPos);
        float theta = atan(vWorldPos.y, vWorldPos.x); // Angle around center
        
        float flow = u_myceliumTextureTime * 50.0;
        
        // Radial coordinate: Moves outward with flow
        // Divided by stretch: If stretch > 1, radial freq drops -> Longer radial streaks
        float noiseR = (distToCenter - flow) * 0.005 * u_myceliumNoiseScale / u_myceliumTextureStretch;
        
        // Angular coordinate: Seamless loop around the circle
        // Multiplied by constant: Diverging rays (constant angular width)
        float noiseTheta = u_myceliumNoiseScale * 2.0; 
        
        // Map to 3D noise space (Cylinder)
        vec3 noiseCoord = vec3(
            noiseR,
            cos(theta) * noiseTheta,
            sin(theta) * noiseTheta
        );

        // Basic structure noise
        float noise = snoise(noiseCoord);
        
        // Create defined strands/nodes by thresholding the noise
        float structureMask = smoothstep(-0.2, 0.5, noise);
        
        // Apply Intensity Control
        float appliedStructure = mix(1.0, structureMask, clamp(u_myceliumVisualActivity, 0.0, 1.0));
        
        geometryAlpha *= appliedStructure;

        // 2. Flow Logic (Pulses along the line) - Independent of texture structure
        if (u_myceliumFlowIntensity > 0.0) {
             float pulse = sin(vLineUv.x * u_myceliumPulseDensity * 20.0 - u_myceliumFlowTime);
             float pulseSharpness = smoothstep(1.0 - u_myceliumPulseWidth, 1.0, pulse);
             vec3 flowColor = vec3(0.2, 0.5, 1.0) * u_myceliumGlow;
             baseColor += flowColor * pulseSharpness * u_myceliumFlowIntensity;
             
             // Additive pulse logic:
             // Multiply by vDestruction to ensure the pulse disappears when connection is destroyed (fading out).
             // We DO NOT multiply by vAlpha (age) here, allowing pulses to remain bright on old lines, preserving the energy flow effect.
             geometryAlpha += pulseSharpness * u_myceliumFlowIntensity * 0.5 * vDestruction;
        }
        
        // General Glow boost
        baseColor *= max(1.0, u_myceliumGlow * 0.5);
    }

    // --- WIDTH FADE (LATITUDINAL) ---
    // Calculate correct geometry expansion based on pixel-perfect CoC
    float geometryWidth = u_lineWidth + max(0.0, vCoc);
    float targetWidth = u_lineWidth + max(0.0, pixelCoc);
    
    // Ratio > 1 means we are drawing pixels "inside" the ideal blur radius.
    float widthRatio = geometryWidth / (targetWidth + 0.0001);
    
    // Map 0 (center) to 1 (edge)
    float d = abs(vLineUv.y - 0.5) * 2.0 * widthRatio;
    
    // Profile Shape Selection
    float sideProfile = 0.0;
    
    if (u_blurType == 1) {
        // BOKEH (HARD/FLAT)
        float bokehFeather = 0.1; 
        float focusedFeather = u_lineSoftness * 0.5;
        
        // Blend between soft-focus and hard-bokeh based on how blurred we are
        float currentFeather = mix(focusedFeather, bokehFeather, blurDominance);
        currentFeather = clamp(currentFeather, 0.01, 0.49);
        
        // Use smoothstep to create a flat-top profile with feathered edges
        sideProfile = smoothstep(1.0, 1.0 - (currentFeather * 2.0), d);
    
    } else {
        // GAUSSIAN (SOFT)
        float userFeather = u_lineSoftness * 0.5; 
        float effectiveFeather = mix(userFeather, 0.5, sqrt(blurDominance));
        
        float boxProfile = smoothstep(1.0, 1.0 - (effectiveFeather * 2.0), d);
        float bellProfile = cos(min(d, 1.0) * 1.570796); // Cosine bell
        
        sideProfile = mix(boxProfile, bellProfile, blurDominance);
    }
    
    geometryAlpha *= sideProfile;

    // --- APPLY TIP FADE ---
    geometryAlpha *= tipAlpha;
    
    if (geometryAlpha < u_minAlpha) discard;
    
    gl_FragColor = vec4(baseColor * energyMult * geometryAlpha, geometryAlpha);
  }
`;
