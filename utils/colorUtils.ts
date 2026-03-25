
import { GradientStop } from "../types";

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        return null; // Invalid hex
    }
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
};

export const rgbToHsv = ({ r, g, b }: { r: number, g: number, b: number }): { h: number; s: number; v: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
};

export const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    s /= 100; v /= 100;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    const mod = i % 6;
    const r = [v, q, p, p, t, v][mod];
    const g = [t, v, v, q, p, p][mod];
    const b = [p, p, t, v, v, q][mod];
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export const rgbToHex = ({ r, g, b }: { r: number, g: number, b: number }): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const lerp = (start: number, end: number, amt: number): number => (1 - amt) * start + amt * end;

export const lerpRGB = (color1: {r:number,g:number,b:number}, color2: {r:number,g:number,b:number}, strength: number): {r:number,g:number,b:number} => ({
    r: Math.round(lerp(color1.r, color2.r, strength)),
    g: Math.round(lerp(color1.g, color2.g, strength)),
    b: Math.round(lerp(color1.b, color2.b, strength)),
});

export const ID_COLOR_STEP = 10001;

export const idToRgb = (id: number): [number, number, number] => {
    const mappedId = id * ID_COLOR_STEP;
    const r = (mappedId & 0x0000FF);
    const g = (mappedId & 0x00FF00) >> 8;
    const b = (mappedId & 0xFF0000) >> 16;
    return [r, g, b];
};

export const rgbToId = (r: number, g: number, b: number): number => {
    const mappedId = r | (g << 8) | (b << 16);
    return Math.round(mappedId / ID_COLOR_STEP);
};

/**
 * Samples a color from a multi-stop gradient.
 * @param stops Array of gradient stops, should be sorted by position.
 * @param t The normalized position (0-1) to sample.
 */
export const sampleGradient = (stops: GradientStop[], t: number): string => {
    if (stops.length === 0) return '#FFFFFF';
    if (stops.length === 1) return stops[0].color;

    t = Math.max(0, Math.min(1, t));

    // Sort to be safe, though input should ideally be sorted
    const sorted = [...stops].sort((a, b) => a.position - b.position);

    // If t is before first stop or after last stop
    if (t <= sorted[0].position) return sorted[0].color;
    if (t >= sorted[sorted.length - 1].position) return sorted[sorted.length - 1].color;

    // Find the two stops t is between
    for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i + 1];
        
        if (t >= start.position && t <= end.position) {
            const range = end.position - start.position;
            let localT = range === 0 ? 0 : (t - start.position) / range;

            // --- Interpolation Logic ---
            const mode = start.interpolation || 'linear';
            
            // 'Step' mode in the editor currently renders as the NEXT color for the whole segment.
            if (mode === 'step') {
                return end.color;
            }

            // --- Bias Logic ---
            const bias = start.bias ?? 0.5;
            if (bias !== 0.5) {
                 // Adjust localT based on bias (0.5 is neutral)
                 // Formula: t' = t ^ (ln(0.5) / ln(bias))
                 if (localT > 0 && localT < 1 && bias > 0 && bias < 1) {
                    const k = Math.log(0.5) / Math.log(bias);
                    localT = Math.pow(localT, k);
                 }
            }

            // --- Easing ---
            if (mode === 'smooth') {
                 // Smoothstep: 3t^2 - 2t^3
                 localT = localT * localT * (3 - 2 * localT);
            } else if (mode === 'cubic') {
                 // Cubic Ease In-Out
                 localT = localT < 0.5 ? 4 * localT * localT * localT : 1 - Math.pow(-2 * localT + 2, 3) / 2;
            }

            // Color Interpolation
            const c1 = hexToRgb(start.color);
            const c2 = hexToRgb(end.color);
            if (c1 && c2) {
                return rgbToHex(lerpRGB(c1, c2, localT));
            }
        }
    }
    return sorted[0].color;
};

export const getGradientCssString = (stops: GradientStop[]) => {
    // Reconstruct CSS to match the visual editor's logic
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    if (sorted.length === 0) return 'none';
    if (sorted.length === 1) return sorted[0].color;

    const parts: string[] = [];
    for (let i = 0; i < sorted.length; i++) {
        const curr = sorted[i];
        parts.push(`${curr.color} ${curr.position * 100}%`);
        
        if (i < sorted.length - 1) {
            const next = sorted[i+1];
            // CSS Gradient Hinting for Bias
            if (curr.interpolation === 'step') {
                 // Step creates a hard jump to the next color
                 parts.push(`${next.color} ${curr.position * 100}%`);
            } else if ((curr.bias ?? 0.5) !== 0.5) {
                 const bias = curr.bias ?? 0.5;
                 const range = next.position - curr.position;
                 // CSS hint is absolute position
                 const hintPos = curr.position + (range * bias);
                 parts.push(`${hintPos * 100}%`);
            }
        }
    }
    return `linear-gradient(to right, ${parts.join(', ')})`;
};
