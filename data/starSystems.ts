
import type { CelestialBodyData } from '../types/celestial';

export interface StarSystem {
  name: string;
  star: {
      name: string;
      description: string;
  };
  stars?: CelestialBodyData[];
  celestialBodies: CelestialBodyData[];
}

const majorPlanets: CelestialBodyData[] = [
    { 
        name: 'Mercury', color: '#8C7853', radius: 2.4, realRadius: 2440, orbitRadius: 57.9, period: 88, eccentricity: 0.206, inclination: 7.0, jplId: '1', jplIdPlanetCenter: '199', 
        description: 'The messenger planet, governing communication, intellect, and reason. Mercury represents the speed of thought and the fluid exchange of ideas.',
        connectionColors: ['#8C7853', '#E0CDA9', '#BCAAA4'] // Earthy tones, Quicksilver/Grey
    },
    { 
        name: 'Venus', color: '#FFC649', radius: 6, realRadius: 6052, orbitRadius: 108.2, period: 224.7, eccentricity: 0.007, inclination: 3.4, jplId: '2', jplIdPlanetCenter: '299', 
        description: 'The embodiment of love, beauty, and harmony. Venus influences our sense of aesthetics, our relationships, and the pursuit of pleasure and art.',
        connectionColors: ['#FFC649', '#FF9E7D', '#98FB98'] // Golden, Soft Pink, Pale Green (Traditional planetary color)
    },
    { 
        name: 'Earth', color: '#4A90E2', radius: 6.4, realRadius: 6371, orbitRadius: 149.6, period: 365.25, eccentricity: 0.017, inclination: 0.0, jplId: '3', jplIdPlanetCenter: '399', 
        description: 'Our home, representing grounding, stability, and the material world. It is the stage upon which the celestial drama unfolds, a symbol of life and manifestation.',
        connectionColors: ['#4A90E2', '#50C878', '#FFFFFF'] // Blue, Emerald Green, Cloud White
    },
    { 
        name: 'Mars', color: '#CD5C5C', radius: 3.4, realRadius: 3390, orbitRadius: 227.9, period: 687, eccentricity: 0.093, inclination: 1.9, jplId: '4', jplIdPlanetCenter: '499', 
        description: 'The planet of action, desire, and raw energy. Mars drives our ambition, passion, and courage, but also represents conflict and aggression.',
        connectionColors: ['#CD5C5C', '#E74C3C', '#D35400'] // Red, Bright Red, Rust Orange
    },
    { 
        name: 'Jupiter', color: '#DAA520', radius: 69, realRadius: 69911, orbitRadius: 778.5, period: 4331, eccentricity: 0.048, inclination: 1.3, jplId: '5', jplIdPlanetCenter: '599', 
        description: 'The great expander, associated with growth, wisdom, and abundance. Jupiter brings luck, optimism, and a quest for higher knowledge and truth.',
        connectionColors: ['#DAA520', '#9B59B6', '#F4E4C1'] // Gold, Royal Purple (Zeus), Cream
    },
    { 
        name: 'Saturn', color: '#F4E4C1', radius: 58, realRadius: 58232, orbitRadius: 1432, period: 10747, eccentricity: 0.054, inclination: 2.5, jplId: '6', jplIdPlanetCenter: '699', 
        description: 'The taskmaster of the zodiac, governing structure, discipline, and karma. Saturn teaches lessons of responsibility, limitation, and the passage of time.',
        connectionColors: ['#F4E4C1', '#2C3E50', '#D4AC0D'] // Cream, Dark Grey (Lead/Time), Old Gold
    },
    { 
        name: 'Uranus', color: '#4FD0E0', radius: 25, realRadius: 25362, orbitRadius: 2867, period: 30589, eccentricity: 0.047, inclination: 0.8, jplId: '7', jplIdPlanetCenter: '799', 
        description: 'The awakener, representing revolution, innovation, and sudden change. Uranus shatters old paradigms, heralding breakthroughs and embracing the unconventional.',
        connectionColors: ['#4FD0E0', '#81D4FA', '#E0F7FA'] // Cyan, Light Sky Blue, Electric White
    },
    { 
        name: 'Neptune', color: '#4B70DD', radius: 24, realRadius: 24622, orbitRadius: 4495, period: 59800, eccentricity: 0.009, inclination: 1.8, jplId: '8', jplIdPlanetCenter: '899', 
        description: 'The mystic, ruling dreams, intuition, and the subconscious. Neptune dissolves boundaries, connecting us to the spiritual and imaginative realms.',
        connectionColors: ['#4B70DD', '#5D3FD3', '#2E86C1'] // Blue, Indigo, Deep Ocean
    },
    { 
        name: 'Pluto', color: '#9CA4AB', radius: 2, realRadius: 1188, orbitRadius: 5906, period: 90560, eccentricity: 0.249, inclination: 17.2, jplId: '9', jplIdPlanetCenter: '999', 
        description: 'The transformer, governing death, rebirth, and power. Pluto brings what is hidden to the surface, forcing profound change and regeneration.',
        connectionColors: ['#9CA4AB', '#5B2C6F', '#800000'] // Grey, Dark Purple, Maroon/Dark Red
    },
];

