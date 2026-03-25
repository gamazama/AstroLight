
import type { Preset } from '../../types/presets';

export const geocentricBalletPreset: Preset = {
    "system": "Geo-centric",
    "planetNodes": [
        { "name": "Sun", "color": "#FDB813", "id": 1 },
        { "name": "Moon", "color": "#E0E0E0", "id": 2 },
        { "name": "Mercury", "color": "#8C7853", "id": 3 },
        { "name": "Venus", "color": "#FFC649", "id": 4 },
        { "name": "Mars", "color": "#CD5C5C", "id": 5 },
        { "name": "Jupiter", "color": "#DAA520", "id": 6 },
        { "name": "Saturn", "color": "#F4E4C1", "id": 7 },
        { "name": "Uranus", "color": "#4FD0E0", "id": 8 },
        { "name": "Neptune", "color": "#4B70DD", "id": 9 },
        { "name": "Pluto", "color": "#9CA4AB", "id": 10 }
    ],
    "connections": [
        { "id": 1, "from": 1, "to": 2, "color": "#FFD700", "persistenceMultiplier": 15 },
        { "id": 2, "from": 1, "to": 4, "color": "#B49B53", "persistenceMultiplier": 10 }
    ],
    "settings": {
        "timeSpeed": 100,
        "useRealisticPhysics": true,
        "ellipticalOrbits": true,
        "logarithmicOrbits": true,
        "orbitalInclination": true,
        "sceneScale": 1.2,
        "targetZoom": 2.5,
        "tilt": -80,
        "rotation": 45,
        "showOrbits": true,
        "showLabels": true,
        "showPlanets": true,
        "showLines": true,
        "showLiveConnections": true,
        "lineOpacityMultiplier": 0.25,
        "lineWidth": 0.15,
        "lineDrawAngle": 1.5,
        "isSparkleMode": true,
        "particleQuantity": 20,
        "particleSize": 1.5,
        "particleSpeed": 1,
        "renderMode": "perspective",
        "targetFov": 60,
        "lineBlendMode": "screen",
        "targetZOffset": 300,
        "enableLineZDrift": true,
        "lineZDriftSpeed": 5,
        "lineDriftAxis": "z",
        "orbitOpacity": 0.1,
        "connectedOrbitOpacity": 0.6,
        "showStars": true,
        "starCount": 6000,
        "starSize": 2,
        "backgroundColor1": "#03071e",
        "backgroundColor2": "#370617",
        "useGradientBackground": true
    }
};