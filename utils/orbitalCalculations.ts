// Simplified orbital calculations based on constants from sources like NASA.
// This provides a good-enough approximation for visualization purposes.
import { PERTURBATION_DAMPING_CENTURIES } from '../constants';

type OrbitalElements = {
    // a: Semi-major axis (AU)
    // e: Eccentricity
    // i: Inclination (degrees)
    // L: Mean longitude (degrees)
    // Lp: Longitude of perihelion (degrees)
    // N: Longitude of ascending node (degrees)
    a: number;
    e: [number, number];
    i: [number, number];
    L: [number, number];
    Lp: [number, number];
    N: [number, number];
};

const PLANET_ELEMENTS: Record<string, OrbitalElements> = {
    Mercury: {
        a: 0.387098,
        e: [0.205630, 0.00002037],
        i: [7.00487, -0.005947],
        L: [252.25084, 149472.67411],
        Lp: [77.45645, 0.160475],
        N: [48.33167, -0.125340]
    },
    Venus: {
        a: 0.723332,
        e: [0.006773, -0.00004774],
        i: [3.39471, -0.000788],
        L: [181.97973, 58517.81534],
        Lp: [131.53298, 0.002683],
        N: [76.68069, -0.277694]
    },
    Earth: {
        a: 1.000000,
        e: [0.016710, -0.00004204],
        i: [0.00005, -0.012946],
        L: [100.46435, 35999.37285],
        Lp: [102.94719, 0.322555],
        N: [0.0, 0.0]
    },
    Mars: {
        a: 1.523662,
        e: [0.093412, 0.00007743],
        i: [1.85061, -0.025464],
        L: [355.45332, 19140.29931],
        Lp: [336.04084, 0.444561],
        N: [49.57854, -0.292573]
    },
    Jupiter: {
        a: 5.203363,
        e: [0.048393, 0.00018445],
        i: [1.30530, -0.005496],
        L: [34.40438, 3034.90561],
        Lp: [14.75385, 0.216234],
        N: [100.55615, 0.329444]
    },
    Saturn: {
        a: 9.537070,
        e: [0.054151, -0.00036660],
        i: [2.48446, 0.002410],
        L: [49.94432, 1222.11379],
        Lp: [92.43194, -0.547144],
        N: [113.71504, -0.288676]
    },
    Uranus: {
        a: 19.19126,
        e: [0.047168, -0.00004397],
        i: [0.76986, -0.002429],
        L: [313.23218, 428.46699],
        Lp: [170.96424, 0.408051],
        N: [74.22988, 0.042405]
    },
    Neptune: {
        a: 30.06896,
        e: [0.008586, 0.00002512],
        i: [1.76917, -0.003964],
        L: [304.88003, 218.48602],
        Lp: [44.97135, -0.322413],
        N: [131.72169, -0.005786]
    },
    Pluto: { // Dwarf Planet, for completeness
        a: 39.48168,
        e: [0.248808, 0.00006465],
        i: [17.14175, 0.00004818],
        L: [238.92881, 145.20785],
        Lp: [224.06676, -0.040629],
        N: [110.30347, -0.011834]
    }
};

const DEG2RAD = Math.PI / 180;

const normalizeAngle = (angle: number) => {
    let b = angle / 360;
    let a = 360 * (b - Math.floor(b));
    if (a < 0) a += 360;
    return a;
};

export const getPlanetPosition = (planetName: string, date: Date): { x: number; y: number; z: number } | null => {
    const elements = PLANET_ELEMENTS[planetName];
    if (!elements) return null;

    // Julian Day calculation
    const time = date.getTime() / 86400000 + 2440587.5;
    const T = (time - 2451545.0) / 36525; // Julian centuries since J2000

    // Damping factor to prevent linear extrapolation from becoming unstable over long periods.
    // The effect is halved at PERTURBATION_DAMPING_CENTURIES (e.g., 150,000 years).
    const dampingFactor = 1 / (1 + Math.abs(T) / PERTURBATION_DAMPING_CENTURIES);

    // Orbital elements for the given time
    const a = elements.a;
    // Apply damping to elements that define the orbit's shape and orientation.
    const e = elements.e[0] + (elements.e[1] * T * dampingFactor);
    const i = elements.i[0] + (elements.i[1] * T * dampingFactor);
    const Lp = elements.Lp[0] + (elements.Lp[1] * T * dampingFactor);
    const N = elements.N[0] + (elements.N[1] * T * dampingFactor);

    // Do NOT dampen Mean Longitude (L). It represents the planet's actual progress along its orbit.
    // Damping it would incorrectly slow the planet down over long timescales.
    const L = normalizeAngle(elements.L[0] + elements.L[1] * T);


    // Argument of perihelion
    const w = Lp - N;

    // Mean anomaly
    let M = L - Lp;
    if (M < 0) M += 360;
    
    // Eccentric anomaly (solve Kepler's equation M = E - e*sin(E)) using Newton's method
    let E = M;
    for (let iter = 0; iter < 10; iter++) {
        const dE = (E - e * Math.sin(E * DEG2RAD) - M) / (1 - e * Math.cos(E * DEG2RAD));
        E -= dE;
        if (Math.abs(dE) < 1e-6) break;
    }
    
    // Heliocentric coordinates in the orbital plane
    const Px = a * (Math.cos(E * DEG2RAD) - e);
    const Py = a * Math.sqrt(1 - e * e) * Math.sin(E * DEG2RAD);
    
    // Convert to radians for trig functions
    const iRad = i * DEG2RAD;
    const NRad = N * DEG2RAD;
    const wRad = w * DEG2RAD;
    
    const cosN = Math.cos(NRad);
    const sinN = Math.sin(NRad);
    const cosw = Math.cos(wRad);
    const sinw = Math.sin(wRad);
    const cosi = Math.cos(iRad);
    const sini = Math.sin(iRad);

    // Rotate to ecliptic plane
    const x = (cosN * cosw - sinN * sinw * cosi) * Px + (-cosN * sinw - sinN * cosw * cosi) * Py;
    const y = (sinN * cosw + cosN * sinw * cosi) * Px + (-sinN * sinw + cosN * cosw * cosi) * Py;
    const z = (sinw * sini) * Px + (cosw * sini) * Py;

    return { x, y, z };
};