const extendedBodies: CelestialBodyData[] = [
    // Asteroids & Dwarf Planets for 'Sol (Extended)'
    { 
        name: 'Chiron', color: '#C4B5A0', radius: 1, realRadius: 115, orbitRadius: 2046, period: 18530, eccentricity: 0.380, inclination: 6.9, jplId: '2060;', 
        description: 'The "Wounded Healer," a comet-like body bridging Saturn and Uranus, symbolizing where we hold our deepest wounds and our greatest capacity for healing.',
        connectionColors: ['#C4B5A0', '#8D6E63', '#A1887F']
    },
    { 
        name: 'Ceres', color: '#D2B48C', radius: 3, realRadius: 476, orbitRadius: 413.7, period: 1680, eccentricity: 0.079, inclination: 10.6, jplId: '1;', 
        description: 'The largest object in the asteroid belt, representing nurturing, agriculture, and the cycles of loss and return. Governs how we care for ourselves and others.',
        connectionColors: ['#D2B48C', '#5D4037', '#8BC34A'] // Earthy brown, Green (Agriculture)
    },
    { 
        name: 'Pallas', color: '#A9A9A9', radius: 2, realRadius: 272, orbitRadius: 414.7, period: 1686, eccentricity: 0.231, inclination: 34.8, jplId: '2;', 
        description: 'Named for Pallas Athena, this asteroid embodies strategic intelligence, creative problem-solving, and the wisdom of the warrior goddess.',
        connectionColors: ['#A9A9A9', '#B0C4DE', '#708090'] // Metallic, Slate
    },
    { 
        name: 'Juno', color: '#8A2BE2', radius: 1, realRadius: 121, orbitRadius: 399.4, period: 1592, eccentricity: 0.256, inclination: 13.0, jplId: '3;', 
        description: 'Queen of the Gods, Juno represents partnership, marriage, and commitment. It highlights our need for balance and equity in relationships.',
        connectionColors: ['#8A2BE2', '#FF69B4', '#9370DB'] // Purple, Pink (Relationships)
    },
    { 
        name: 'Vesta', color: '#FF4500', radius: 2, realRadius: 263, orbitRadius: 353.4, period: 1326, eccentricity: 0.089, inclination: 7.1, jplId: '4;', 
        description: 'The keeper of the sacred flame, Vesta symbolizes devotion, purity, and what is most sacred to us. It governs our focus and dedication.',
        connectionColors: ['#FF4500', '#FFD700', '#FF6347'] // Fire Orange, Flame Gold, Red
    },
    { name: 'Eris', color: '#8B0000', radius: 4, realRadius: 1163, orbitRadius: 10120, period: 203830, eccentricity: 0.441, inclination: 44.2, jplId: '136199;', description: 'Goddess of discord and strife, this distant dwarf planet challenges our perceptions and forces us to confront uncomfortable truths.' },
    { name: 'Haumea', color: '#2E8B57', radius: 3, realRadius: 780, orbitRadius: 6452, period: 103990, eccentricity: 0.191, inclination: 28.2, jplId: '136108;', description: 'A rapidly spinning dwarf planet shaped like an egg, representing fertility, childbirth, and cycles of renewal and creation.' },
    { name: 'Makemake', color: '#D2691E', radius: 3, realRadius: 715, orbitRadius: 6850, period: 112890, eccentricity: 0.159, inclination: 29.0, jplId: '136472;', description: 'A creator deity in the mythology of Rapa Nui, this dwarf planet is associated with environmental consciousness and ingenuity.' },
    { name: 'Sedna', color: '#F0F8FF', radius: 2, realRadius: 498, orbitRadius: 75290, period: 4210000, eccentricity: 0.855, inclination: 11.9, jplId: '90377;', description: 'One of the most distant known objects in the solar system, Sedna represents deep spiritual truths, long-term transformation, and transcendence.' },
];

