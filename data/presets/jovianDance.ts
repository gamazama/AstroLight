import type { Preset } from '../../types/presets';

export const jovianDancePreset: Preset = {
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
            "id": 506,
            "from": 5,
            "to": 6,
            "color": "#FFD93D",
            "persistenceMultiplier": 3
        },
        {
            "id": 508,
            "from": 5,
            "to": 8,
            "color": "#CD5C5C",
            "persistenceMultiplier": 64
        },
        {
            "id": 507,
            "from": 5,
            "to": 7,
            "color": "#8C7853",
            "persistenceMultiplier": 73
        },
        {
            "id": 405,
            "from": 4,
            "to": 5,
            "color": "#D35400",
            "persistenceMultiplier": 53
        },
        {
            "id": 305,
            "from": 3,
            "to": 5,
            "color": "#C34A36",
            "persistenceMultiplier": 76
        }
    ],
    "settings": {
        "startDate": "2025-11-12T19:56:43.666Z",
        "endDate": null,
        "timeSpeed": 55.976,
        "useRealisticPhysics": false,
        "ellipticalOrbits": true,
        "logarithmicOrbits": false,
        "orbitalInclination": true,
        "sceneScale": 1,
        "planetDataOverrides": {},
        "maxLines": 50000,
        "targetZoom": 0.4928110674190003,
        "tilt": 0.2,
        "rotation": 82,
        "viewOffsetX": 0,
        "viewOffsetY": 0,
        "renderMode": "perspective",
        "targetFov": 75,
        "ambientMotionMode": "orbit",
        "ambientMotionSpeed": 0.5,
        "disableCameraSmoothing": false,
        "showOrbits": true,
        "showPlanets": true,
        "showLabels": true,
        "labelFontSize": 12,
        "labelOpacity": 0.8,
        "showUnconnectedLabels": false,
        "planetSizeMultiplier": 1,
        "planetOpacity": 1,
        "showUnconnectedPlanets": false,
        "orbitOpacity": 0.08,
        "connectedOrbitOpacity": 0.22,
        "targetZOffset": 416,
        "showLines": true,
        "showLiveConnections": true,
        "lineOpacityMultiplier": 0.31386294941136333,
        "lineWidth": 0.5790952700218841,
        "lineDrawAngle": 3.3,
        "lineBlendMode": "screen",
        "webglLineBrightness": 0.15475065922629513,
        "lineSoftness": 0.74,
        "enableLineZDrift": true,
        "lineZDriftSpeed": 24.647079957909416,
        "lineDriftAxis": "z",
        "decayNoiseStrength": 40,
        "decayNoiseScale": 0.005,
        "decayNoiseSpeed": 0.025,
        "isSparkleMode": true,
        "particleQuantity": 68,
        "particleSize": 0.7,
        "particleSpeed": 0.4,
        "particleLifespan": 1.3,
        "particleDrag": 2,
        "particleDiamondRatio": 0,
        "particleGlowGamma": 7.1,
        "isBrushMode": false,
        "brushColor": "#FF6B6B",
        "brushSize": 50,
        "brushStrength": 0.5,
        "backgroundColor1": "#0D0309",
        "backgroundColor2": "#752650",
        "useGradientBackground": true,
        "showBackgroundColor": true,
        "isSkyboxEnabled": true,
        "skyboxOpacity": 0.8,
        "skyboxImage": "images/spaceBg3.jpg",
        "showNebula": true,
        "nebulaOpacity": 0.03890451449942807,
        "nebulaParticleSize": 150,
        "nebulaYOffset": -727,
        "showStars": true,
        "starCount": 50000,
        "starSize": 1.5,
        "starOpacity": 0.15,
        "showStarColors": false,
        "starTwinkleAmount": 0.78,
        "webGLStarSpeed": 1.4,
        "webGLStarColor": "#FF1990",
        "webGLStarsOpposeDrift": true,
        "documentName": "Jovian Dance"
    }
};