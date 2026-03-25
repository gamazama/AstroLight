export const gradientFragmentShader = `
  varying vec2 vUv;
  uniform vec3 color1;
  uniform vec3 color2;
  void main() {
    float d = distance(vUv, vec2(0.5, 0.5)) * 2.0;
    gl_FragColor = vec4(mix(color1, color2, d), 1.0);
  }
`;
