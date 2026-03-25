
import type { AppState } from '../types';

export const keyMap: { [key in keyof Partial<AppState>]: string } = {
  startDate: 'sd', endDate: 'ed', timeSpeed: 'ts', useRealisticPhysics: 'urp', ellipticalOrbits: 'eo', logarithmicOrbits: 'lo',
  orbitalInclination: 'oi', sceneScale: 'scs', planetDataOverrides: 'pdo', targetZoom: 'tz', tilt: 't', rotation: 'r',
  viewOffsetX: 'vx', viewOffsetY: 'vy', showOrbits: 'so', orbitColor: 'oc', showLabels: 'sl', labelColor: 'lc',
  labelFontSize: 'lfs', labelOpacity: 'lop', showUnconnectedLabels: 'sul', showPlanets: 'sp', planetSizeMultiplier: 'psm',
  planetOpacity: 'po', showUnconnectedPlanets: 'sup', showLines: 'sli', showLiveConnections: 'slc', lineOpacityMultiplier: 'lom',
  lineWidth: 'lw', lineDrawAngle: 'lda', lineColorByDistance: 'lcbd', lineColorMinDist: 'lcnm', lineColorMaxDist: 'lcmx',
  isSparkleMode: 'ism', particleQuantity: 'pq', particleSize: 'ps', particleSpeed: 'psp',
  particleLifespan: 'pl', particleDrag: 'pd', renderMode: 'rm', targetFov: 'tf', perspectiveFov: 'pf', lineBlendMode: 'lbm',
  webglLineBrightness: 'wlb', minLineAlpha: 'mla', debugDoFMode: 'ddm', lineSoftness: 'ls', targetZOffset: 'tzo', enableLineZDrift: 'ezd', lineZDriftSpeed: 'zds',
  lineDriftAxis: 'zda', ambientMotionMode: 'amm', ambientMotionSpeed: 'ams', backgroundColor1: 'bg1', backgroundColor2: 'bg2', useGradientBackground: 'ugb', showBackgroundColor: 'sbc',
  isSkyboxEnabled: 'ise', skyboxOpacity: 'sop', skyboxImage: 'si', showNebula: 'sn', nebulaOpacity: 'no',
  nebulaParticleSize: 'nps', nebulaYOffset: 'nyo', showStars: 'sst', starCount: 'stc', starSize: 'stz',
  starOpacity: 'sto', showStarColors: 'ssc', starTwinkleAmount: 'sta', webGLStarSpeed: 'wst', webGLStarColor: 'wsc',
  webGLStarsOpposeDrift: 'wsod', documentName: 'dn', liveLineWidth: 'llw', liveLineOpacity: 'llo',
  particleDiamondRatio: 'pdr', particleGlowGamma: 'pgg',
  // Mycelium
  isMyceliumMode: 'imm', myceliumFlowSpeed: 'mfs', myceliumFlowIntensity: 'mfi', myceliumWiggleSpeed: 'mws', 
  myceliumPulseDensity: 'mpd', myceliumDisplacement: 'md', myceliumDisplacementScale: 'mds',
  myceliumNoiseScale: 'mns', myceliumTextureSpeed: 'mts', myceliumTextureStretch: 'mtst', myceliumPulseWidth: 'mpw', myceliumVisualActivity: 'mva', myceliumGlow: 'mg',
  // JPL
  useJplHorizons: 'ujh', jplTargetType: 'jtt', jplPrecision: 'jp', jplFetchSelection: 'jfs',
  // Orbit Settings
  orbitLineWidth: 'olw', orbitBlendMode: 'obm', orbitOpacity: 'oop', connectedOrbitOpacity: 'coo',
  // DoF
  dofStrength: 'dofs', dofFocusDistance: 'dofd', dofExponent: 'dofe', dofBlurBrightness: 'dofb', dofBlurType: 'doft',
  // Gradients
  lineColorMode: 'lcm', lineGradient: 'lg',
  // Gizmo
  worldRotation: 'wr', pivotOffset: 'po', pivotPoint: 'pp'
};

export const reverseKeyMap = Object.fromEntries(
  Object.entries(keyMap).map(([k, v]) => [v, k])
);
