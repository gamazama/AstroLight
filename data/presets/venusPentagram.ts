import type { Preset } from '../../types/presets';

export const venusPentagramPreset: Preset = {
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
            "id": 203,
            "from": 2,
            "to": 3,
            "color": "#FA3600",
            "persistenceMultiplier": 6
        }
    ],
    "settings": {
        "startDate": "2025-11-12T19:45:35.036Z",
        "endDate": null,
        "timeSpeed": 1.091,
        "useRealisticPhysics": false,
        "ellipticalOrbits": false,
        "logarithmicOrbits": false,
        "orbitalInclination": false,
        "sceneScale": 1,
        "planetDataOverrides": {},
        "maxLines": 50000,
        "targetZoom": 2.9068086570230234,
        "tilt": 0,
        "rotation": 0,
        "viewOffsetX": 0,
        "viewOffsetY": 0,
        "renderMode": "orthographic",
        "targetFov": 75,
        "ambientMotionMode": "none",
        "ambientMotionSpeed": 0.5,
        "disableCameraSmoothing": false,
        "showOrbits": true,
        "showPlanets": true,
        "showLabels": true,
        "labelFontSize": 17,
        "labelOpacity": 0.8,
        "showUnconnectedLabels": false,
        "planetSizeMultiplier": 0.1,
        "planetOpacity": 0.49,
        "showUnconnectedPlanets": false,
        "orbitOpacity": 0.08,
        "connectedOrbitOpacity": 0.21,
        "targetZOffset": 0,
        "showLines": true,
        "showLiveConnections": true,
        "lineOpacityMultiplier": 0.6047561022940835,
        "lineWidth": 2.124350371245463,
        "lineDrawAngle": 0.9,
        "lineBlendMode": "lighter",
        "webglLineBrightness": 0.1,
        "lineSoftness": 1,
        "enableLineZDrift": false,
        "lineZDriftSpeed": 0,
        "lineDriftAxis": "z",
        "decayNoiseStrength": 40,
        "decayNoiseScale": 0.005,
        "decayNoiseSpeed": 0.025,
        "isSparkleMode": true,
        "particleQuantity": 63,
        "particleSize": 0.6,
        "particleSpeed": 0.3,
        "particleLifespan": 1.1,
        "particleDrag": 2.9,
        "particleDiamondRatio": 0.04,
        "particleGlowGamma": 3.5,
        "isBrushMode": false,
        "brushColor": "#FF6B6B",
        "brushSize": 50,
        "brushStrength": 0.5,
        "backgroundColor1": "#6E330F",
        "backgroundColor2": "#000000",
        "useGradientBackground": true,
        "showBackgroundColor": true,
        "isSkyboxEnabled": false,
        "skyboxOpacity": 1,
        "skyboxImage": "images/milkyway.jpg",
        "showNebula": false,
        "nebulaOpacity": 0.03,
        "nebulaParticleSize": 200,
        "nebulaYOffset": 0,
        "showStars": false,
        "starCount": 4000,
        "starSize": 1.5,
        "starOpacity": 0.5,
        "showStarColors": true,
        "starTwinkleAmount": 0.4,
        "webGLStarSpeed": 0.3,
        "webGLStarColor": "#ffffff",
        "webGLStarsOpposeDrift": true,
        "documentName": "Venus Pentafold"
    }
};