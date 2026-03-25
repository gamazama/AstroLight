
export const webglStarFragmentShader = `
  uniform vec3 uColor;
  uniform float uFar;
  uniform float uOpacity;
  uniform float uShowStarColors;
  
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vDepth;
  varying float vCoc;
  varying float vBaseSize;
  
  void main() {
    // Normalized distance from center of the point sprite (0.0 to 0.5)
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Determine shape based on blur amount
    // Focused (Small CoC): Soft, Gaussian-like point light
    // Blurred (Large CoC): Flatter disc (bokeh) with slightly softer edges
    
    float alphaShape = 0.0;
    
    // Determine blurriness ratio [0 = Focused, 1 = Very Blurred]
    float blurRatio = clamp(vCoc / (vBaseSize + vCoc + 0.001), 0.0, 1.0);
    
    if (blurRatio < 0.1) {
        // Sharp Mode: Soft Gaussian falloff
        // Map dist 0->0.5 to alpha 1->0
        float normDist = dist * 2.0; // 0 to 1
        alphaShape = exp(-4.0 * normDist * normDist); // Gaussian curve
        // Smooth edge clip
        alphaShape *= 1.0 - smoothstep(0.8, 1.0, normDist);
    } else {
        // Bokeh Mode: Flat disc with feathering edge
        // Feather increases slightly with blur
        float feather = mix(0.1, 0.05, blurRatio); 
        alphaShape = 1.0 - smoothstep(0.5 - feather, 0.5, dist);
    }
    
    // Energy Conservation
    // As the point expands (vCoc increases), brightness must decrease to maintain total energy.
    // Area is proportional to radius^2.
    float originalArea = vBaseSize * vBaseSize;
    float newArea = (vBaseSize + vCoc) * (vBaseSize + vCoc);
    
    // Physical energy conservation (brightness drops as area increases)
    float conservation = min(1.0, originalArea / newArea); 
    
    float fadeStart = uFar * 0.85;
    float fadeEnd = uFar;
    float depthAlpha = 1.0 - smoothstep(fadeStart, fadeEnd, vDepth);
    
    vec3 finalColor = mix(uColor, vColor, uShowStarColors);
    
    gl_FragColor = vec4(finalColor, alphaShape * vTwinkle * depthAlpha * uOpacity * conservation);
  }
`;
