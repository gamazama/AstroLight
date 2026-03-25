
import type { Preset } from '../../types/presets';

export const solarFlarePreset: Preset = {
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
      "id": 1,
      "from": 1,
      "to": 5,
      "color": "#1A0805",
      "persistenceMultiplier": 75
    },
    {
      "id": 2,
      "from": 2,
      "to": 5,
      "color": "#4D2502",
      "persistenceMultiplier": 30
    },
    {
      "id": 1761833800148.656,
      "from": 5,
      "to": 9,
      "color": "#3B0500",
      "persistenceMultiplier": 50
    },
    {
      "id": 1764071808957.2727,
      "from": 4,
      "to": 1,
      "color": "#09632F",
      "persistenceMultiplier": 9.2
    },
    {
      "id": 1764071997791.5625,
      "from": 5,
      "to": 6,
      "color": "#2B0800",
      "persistenceMultiplier": 40
    }
  ],
  "settings": {
    "startDate": new Date("2025-11-25T11:38:00.210Z"),
    "endDate": null,
    "timeSpeed": 274.158,
    "useRealisticPhysics": false,
    "ellipticalOrbits": true,
    "logarithmicOrbits": false,
    "orbitalInclination": true,
    "sceneScale": 1,
    "planetDataOverrides": {},
    "targetZoom": 0.3501452216754866,
    "tilt": -2.3976505333547493,
    "rotation": 33.71300771910633,
    "viewOffsetX": 0,
    "viewOffsetY": 0,
    "showOrbits": false,
    "orbitColor": "#ffffff",
    "showLabels": false,
    "labelColor": "#e0e6ed",
    "labelFontSize": 12,
    "labelOpacity": 0.8,
    "showUnconnectedLabels": false,
    "showPlanets": false,
    "planetSizeMultiplier": 1,
    "planetOpacity": 1,
    "showUnconnectedPlanets": false,
    "showLines": true,
    "showLiveConnections": false,
    "lineOpacityMultiplier": 0.3298898371427122,
    "lineWidth": 0.22909961439430995,
    "lineDrawAngle": 4.5,
    "lineColorByDistance": false,
    "lineColorMinDist": "#4ECDC4",
    "lineColorMaxDist": "#C34A36",
    "isSparkleMode": false,
    "particleQuantity": 50,
    "particleSize": 2.5,
    "particleSpeed": 3,
    "particleLifespan": 0.8,
    "particleDrag": 1.5,
    "renderMode": "perspective",
    "targetFov": 30,
    "lineBlendMode": "screen",
    "webglLineBrightness": 2,
    "minLineAlpha": 0.001,
    "debugDoFMode": "none",
    "lineSoftness": 0.5,
    "targetZOffset": -0.02802040814521911,
    "enableLineZDrift": true,
    "lineZDriftSpeed": 5,
    "lineDriftAxis": "z",
    "ambientMotionMode": "none",
    "ambientMotionSpeed": 0.5,
    "backgroundColor1": "#FF0A24",
    "backgroundColor2": "#260615",
    "useGradientBackground": true,
    "showBackgroundColor": true,
    "isSkyboxEnabled": false,
    "skyboxOpacity": 1,
    "skyboxImage": "images/milkyway.jpg",
    "showNebula": true,
    "nebulaOpacity": 0.0235504928389601,
    "nebulaParticleSize": 200,
    "nebulaYOffset": -336,
    "showStars": true,
    "starCount": 7000,
    "starSize": 3.506566165042108,
    "starOpacity": 1,
    "showStarColors": true,
    "starTwinkleAmount": 0.71,
    "webGLStarSpeed": 0.3,
    "webGLStarColor": "#ffffff",
    "webGLStarsOpposeDrift": true,
    "documentName": "Solar Flare",
    "liveLineWidth": 0.75,
    "liveLineOpacity": 1,
    "particleDiamondRatio": 0,
    "particleGlowGamma": 3.5,
    "isMyceliumMode": false,
    "myceliumFlowSpeed": 2.5,
    "myceliumWiggleSpeed": 0.2,
    "myceliumPulseDensity": 1,
    "myceliumDisplacement": 0,
    "myceliumNoiseScale": 5.6104797603247025,
    "myceliumPulseWidth": 0.0118576874816716,
    "myceliumVisualActivity": 0,
    "myceliumGlow": 0.2,
    "useJplHorizons": false,
    "jplTargetType": "barycenter",
    "jplPrecision": 5,
    "jplFetchSelection": [],
    "orbitLineWidth": 1.5,
    "orbitBlendMode": "source-over",
    "orbitOpacity": 0.04,
    "connectedOrbitOpacity": 0.3,
    "dofStrength": 2.0,
    "dofFocusDistance": 0,
    "dofExponent": 1.5,
    "dofBlurBrightness": 0.2,
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