const allSolBodies: CelestialBodyData[] = [...majorPlanets, ...extendedBodies];

const sunData: CelestialBodyData = { 
    name: 'Sun', color: '#FDB813', 
    radius: 40, 
    realRadius: 696340, orbitRadius: 0, period: 0, eccentricity: 0, inclination: 0, jplId: '10', 
    description: 'The star at the center of the Sol system.',
    connectionColors: ['#FDB813', '#FF8C00', '#FFFF00'] // Sun Gold, Orange, Yellow
};

const moonData: CelestialBodyData = { 
    name: 'Moon', color: '#E0E0E0', radius: 1.7, realRadius: 1737, orbitRadius: 0.384, period: 27.3, eccentricity: 0.055, inclination: 5.1, jplId: '301', 
    description: 'Earth\'s natural satellite, governing emotions, instincts, and the rhythm of tides. The Moon reflects the light of the Sun, symbolizing our inner world and subconscious mind.',
    connectionColors: ['#E0E0E0', '#F8F8FF', '#B0C4DE'] // Silver, Ghost White, Light Steel Blue
};

// Specialized Sun for Geocentric view
const geocentricSunData: CelestialBodyData = {
    ...sunData,
    description: "In this geocentric visualization, the Sun is treated as a planet orbiting Earth. Its path traces the Ecliptic, the apparent path of the Sun across our sky over the course of a year."
};

// Simplified Geocentric body list: Sun, Moon, and Major Planets (excluding Earth itself)
const geocentricBodies = [
    geocentricSunData, 
    moonData, 
    ...majorPlanets.filter(body => body.name !== 'Earth' && body.name !== 'Pluto') // Remove Earth (center) and Pluto (too slow/far)
];


