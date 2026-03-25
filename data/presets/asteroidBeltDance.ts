
import type { Preset } from '../../types/presets';

export const asteroidBeltDancePreset: Preset = {
    "system": "Sol (Extended)",
    "planetNodes": [
        { "id": 1, "name": "Mercury", "color": "#8C7853" },
        { "id": 2, "name": "Venus", "color": "#FFC649" },
        { "id": 3, "name": "Earth", "color": "#4A90E2" },
        { "id": 4, "name": "Mars", "color": "#CD5C5C" },
        { "id": 5, "name": "Jupiter", "color": "#DAA520" },
        { "id": 6, "name": "Saturn", "color": "#F4E4C1" },
        { "id": 7, "name": "Uranus", "color": "#4FD0E0" },
        { "id": 8, "name": "Neptune", "color": "#4B70DD" },
        { "id": 9, "name": "Pluto", "color": "#9CA4AB" },
        { "id": 10, "name": "Chiron", "color": "#C4B5A0" },
        { "id": 11, "name": "Ceres", "color": "#D2B48C" },
        { "id": 12, "name": "Pallas", "color": "#A9A9A9" },
        { "id": 13, "name": "Juno", "color": "#8A2BE2" },
        { "id": 14, "name": "Vesta", "color": "#FF4500" },
        { "id": 15, "name": "Eris", "color": "#8B0000" },
        { "id": 16, "name": "Haumea", "color": "#2E8B57" },
        { "id": 17, "name": "Makemake", "color": "#D2691E" },
        { "id": 18, "name": "Sedna", "color": "#F0F8FF" }
    ],
    "connections": [
        { "id": 1, "from": 11, "to": 12, "color": "#A9A9A9", "persistenceMultiplier": 1 },
        { "id": 2, "from": 13, "to": 14, "color": "#FF4500", "persistenceMultiplier": 40 },
        { "id": 3, "from": 12, "to": 13, "color": "#8A2BE2", "persistenceMultiplier": 15 }
    ],
    "settings": {
        "timeSpeed": 805.5435016681581,
        "useRealisticPhysics": false,
        "enableLineZDrift": true,
        "lineDriftAxis": "x",
        "lineZDriftSpeed": -2.0,
        "ellipticalOrbits": true,
        "logarithmicOrbits": true,
        "orbitalInclination": true,
        "sceneScale": 1,
        "targetZoom": 0.5863463270578304,
        "tilt": -54.62309988706014,
        "rotation": 46.90050959022438,
        "viewOffsetX": -190,
        "viewOffsetY": -158,
        "showOrbits": false,
        "showLabels": false,
        "showPlanets": true,
        "showLines": true,
        "showLiveConnections": false,
        "lineOpacityMultiplier": 0.03,
        "lineWidth": 1.7261880074375384,
        "lineDrawAngle": 6.4,
        "isSparkleMode": false,
        "particleQuantity": 30,
        "particleSize": 1,
        "particleSpeed": 1,
        "renderMode": "orthographic",
        "targetFov": 112.5,
        "lineBlendMode": "screen",
        "targetZOffset": 795
    }
};