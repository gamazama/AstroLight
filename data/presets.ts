
import type { Preset } from '../types/presets';
import { venusPentagramPreset } from './presets/venusPentagram';
import { martianSpirographPreset } from './presets/martianSpirograph';
import { jovianDancePreset } from './presets/jovianDance';
import { innerSystemHarmonyPreset } from './presets/innerSystemHarmony';
import { kuiperEchoesPreset } from './presets/kuiperEchoes';
import { cosmicStringPreset } from './presets/cosmicString';
import { trappistResonancePreset } from './presets/trappistResonance';
import { eclipticPlanePreset } from './presets/eclipticPlane';
import { galacticDriftPreset } from './presets/galacticDrift';
import { stardustBalletPreset } from './presets/stardustBallet';
import { innerWormholePreset } from './presets/innerWormhole';
import { cosmicHypercubePreset } from './presets/cosmicHypercube';
import { theTowerPreset } from './presets/theTower';
import { gasGiantWeavePreset } from './presets/gasGiantWeave';
import { cosmicDNAPreset } from './presets/cosmicDNA';
import { asteroidBeltDancePreset } from './presets/asteroidBeltDance';
import { paintersCanvasPreset } from './presets/paintersCanvas';
import { solarFlarePreset } from './presets/solarFlare';
import { myceliumCellPreset } from './presets/myceliumCell';
import { floweringPlantPreset } from './presets/floweringPlant';
import { geocentricClockPreset } from './presets/geocentricClock';
import { electricFieldPreset } from './presets/electricField';
import { keplerMiniatureSystemPreset } from './presets/keplerMiniatureSystem';
import { glieseLaplaceResonancePreset } from './presets/glieseLaplaceResonance';
import { goldenSpiralPreset } from './presets/goldenSpiral';
import { musicalHarmonyPreset } from './presets/musicalHarmony';
import { geocentricBalletPreset } from './presets/geocentricBallet';

export const PRESETS: Record<string, Preset> = {
    "Venus Pentagram": venusPentagramPreset,
    "Martian Spirograph": martianSpirographPreset,
    "Jovian Dance": jovianDancePreset,
    "Inner System Harmony": innerSystemHarmonyPreset,
    "Kuiper Echoes": kuiperEchoesPreset,
    "Cosmic String": cosmicStringPreset,
    "TRAPPIST Resonance": trappistResonancePreset,
    "Kepler Miniature System": keplerMiniatureSystemPreset,
    "Gliese Laplace Resonance": glieseLaplaceResonancePreset,
    "Golden Spiral": goldenSpiralPreset,
    "Musical Harmony": musicalHarmonyPreset,
    "Ecliptic Plane": eclipticPlanePreset,
    "Galactic Drift": galacticDriftPreset,
    "Stardust Ballet": stardustBalletPreset,
    "Inner Wormhole": innerWormholePreset,
    "Cosmic Hypercube": cosmicHypercubePreset,
    "The Tower": theTowerPreset,
    "Gas Giant Weave": gasGiantWeavePreset,
    "Cosmic DNA": cosmicDNAPreset,
    "Asteroid Belt Dance": asteroidBeltDancePreset,
    "Painter's Canvas": paintersCanvasPreset,
    "Solar Flare": solarFlarePreset,
    "Mycelium Cell": myceliumCellPreset,
    "Flowering Plant": floweringPlantPreset,
    "Geocentric Clock": geocentricClockPreset,
    "Electric Field": electricFieldPreset,
    "Geocentric Ballet": geocentricBalletPreset,
};
