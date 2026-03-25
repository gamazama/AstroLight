
export const simplexNoise3D = `
  // Ashima Simplex Noise 3D
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857; 
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }
`;

export const gizmoCommon = `
  // World Transform Uniforms
  uniform vec3 u_viewPivot; // View Space Pivot
  uniform vec3 u_pivotOffset; // Offset in View Space
  uniform vec3 u_worldRotation; // Euler degrees
  uniform float u_hasPivot; 

  vec3 applyGizmoTransform(vec3 viewPos) {
    if (u_hasPivot < 0.5) return viewPos;
    
    vec3 systemViewPos = viewPos;
    
    // Fix for Perspective Camera Z-offset
    // In Perspective, Camera is at (0, 0, D). System Center is (0, 0, -D).
    // We shift Z by +D so System Center becomes (0,0,0) for local rotation.
    if (u_isOrthographic < 0.5) {
       systemViewPos.z += u_cameraDistance; 
    }
    
    // 1. Translate to Pivot Local Space
    vec3 p = systemViewPos - u_viewPivot;
    
    // 2. Rotate (X -> Y -> Z)
    vec3 rad = u_worldRotation * 0.0174532925; // deg to rad
    if (rad.x != 0.0) { float c = cos(rad.x); float s = sin(rad.x); p.yz = vec2(p.y * c - p.z * s, p.y * s + p.z * c); }
    if (rad.y != 0.0) { float c = cos(rad.y); float s = sin(rad.y); p.xz = vec2(p.x * c + p.z * s, -p.x * s + p.z * c); }
    if (rad.z != 0.0) { float c = cos(rad.z); float s = sin(rad.z); p.xy = vec2(p.x * c - p.y * s, p.x * s + p.y * c); }

    // 3. Translate back + Offset
    vec3 result = p + u_viewPivot + u_pivotOffset;
    
    // Restore Camera Z-offset
    if (u_isOrthographic < 0.5) {
        result.z -= u_cameraDistance;
    }

    return result;
  }
`;
