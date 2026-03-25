import type * as THREE from 'three';

interface ThreeJsBridge {
  renderer: THREE.WebGLRenderer | null;
  // Scenes & Cameras
  backgroundScene: THREE.Scene | null;
  backgroundCamera: THREE.PerspectiveCamera | null;
  foregroundScene: THREE.Scene | null;
  foregroundCamera: THREE.PerspectiveCamera | null;
  foregroundOrthographicCamera: THREE.OrthographicCamera | null;
  foregroundCameraPivot: THREE.Object3D | null;
  // Controller instances for saveImage
  backgroundObjects: any | null;
  lineRenderer: any | null;
  liveLineRenderer: any | null;
  particleRenderer: any | null;
}

export const threeJsBridge: ThreeJsBridge = {
  renderer: null,
  backgroundScene: null,
  backgroundCamera: null,
  foregroundScene: null,
  foregroundCamera: null,
  foregroundOrthographicCamera: null,
  foregroundCameraPivot: null,
  backgroundObjects: null,
  lineRenderer: null,
  liveLineRenderer: null,
  particleRenderer: null,
};