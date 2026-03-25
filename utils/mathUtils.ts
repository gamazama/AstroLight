/**
 * Linearly interpolates between two numbers.
 * @param start The starting value.
 * @param end The ending value.
 * @param amt The interpolation amount (0.0 to 1.0).
 * @returns The interpolated value.
 */
export const lerp = (start: number, end: number, amt: number): number => {
    return (1 - amt) * start + amt * end;
};

/**
 * Converts a linear slider value to a logarithmic scale.
 * @param sliderValue The value from the slider (e.g., 0-1000).
 * @param min The minimum value of the logarithmic scale.
 * @param max The maximum value of the logarithmic scale.
 * @param sliderMax The maximum value of the slider's range.
 * @returns The corresponding value on the logarithmic scale.
 */
export const sliderToLogValue = (sliderValue: number, min: number, max: number, sliderMax: number = 1000): number => {
    const minLog = Math.log(min);
    const maxLog = Math.log(max);
    const logValue = minLog + (sliderValue / sliderMax) * (maxLog - minLog);
    return Math.exp(logValue);
};

/**
 * Converts a value from a logarithmic scale back to a linear slider value.
 * @param logValue The value on the logarithmic scale.
 * @param min The minimum value of the logarithmic scale.
 * @param max The maximum value of the logarithmic scale.
 * @param sliderMax The maximum value of the slider's range.
 * @returns The corresponding linear value for the slider.
 */
export const logToSliderValue = (logValue: number, min: number, max: number, sliderMax: number = 1000): number => {
    if (logValue <= 0) return 0;
    const minLog = Math.log(min);
    const maxLog = Math.log(max);
    return ((Math.log(logValue) - minLog) / (maxLog - minLog)) * sliderMax;
};

/**
 * Converts a symmetric slider value (e.g., -1000 to 1000) to a symmetric logarithmic scale.
 * This is useful for values that can be positive or negative, where sensitivity is needed around zero.
 * @param sliderValue The value from the slider.
 * @param max The maximum absolute value of the logarithmic scale.
 * @param sliderMax The maximum absolute value of the slider's range.
 * @returns The corresponding value on the symmetric logarithmic scale.
 */
export const sliderToSymmetricLogValue = (sliderValue: number, max: number, sliderMax: number = 1000): number => {
    const sign = Math.sign(sliderValue);
    if (sign === 0) return 0;
    const logMax = Math.log(max + 1);
    const absSliderValue = Math.abs(sliderValue);
    const value = Math.exp(absSliderValue / sliderMax * logMax) - 1;
    return sign * value;
};

/**
 * Converts a value from a symmetric logarithmic scale back to a linear symmetric slider value.
 * @param logValue The value on the symmetric logarithmic scale.
 * @param max The maximum absolute value of the logarithmic scale.
 * @param sliderMax The maximum absolute value of the slider's range.
 * @returns The corresponding linear value for the slider.
 */
export const symmetricLogToSliderValue = (logValue: number, max: number, sliderMax: number = 1000): number => {
    const sign = Math.sign(logValue);
    if (sign === 0) return 0;
    const logMax = Math.log(max + 1);
    const absLogValue = Math.abs(logValue);
    const value = (Math.log(absLogValue + 1) / logMax) * sliderMax;
    return sign * value;
};

/**
 * A factory for creating cubic-bezier easing functions.
 * This allows for precise control over animation curves, such as creating
 * asymmetrical "ease-in-out" effects.
 * @param p1x - The x-coordinate of the first control point (controls ease-in strength).
 * @param p1y - The y-coordinate of the first control point.
 * @param p2x - The x-coordinate of the second control point (controls ease-out strength).
 * @param p2y - The y-coordinate of the second control point.
 * @returns An easing function that takes a progress value `t` from 0 to 1.
 */
export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
    const sampleCurveDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

    const solveCurveX = (x: number) => {
        let t2 = x;
        for (let i = 0; i < 8; i++) {
            const x2 = sampleCurveX(t2) - x;
            if (Math.abs(x2) < 1e-6) return t2;
            const derivative = sampleCurveDerivativeX(t2);
            if (Math.abs(derivative) < 1e-6) break;
            t2 = t2 - x2 / derivative;
        }
        let t0 = 0, t1 = 1;
        t2 = x;
        while (t0 < t1) {
            const x2 = sampleCurveX(t2);
            if (Math.abs(x2 - x) < 1e-6) return t2;
            if (x > x2) t0 = t2; else t1 = t2;
            t2 = (t1 - t0) * 0.5 + t0;
        }
        return t2;
    };

    return (x: number) => sampleCurveY(solveCurveX(x));
}


/**
 * A versatile easing function that can use standard polynomial curves or accept
 * a custom function (like one generated by `cubicBezier`).
 * @param t Progress from 0 to 1.
 * @param weighting The type of ease to apply ('ease-in', 'ease-out', 'ease-in-out'), or a custom easing function.
 * @returns Eased progress from 0 to 1.
 */
export const smoothEase = (t: number, weighting: 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number)): number => {
    if (typeof weighting === 'function') {
        return weighting(t);
    }
    switch (weighting) {
        case 'ease-in':
            return t * t * t * t; // Quartic ease-in ("slow at the start")
        case 'ease-out':
            return 1 - Math.pow(1 - t, 4); // Quartic ease-out ("slow at the end")
        case 'ease-in-out':
        default:
            return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; // Quartic ease-in-out
    }
};