export const STAR_SYSTEMS: Record<string, StarSystem> = {
    'Sol': {
        name: 'Sol',
        star: {
            name: 'The Sun',
            description: 'The heart of our solar system, a G-type main-sequence star. It is the source of all light and life, representing the core self, vitality, and consciousness.'
        },
        celestialBodies: majorPlanets,
    },
    'Sol (Extended)': {
        name: 'Sol (Extended)',
        star: {
            name: 'The Sun',
            description: 'The heart of our solar system, including major asteroids and dwarf planets that add layers of nuance and depth to the celestial story.'
        },
        celestialBodies: allSolBodies,
    },
    'Geo-centric': {
        name: 'Geo-centric',
        star: {
            name: 'Earth (Geocentric View)',
            description: 'A geocentric model where all celestial bodies orbit a stationary Earth. The orbit paths show specific resonance patterns (e.g., Venus Pentagram, Mars Retrograde).'
        },
        celestialBodies: geocentricBodies,
    },
    'Golden Spiral': {
        name: 'Golden Spiral',
        star: {
            name: 'Phi Leonis',
            description: 'A hypothetical star system where the planets\' orbits are arranged in a perfect logarithmic spiral based on the Golden Ratio (φ ≈ 1.618), creating a pattern of natural, harmonious growth.'
        },
        celestialBodies: [
            { name: 'Aura', color: '#FFB813', radius: 4, realRadius: 4000, orbitRadius: 100, period: 100, eccentricity: 0, inclination: 0, description: 'The inner seed of the golden spiral, setting the initial rhythm.' },
            { name: 'Brio', color: '#FF8F00', radius: 6, realRadius: 6000, orbitRadius: 161.8, period: 161.8, eccentricity: 0, inclination: 0, description: 'The second planet, its orbit perfectly φ times larger than the first.' },
            { name: 'Canto', color: '#FF6347', radius: 8, realRadius: 8000, orbitRadius: 261.8, period: 261.8, eccentricity: 0, inclination: 0, description: 'Continuing the spiral outwards, a testament to cosmic geometry.' },
            { name: 'Danza', color: '#E53E3E', radius: 10, realRadius: 10000, orbitRadius: 423.6, period: 423.6, eccentricity: 0, inclination: 0, description: 'The fourth step in the celestial dance of phi.' },
            { name: 'Elysia', color: '#B92100', radius: 12, realRadius: 12000, orbitRadius: 685.4, period: 685.4, eccentricity: 0, inclination: 0, description: 'The outermost known planet in this perfectly ordered system.' },
        ],
    },
    'Musical Scale': {
        name: 'Musical Scale',
        star: {
            name: 'Harmonia',
            description: 'An imaginary system where the orbital periods of the planets correspond to the harmonic ratios of a musical scale, turning orbital mechanics into a visual symphony.'
        },
        celestialBodies: [
            { name: 'Tonic (C)', color: '#FF6B6B', radius: 4, realRadius: 4000, orbitRadius: 100, period: 200, eccentricity: 0.01, inclination: 0, description: 'The root note of the system, establishing the fundamental frequency.' },
            { name: 'Supertonic (D)', color: '#FF9E7D', radius: 4.5, realRadius: 4500, orbitRadius: 112.5, period: 225, eccentricity: 0.01, inclination: 0, description: 'The second degree of the scale, in a 9:8 ratio with the Tonic.' },
            { name: 'Mediant (E)', color: '#FFD93D', radius: 5, realRadius: 5000, orbitRadius: 125, period: 250, eccentricity: 0.01, inclination: 0, description: 'The third degree, forming a major third (5:4 ratio) with the Tonic.' },
            { name: 'Subdominant (F)', color: '#6BCF7F', radius: 5.3, realRadius: 5300, orbitRadius: 133.3, period: 266.67, eccentricity: 0.01, inclination: 0, description: 'The fourth degree, a perfect fourth (4:3 ratio) above the Tonic.' },
            { name: 'Dominant (G)', color: '#4ECDC4', radius: 6, realRadius: 6000, orbitRadius: 150, period: 300, eccentricity: 0.01, inclination: 0, description: 'The fifth degree, a perfect fifth (3:2 ratio), creating a powerful harmonic relationship.' },
            { name: 'Submediant (A)', color: '#45B7D1', radius: 6.7, realRadius: 6700, orbitRadius: 166.7, period: 333.33, eccentricity: 0.01, inclination: 0, description: 'The sixth degree of the scale, a major sixth (5:3 ratio).' },
            { name: 'Leading Tone (B)', color: '#5C7CFA', radius: 7.5, realRadius: 7500, orbitRadius: 187.5, period: 375, eccentricity: 0.01, inclination: 0, description: 'The seventh degree, creating tension that resolves to the octave (15:8 ratio).' },
            { name: 'Octave (C)', color: '#845EC2', radius: 8, realRadius: 8000, orbitRadius: 200, period: 400, eccentricity: 0.01, inclination: 0, description: 'The completion of the scale, vibrating at exactly double the Tonic\'s frequency (2:1 ratio).' },
        ],
    },
    'Kepler-16': {
        name: 'Kepler-16',
        star: {
            name: 'Kepler-16 (Tatooine)',
            description: 'A remarkable binary star system, 245 light-years away, where a Saturn-sized planet orbits two stars. This was the first confirmed discovery of a circumbinary planet.'
        },
        stars: [
            { name: 'Kepler-16 A', color: '#FFDDB4', radius: 40, realRadius: 453300, orbitRadius: 7.33, period: 41.079, eccentricity: 0.0069, inclination: 0, phaseOffset: 180, description: 'The larger of the two stars in the Kepler-16 binary system, a K-type main-sequence star slightly smaller and cooler than our Sun.' },
            { name: 'Kepler-16 B', color: '#FF8C69', radius: 14, realRadius: 140600, orbitRadius: 25.58, period: 41.079, eccentricity: 0.0069, inclination: 0, phaseOffset: 0, description: 'The smaller of the two stars, a red dwarf that orbits a common center of mass with its larger companion every 41 days.' }
        ],
        celestialBodies: [
            { name: 'Kepler-16 A', color: '#FFDDB4', radius: 40, realRadius: 453300, orbitRadius: 7.33, period: 41.079, eccentricity: 0.0069, inclination: 0, phaseOffset: 180, description: 'The larger of the two stars in the Kepler-16 binary system, a K-type main-sequence star slightly smaller and cooler than our Sun.' },
            { name: 'Kepler-16 B', color: '#FF8C69', radius: 14, realRadius: 140600, orbitRadius: 25.58, period: 41.079, eccentricity: 0.0069, inclination: 0, phaseOffset: 0, description: 'The smaller of the two stars, a red dwarf that orbits a common center of mass with its larger companion every 41 days.' },
            { name: 'Kepler-16b', color: '#F4E4C1', radius: 50, realRadius: 52400, orbitRadius: 105.4, period: 228.776, eccentricity: 0.0069, inclination: 0, description: 'A Saturn-mass gas giant that orbits both stars of the Kepler-16 system, earning it the nickname "Tatooine." It is the first confirmed circumbinary planet discovered.' }
        ],
    },
    'Kepler-90': {
        name: 'Kepler-90',
        star: {
            name: 'Kepler-90',
            description: 'A Sun-like star 2,545 light-years away, notable for being the first system found with eight planets. Its planets are packed into tight orbits, creating a "miniature" version of our own solar system.'
        },
        celestialBodies: [
            { name: 'Kepler-90b', color: '#a6a6a6', radius: 7, realRadius: 8346, orbitRadius: 11.07, period: 7.0, eccentricity: 0.15, inclination: 0.1, description: 'A "super-Earth" so close to its star that it completes an orbit in less than two days, likely a scorching, tidally locked world.' },
            { name: 'Kepler-90c', color: '#bfbfbf', radius: 6, realRadius: 7518, orbitRadius: 13.31, period: 8.7, eccentricity: 0.063, inclination: 0.1, description: 'Another super-Earth, orbiting in a near 5:4 resonance with its neighbor, Kepler-90b.' },
            { name: 'Kepler-90i', color: '#d9d9d9', radius: 7, realRadius: 8410, orbitRadius: 17.95, period: 14.4, eccentricity: 0.01, inclination: 0.05, description: 'The eighth planet discovered, found by AI, making Kepler-90 the first 8-planet system found besides our own.' },
            { name: 'Kepler-90d', color: '#55a1b2', radius: 15, realRadius: 18348, orbitRadius: 47.87, period: 59.7, eccentricity: 0.02, inclination: 0.2, description: 'A "mini-Neptune" marking a significant step out from the tightly-packed inner planets.' },
            { name: 'Kepler-90e', color: '#5da493', radius: 14, realRadius: 17011, orbitRadius: 62.83, period: 91.9, eccentricity: 0.03, inclination: 0.25, description: 'Another mini-Neptune, orbiting in a near 3:2 resonance with Kepler-90d.' },
            { name: 'Kepler-90f', color: '#73bf82', radius: 15, realRadius: 18412, orbitRadius: 79.29, period: 124.9, eccentricity: 0.04, inclination: 0.18, description: 'This planet is in a 4:3 orbital resonance with its neighbor, Kepler-90e, contributing to the system\'s stability.' },
            { name: 'Kepler-90g', color: '#e5de73', radius: 43, realRadius: 51796, orbitRadius: 109.21, period: 210.6, eccentricity: 0.049, inclination: 0.3, description: 'A "gas giant" similar in size to Neptune, orbiting in a near 5:3 resonance with Kepler-90h.' },
            { name: 'Kepler-90h', color: '#e5b373', radius: 60, realRadius: 72120, orbitRadius: 151.09, period: 331.6, eccentricity: 0.012, inclination: 0.2, description: 'The largest planet in the system, a gas giant similar to Jupiter, orbiting its star at about the same distance as Earth orbits the Sun.' },
        ],
    },
    'Gliese 876': {
        name: 'Gliese 876',
        star: {
            name: 'Gliese 876',
            description: 'A nearby red dwarf star, just 15 light-years away. It hosts a remarkable system of planets, including three locked in a rare 1:2:4 Laplace orbital resonance, creating a precise cosmic clock.'
        },
        celestialBodies: [
            { name: 'Gliese 876 d', color: '#E67E22', radius: 6.8, realRadius: 8688, orbitRadius: 3.14, period: 1.94, eccentricity: 0.207, inclination: 59, description: 'A Super-Earth so close to its star that it completes an orbit in less than two days, likely a scorching, tidally locked world.' },
            { name: 'Gliese 876 c', color: '#F39C12', radius: 24, realRadius: 30427, orbitRadius: 19.44, period: 30.1, eccentricity: 0.25, inclination: 59, description: 'A gas giant in a 2:1 resonance with planet b. Its highly eccentric orbit creates dramatic gravitational interactions.' },
            { name: 'Gliese 876 b', color: '#27AE60', radius: 30, realRadius: 38222, orbitRadius: 31.41, period: 61.1, eccentricity: 0.03, inclination: 59, description: 'The first planet discovered in the system, a large gas giant participating in the delicate Laplace resonance.' },
            { name: 'Gliese 876 e', color: '#1ABC9C', radius: 14, realRadius: 17850, orbitRadius: 49.37, period: 124, eccentricity: 0.055, inclination: 59, description: 'A gas giant orbiting further out, completing the known system and adding to its complex gravitational dance.' },
        ],
    },
    'Proxima Centauri': {
        name: 'Proxima Centauri',
        star: {
            name: 'Proxima Centauri',
            description: 'Our closest stellar neighbor, this small red dwarf is just 4.24 light-years away. It hosts at least three known planets, including one within its habitable zone.'
        },
        celestialBodies: [
            { name: 'Proxima d', color: '#a1887f', radius: 5, realRadius: 5096, orbitRadius: 4.3, period: 5.12, eccentricity: 0.04, inclination: 1.0, description: 'A tiny, sub-Earth candidate orbiting extremely close to the star, likely a scorched rock with a year lasting only five days.' },
            { name: 'Proxima b', color: '#81c784', radius: 7, realRadius: 7008, orbitRadius: 7.5, period: 11.18, eccentricity: 0.04, inclination: 2.0, description: 'An Earth-sized exoplanet orbiting within the habitable zone of Proxima Centauri, making it a primary target in the search for extraterrestrial life.' },
            { name: 'Proxima c', color: '#90a4ae', radius: 10, realRadius: 10830, orbitRadius: 220.0, period: 1928, eccentricity: 0.04, inclination: 133.0, description: 'A much larger and colder planet orbiting far beyond Proxima b, likely a mini-Neptune or a Super-Earth with a thick atmosphere.' },
        ],
    },
    'TRAPPIST-1': {
        name: 'TRAPPIST-1',
        star: {
            name: 'TRAPPIST-1',
            description: 'An ultra-cool red dwarf star, located 40 light-years away. It is host to a compact system of seven Earth-sized, rocky planets, some of which may harbor liquid water.'
        },
        celestialBodies: [
            { name: 'TRAPPIST-1b', color: '#c78d52', radius: .71, realRadius: 7111, orbitRadius: 1.66, period: 1.51, eccentricity: 0.006, inclination: 0.1, description: 'The innermost planet, tidally locked and scorched by its star, completing an orbit in just 1.5 Earth days.' },
            { name: 'TRAPPIST-1c', color: '#c7a352', radius: .7, realRadius: 6990, orbitRadius: 2.38, period: 2.42, eccentricity: 0.006, inclination: 0.1, description: 'Slightly larger than Earth, likely with a thick, Venus-like atmosphere due to its proximity to the star.' },
            { name: 'TRAPPIST-1d', color: '#52c78d', radius: .5, realRadius: 5020, orbitRadius: 3.32, period: 4.05, eccentricity: 0.008, inclination: 0.1, description: 'Receives about the same amount of light as Earth. It orbits on the inner edge of the habitable zone.' },
            { name: 'TRAPPIST-1e', color: '#528dc7', radius: .59, realRadius: 5860, orbitRadius: 4.33, period: 6.10, eccentricity: 0.005, inclination: 0.1, description: 'Considered one of the most promising candidates for habitability, with a size and density similar to Earth.' },
            { name: 'TRAPPIST-1f', color: '#8d52c7', radius: .67, realRadius: 6660, orbitRadius: 5.78, period: 9.21, eccentricity: 0.01, inclination: 0.1, description: 'Orbits within the habitable zone, potentially a water world covered by a global ocean and a thick ice shell.' },
            { name: 'TRAPPIST-1g', color: '#c7528d', radius: .72, realRadius: 7190, orbitRadius: 6.89, period: 12.35, eccentricity: 0.002, inclination: 0.1, description: 'The largest planet in the system, orbiting on the outer edge of the habitable zone.' },
            { name: 'TRAPPIST-1h', color: '#c75252', radius: .48, realRadius: 4810, orbitRadius: 9.2, period: 18.77, eccentricity: 0.005, inclination: 0.1, description: 'The outermost and coldest planet, likely a frozen, icy world far from its star\'s warmth.' },
        ],
    },
    'Cubica': {
        name: 'Cubica',
        star: {
            name: 'Cubica Prime',
            description: 'A theoretical construct system where celestial bodies are placed at the vertices of a cube, demonstrating perfect geometric and harmonic relationships.'
        },
        celestialBodies: [
            { name: 'Top-NE', color: '#FF6B6B', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: 200, description: 'Vertex of the upper plane.' },
            { name: 'Top-NW', color: '#FFD93D', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: 200, phaseOffset: 90, description: 'Vertex of the upper plane.' },
            { name: 'Top-SW', color: '#6BCF7F', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: 200, phaseOffset: 180, description: 'Vertex of the upper plane.' },
            { name: 'Top-SE', color: '#45B7D1', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: 200, phaseOffset: 270, description: 'Vertex of the upper plane.' },
            { name: 'Bot-NE', color: '#5C7CFA', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: -200, description: 'Vertex of the lower plane.' },
            { name: 'Bot-NW', color: '#845EC2', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: -200, phaseOffset: 90, description: 'Vertex of the lower plane.' },
            { name: 'Bot-SW', color: '#FF9E7D', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: -200, phaseOffset: 180, description: 'Vertex of the lower plane.' },
            { name: 'Bot-SE', color: '#4ECDC4', radius: 5, realRadius: 5000, orbitRadius: 300, period: 1000, eccentricity: 0, inclination: -200, phaseOffset: 270, description: 'Vertex of the lower plane.' },
            { name: 'Reson-A', color: '#00FFFF', radius: 2, realRadius: 2000, orbitRadius: 150, period: 250, eccentricity: 0, inclination: 0, description: 'Inner resonant body.' },
            { name: 'Reson-B', color: '#FF00FF', radius: 2, realRadius: 2000, orbitRadius: 450, period: 1750, eccentricity: 0, inclination: 0, description: 'Outer resonant body.' },
            { name: 'Reson-C', color: '#ADFF2F', radius: 2, realRadius: 2000, orbitRadius: 600, period: 2500, eccentricity: 0, inclination: 0, description: 'Far resonant body.' },
        ]
    }
};
