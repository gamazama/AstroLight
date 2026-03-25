
import type { Preset } from '../../types/presets';

export const trappistResonancePreset: Preset = {
    "system": "TRAPPIST-1",
    "planetNodes": [
        {
            "id": 1,
            "name": "TRAPPIST-1b",
            "color": "#c78d52"
        },
        {
            "id": 2,
            "name": "TRAPPIST-1c",
            "color": "#c7a352"
        },
        {
            "id": 3,
            "name": "TRAPPIST-1d",
            "color": "#52c78d"
        },
        {
            "id": 4,
            "name": "TRAPPIST-1e",
            "color": "#528dc7"
        },
        {
            "id": 5,
            "name": "TRAPPIST-1f",
            "color": "#8d52c7"
        },
        {
            "id": 6,
            "name": "TRAPPIST-1g",
            "color": "#c7528d"
        },
        {
            "id": 7,
            "name": "TRAPPIST-1h",
            "color": "#c75252"
        }
    ],
    "connections": [
        {
            "id": 102,
            "from": 1,
            "to": 2,
            "color": "#FF9E7D",
            "persistenceMultiplier": 12
        },
        {
            "id": 203,
            "from": 2,
            "to": 3,
            "color": "#4ECDC4",
            "persistenceMultiplier": 8
        },
        {
            "id": 304,
            "from": 3,
            "to": 4,
            "color": "#5C7CFA",
            "persistenceMultiplier": 8
        }
    ],
    "settings": {
        "startDate": "2025-11-24T21:41:27.899Z",
        "endDate": null,
        "timeSpeed": 0.147,
        "useRealisticPhysics": false,
        "ellipticalOrbits": false,
        "logarithmicOrbits": true,
        "orbitalInclination": false,
        "sceneScale": 1,
        "planetDataOverrides": {},
        "targetZoom": 11.550647187077361,
        "tilt": -43.49028620571045,
        "rotation": -47.383696506913616,
        "viewOffsetX": 72.39633163605731,
        "viewOffsetY": -198.4272888443772,
        "showOrbits": true,
        "orbitColor": "#B0451A",
        "showLabels": false,
        "labelColor": "#e0e6ed",
        "labelFontSize": 12,
        "labelOpacity": 0.8,
        "showUnconnectedLabels": false,
        "showPlanets": true,
        "planetSizeMultiplier": 4.987499999999999,
        "planetOpacity": 1,
        "showUnconnectedPlanets": false,
        "showLines": true,
        "showLiveConnections": false,
        "lineOpacityMultiplier": 0.9736748808509419,
        "lineWidth": 0.23438372289185042,
        "lineDrawAngle": 4,
        "lineColorByDistance": false,
        "lineColorMinDist": "#4ECDC4",
        "lineColorMaxDist": "#C34A36",
        "isSparkleMode": false,
        "particleQuantity": 10,
        "particleSize": 1,
        "particleSpeed": 1,
        "particleLifespan": 0.8,
        "particleDrag": 1.5,
        "renderMode": "perspective",
        "targetFov": 60,
        "lineBlendMode": "lighter",
        "webglLineBrightness": 0.12924016026809676,
        "minLineAlpha": 0.001,
        "debugDoFMode": "none",
        "lineSoftness": 1,
        "targetZOffset": 11,
        "enableLineZDrift": true,
        "lineZDriftSpeed": -124.5054310196158,
        "lineDriftAxis": "z",
        "ambientMotionMode": "none",
        "ambientMotionSpeed": 0.5,
        "backgroundColor1": "#03071e",
        "backgroundColor2": "#370617",
        "useGradientBackground": true,
        "showBackgroundColor": true,
        "isSkyboxEnabled": false,
        "skyboxOpacity": 1,
        "skyboxImage": "images/milkyway.jpg",
        "showNebula": false,
        "nebulaOpacity": 0.03,
        "nebulaParticleSize": 200,
        "nebulaYOffset": 0,
        "showStars": true,
        "starCount": 21400,
        "starSize": 2.577450439149755,
        "starOpacity": 1,
        "showStarColors": true,
        "starTwinkleAmount": 0.4,
        "webGLStarSpeed": 0.3,
        "webGLStarColor": "#ffffff",
        "webGLStarsOpposeDrift": true,
        "documentName": "TRAPPIST Resonance",
        "liveLineWidth": 0.75,
        "liveLineOpacity": 1,
        "particleDiamondRatio": 0,
        "particleGlowGamma": 3.5,
        "isMyceliumMode": false,
        "myceliumFlowSpeed": 1.5,
        "myceliumWiggleSpeed": 1,
        "myceliumPulseDensity": 0.43,
        "myceliumDisplacement": 0.235,
        "myceliumNoiseScale": 1,
        "myceliumPulseWidth": 0.01,
        "myceliumVisualActivity": 0.4,
        "myceliumGlow": 5,
        "useJplHorizons": false,
        "jplTargetType": "barycenter",
        "jplPrecision": 5,
        "jplFetchSelection": [],
        "orbitLineWidth": 3.8,
        "orbitBlendMode": "lighter",
        "orbitOpacity": 0.01,
        "connectedOrbitOpacity": 0.17,
        "dofStrength": 30,
        "dofFocusDistance": -1,
        "dofExponent": 1.5,
        "dofBlurBrightness": 0.2,
        "lineColorMode": "distance",
        "lineGradient": [
            {
                "id": "1764021386088",
                "position": 0.164,
                "color": "#FFC124"
            },
            {
                "id": "1764021368654",
                "position": 0.516,
                "color": "#FF0000"
            },
            {
                "id": "1764021360996",
                "position": 0.556,
                "color": "#EF0DFF"
            },
            {
                "id": "1",
                "position": 0.828,
                "color": "#4EA3CD"
            },
            {
                "id": "2",
                "position": 0.876,
                "color": "#5113C3"
            },
            {
                "id": "1764021582169",
                "position": 0.94,
                "color": "#822EFF"
            },
            {
                "id": "1764021576947",
                "position": 1,
                "color": "#FFFFFF"
            }
        ]
    }
};