// =================================================================================================
// DSP HELPER CLASSES
// =================================================================================================

// A "Direct Form II Transposed" Biquad filter implementation, which is more
// numerically stable for audio processing than Direct Form I.
class BiquadFilter {
    constructor() {
        this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
        this.z1 = 0; this.z2 = 0;
        // Keep track of current parameters to avoid expensive recalculation
        this.type = ''; this.cutoff = -1; this.Q = -1; this.sampleRate = -1; this.gainDb = 0;
    }

    setParams(type, cutoff, Q, sampleRate, gainDb = 0) {
        // If parameters haven't changed, do nothing.
        if (this.type === type && this.cutoff === cutoff && this.Q === Q && this.sampleRate === sampleRate && this.gainDb === gainDb) {
            return;
        }

        this.type = type;
        this.cutoff = cutoff;
        this.Q = Q;
        this.sampleRate = sampleRate;
        this.gainDb = gainDb;

        const w0 = 2 * Math.PI * cutoff / this.sampleRate;
        const cos_w0 = Math.cos(w0);
        const sin_w0 = Math.sin(w0);
        const alpha = sin_w0 / (2 * Q);
        const A = Math.pow(10, gainDb / 40);

        let a0, a1, a2, b0, b1, b2;

        switch (type) {
            case 'lowpass':
                b0 = (1 - cos_w0) / 2;
                b1 = 1 - cos_w0;
                b2 = (1 - cos_w0) / 2;
                a0 = 1 + alpha;
                a1 = -2 * cos_w0;
                a2 = 1 - alpha;
                break;
            case 'highpass':
                b0 = (1 + cos_w0) / 2;
                b1 = -(1 + cos_w0);
                b2 = (1 + cos_w0) / 2;
                a0 = 1 + alpha;
                a1 = -2 * cos_w0;
                a2 = 1 - alpha;
                break;
            case 'bandpass':
                b0 = alpha;
                b1 = 0;
                b2 = -alpha;
                a0 = 1 + alpha;
                a1 = -2 * cos_w0;
                a2 = 1 - alpha;
                break;
            case 'notch':
                b0 = 1;
                b1 = -2 * cos_w0;
                b2 = 1;
                a0 = 1 + alpha;
                a1 = -2 * cos_w0;
                a2 = 1 - alpha;
                break;
            case 'peaking':
                b0 = 1 + alpha * A;
                b1 = -2 * cos_w0;
                b2 = 1 - alpha * A;
                a0 = 1 + alpha / A;
                a1 = -2 * cos_w0;
                a2 = 1 - alpha / A;
                break;
            case 'lowshelf':
                b0 = A * ((A + 1) - (A - 1) * cos_w0 + 2 * Math.sqrt(A) * alpha);
                b1 = 2 * A * ((A - 1) - (A + 1) * cos_w0);
                b2 = A * ((A + 1) - (A - 1) * cos_w0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) + (A - 1) * cos_w0 + 2 * Math.sqrt(A) * alpha;
                a1 = -2 * ((A - 1) + (A + 1) * cos_w0);
                a2 = (A + 1) + (A - 1) * cos_w0 - 2 * Math.sqrt(A) * alpha;
                break;
            case 'highshelf':
                b0 = A * ((A + 1) + (A - 1) * cos_w0 + 2 * Math.sqrt(A) * alpha);
                b1 = -2 * A * ((A - 1) + (A + 1) * cos_w0);
                b2 = A * ((A + 1) + (A - 1) * cos_w0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) - (A - 1) * cos_w0 + 2 * Math.sqrt(A) * alpha;
                a1 = 2 * ((A - 1) - (A + 1) * cos_w0);
                a2 = (A + 1) - (A - 1) * cos_w0 - 2 * Math.sqrt(A) * alpha;
                break;
            default: // Defaults to lowpass
                b0 = (1 - cos_w0) / 2;
                b1 = 1 - cos_w0;
                b2 = (1 - cos_w0) / 2;
                a0 = 1 + alpha;
                a1 = -2 * cos_w0;
                a2 = 1 - alpha;
                break;
        }
        
        // Normalize coefficients
        this.b0 = b0 / a0;
        this.b1 = b1 / a0;
        this.b2 = b2 / a0;
        this.a1 = a1 / a0;
        this.a2 = a2 / a0;
    }

    process(input) {
        // DF2T implementation
        const y = this.b0 * input + this.z1;
        
        // Stability guard: if output becomes non-finite, reset state to prevent propagation.
        if (!isFinite(y)) {
            this.z1 = 0;
            this.z2 = 0;
            return 0;
        }
        
        this.z1 = this.b1 * input - this.a1 * y + this.z2;
        this.z2 = this.b2 * input - this.a2 * y;
        return y;
    }
}
