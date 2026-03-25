import * as THREE from 'three';
import { gradientVertexShader } from '../shaders/backgroundGradient.vert';
import { gradientFragmentShader } from '../shaders/backgroundGradient.frag';

export const createGradientPlane = (camera: THREE.Camera): THREE.Mesh => {
    const gradientMaterial = new THREE.ShaderMaterial({ vertexShader:gradientVertexShader, fragmentShader:gradientFragmentShader, uniforms:{color1:{value:new THREE.Color('#0a0e27')}, color2:{value:new THREE.Color('#1a1f3a')}}, depthWrite:false, depthTest:false });
    const gradientPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,2), gradientMaterial);
    gradientPlane.renderOrder = -2;
    camera.add(gradientPlane);
    return gradientPlane;
};

// createSkyboxSphere is now deprecated and implemented directly in backgroundController.ts
// to support custom shaders and DoF.
export const createSkyboxSphere = (scene: THREE.Scene): THREE.Mesh => {
    // Placeholder or fallback if ever needed, but main logic is moved.
    const sphereMaterial = new THREE.MeshBasicMaterial({ transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false });
    const sphereGeometry = new THREE.SphereGeometry(25000, 60, 40);
    sphereGeometry.scale(-1, 1, 1);
    const skyboxSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    skyboxSphere.renderOrder = -1;
    scene.add(skyboxSphere);
    return skyboxSphere;
};