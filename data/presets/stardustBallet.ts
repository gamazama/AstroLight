
import type { Preset } from '../../types/presets';

export const stardustBalletPreset: Preset = {
  "system": "Sol",
  "planetNodes": [
    {
      "id": 1,
      "name": "Mercury",
      "color": "#8C7853"
    },
    {
      "id": 2,
      "name": "Venus",
      "color": "#FFC649"
    },
    {
      "id": 3,
      "name": "Earth",
      "color": "#4A90E2"
    },
    {
      "id": 4,
      "name": "Mars",
      "color": "#CD5C5C"
    },
    {
      "id": 5,
      "name": "Jupiter",
      "color": "#DAA520"
    },
    {
      "id": 6,
      "name": "Saturn",
      "color": "#F4E4C1"
    },
    {
      "id": 7,
      "name": "Uranus",
      "color": "#4FD0E0"
    },
    {
      "id": 8,
      "name": "Neptune",
      "color": "#4B70DD"
    },
    {
      "id": 9,
      "name": "Pluto",
      "color": "#9CA4AB"
    }
  ],
  "connections": [
    {
      "id": 102,
      "from": 1,
      "to": 2,
      "color": "#FF9E7D",
      "persistenceMultiplier": 4
    },
    {
      "id": 203,
      "from": 2,
      "to": 3,
      "color": "#4ECDC4",
      "persistenceMultiplier": 5
    },
    {
      "id": 1760836487097.5732,
      "from": 4,
      "to": 2,
      "color": "#A9A9A9",
      "persistenceMultiplier": 25
    },
    {
      "id": 1760836488111.7358,
      "from": 4,
      "to": 3,
      "color": "#E74C3C",
      "persistenceMultiplier": 7
    },
    {
      "id": 1760836489444.7017,
      "from": 4,
      "to": 1,
      "color": "#e5b373",
      "persistenceMultiplier": 34
    },
    {
      "id": 1760836494662.8792,
      "from": 1,
      "to": 3,
      "color": "#45B7D1",
      "persistenceMultiplier": 22
    }
  ],
  "settings": {
    "startDate": "2025-11-27T12:17:05.426Z",
    "endDate": null,
    "timeSpeed": 10,
    "useRealisticPhysics": false,
    "ellipticalOrbits": true,
    "logarithmicOrbits": false,
    "orbitalInclination": true,
    "sceneScale": 1,
    "planetDataOverrides": {},
    "targetZoom": 28.91388887020132,
    "tilt": 24.298488585771494,
    "rotation": -19.4395294539138,
    "viewOffsetX": 53.28786359673984,
    "viewOffsetY": -106.4126392161669,
    "showOrbits": false,
    "orbitColor": "#ffffff",
    "showLabels": false,
    "labelColor": "#e0e6ed",
    "labelFontSize": 12,
    "labelOpacity": 0.8,
    "showUnconnectedLabels": false,
    "showPlanets": true,
    "planetSizeMultiplier": 1,
    "planetOpacity": 1,
    "showUnconnectedPlanets": false,
    "showLines": true,
    "showLiveConnections": false,
    "lineOpacityMultiplier": 0.5922315042991644,
    "lineWidth": 1.0009771816255717,
    "lineDrawAngle": 10,
    "lineColorByDistance": false,
    "lineColorMinDist": "#4ECDC4",
    "lineColorMaxDist": "#C34A36",
    "isSparkleMode": true,
    "particleQuantity": 10,
    "particleSize": 0.5,
    "particleSpeed": 0.2,
    "particleLifespan": 0.8,
    "particleDrag": 4.2,
    "renderMode": "perspective",
    "targetFov": 75,
    "lineBlendMode": "screen",
    "webglLineBrightness": 0.333,
    "minLineAlpha": 0.001,
    "debugDoFMode": "none",
    "lineSoftness": 0.5,
    "targetZOffset": 57,
    "enableLineZDrift": false,
    "lineZDriftSpeed": 0,
    "lineDriftAxis": "z",
    "ambientMotionMode": "wobble",
    "ambientMotionSpeed": 1,
    "backgroundColor1": "#000000",
    "backgroundColor2": "#000000",
    "useGradientBackground": false,
    "showBackgroundColor": true,
    "isSkyboxEnabled": true,
    "skyboxOpacity": 0.46,
    "skyboxImage": "images/milkyway.jpg",
    "showNebula": false,
    "nebulaOpacity": 0.12,
    "nebulaParticleSize": 100,
    "nebulaYOffset": 0,
    "showStars": true,
    "starCount": 2000,
    "starSize": 1,
    "starOpacity": 0.5,
    "showStarColors": true,
    "starTwinkleAmount": 0.4,
    "webGLStarSpeed": 0.3,
    "webGLStarColor": "#ffffff",
    "webGLStarsOpposeDrift": true,
    "documentName": "Stardust Ballet",
    "liveLineWidth": 0.75,
    "liveLineOpacity": 1,
    "particleDiamondRatio": 0,
    "particleGlowGamma": 6.1,
    "isMyceliumMode": false,
    "myceliumFlowSpeed": 2.5,
    "myceliumWiggleSpeed": 0.2,
    "myceliumPulseDensity": 1,
    "myceliumDisplacement": 0.15,
    "myceliumNoiseScale": 30,
    "myceliumPulseWidth": 0.02,
    "myceliumVisualActivity": 0.3,
    "myceliumGlow": 1,
    "useJplHorizons": false,
    "jplTargetType": "barycenter",
    "jplPrecision": 5,
    "jplFetchSelection": [],
    "orbitLineWidth": 1.5,
    "orbitBlendMode": "screen",
    "orbitOpacity": 0.06,
    "connectedOrbitOpacity": 0.5,
    "dofStrength": 30,
    "dofFocusDistance": 150,
    "dofExponent": 1.5,
    "dofBlurBrightness": -0.35,
    "dofBlurType": "gaussian",
    "lineColorMode": "constant",
    "lineGradient": [
      {
        "id": "1",
        "position": 0,
        "color": "#4ECDC4"
      },
      {
        "id": "2",
        "position": 1,
        "color": "#C34A36"
      }
    ]
  }
};
