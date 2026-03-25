
import type { Preset } from '../../types';

export const paintersCanvasPreset: Preset = {
    "system": "Sol",
    "planetNodes": [
        { "id": 1, "name": "Mercury", "color": "#8C7853" },
        { "id": 2, "name": "Venus", "color": "#FFC649" },
        { "id": 3, "name": "Earth", "color": "#4A90E2" },
        { "id": 4, "name": "Mars", "color": "#CD5C5C" },
        { "id": 5, "name": "Jupiter", "color": "#DAA520" },
        { "id": 6, "name": "Saturn", "color": "#F4E4C1" },
        { "id": 7, "name": "Uranus", "color": "#4FD0E0" },
        { "id": 8, "name": "Neptune", "color": "#4B70DD" },
        { "id": 9, "name": "Pluto", "color": "#9CA4AB" }
    ],
    "connections": [
        { "id": 1, "from": 1, "to": 2, "color": "#CCCCCC", "persistenceMultiplier": 5 },
        { "id": 2, "from": 2, "to": 3, "color": "#CCCCCC", "persistenceMultiplier": 5 },
        { "id": 3, "from": 3, "to": 4, "color": "#CCCCCC", "persistenceMultiplier": 5 },
        { "id": 4, "from": 4, "to": 1, "color": "#CCCCCC", "persistenceMultiplier": 5 }
    ],
    "settings": {
        "timeSpeed": 20,
        "useRealisticPhysics": false,
        "ellipticalOrbits": true,
        "logarithmicOrbits": false,
        "orbitalInclination": false,
        "sceneScale": 1,
        "targetZoom": 4,
        "tilt": 0,
        "rotation": 0,
        "showOrbits": false,
        "showLabels": false,
        "showPlanets": false,
        "showLines": true,
        "showLiveConnections": false,
        "lineOpacityMultiplier": 0.5,
        "lineWidth": 0.5,
        "lineDrawAngle": 0.5,
        "isSparkleMode": false,
        "renderMode": "orthographic",
        "lineBlendMode": "source-over",
        "targetZOffset": 0,
        "showStars": false,
        "showNebula": false,
        "backgroundColor1": "#050505",
        "backgroundColor2": "#000000",
        "useGradientBackground": true
    }
};