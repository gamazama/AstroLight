// --- NEW REVERB IMPLEMENTATION (FDN) ---

// A simple 1-pole low-pass filter class to manage state correctly for damping.
class OnePoleLPF {
    constructor() {
        this.lastOutput = 0;
        this.alpha = 0;
    }
    setCutoff(sampleRate, cutoff) {
        const wc = 2 * Math.PI * cutoff / sampleRate;
        this.alpha = Math.cos(wc); // Simplified coefficient calculation
    }
    process(input) {
        if (!isFinite(input)) input = 0;
        this.lastOutput = input * (1 - this.alpha) + this.lastOutput * this.alpha;
        if (!isFinite(this.lastOutput)) this.lastOutput = 0;
        return this.lastOutput;
    }
}

class FDNReverb {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        
        // Base delay times in samples (primes scaled to sample rate)
        this.baseDelaySamples = [1423, 1777, 2053, 2251].map(s => Math.floor(s * sampleRate / 44100));

        // Allocate buffers with extra space for modulation
        this.buffers = this.baseDelaySamples.map(len => new Float32Array(len * 2));
        this.writeIndices = [0, 0, 0, 0];
        
        this.filters = [new OnePoleLPF(), new OnePoleLPF(), new OnePoleLPF(), new OnePoleLPF()];

        // Orthogonal Householder matrix for diffusion
        this.matrix = [
            [-0.5, 0.5, 0.5, 0.5], [0.5, -0.5, 0.5, 0.5],
            [0.5, 0.5, -0.5, 0.5], [0.5, 0.5, 0.5, -0.5]
        ];
        
        // Modulation LFOs (one for each delay line, out of phase)
        this.lfoPhases = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        this.lfoRate = 0.3; // Hz
        this.lfoDepthSamples = 8;

        // Pre-delay buffer
        this.preDelayBuffer = new Float32Array(Math.floor(sampleRate * 0.5)); // Max 0.5s pre-delay
        this.preDelayWriteIndex = 0;

        // DC Blocker state
        this.dcBlockX1 = 0;
        this.dcBlockY1 = 0;

        // Cache last param values to avoid recalculation
        this.lastDecay = -1;
        this.lastDamping = -1;
        this.feedbackGains = [0, 0, 0, 0];
    }

    process(inputL, inputR, mix, decay, size, damping, inputGain, preDelay, width) {
        // K-Rate: Update internal parameters only when UI controls change
        if (this.lastDecay !== decay) {
            const rt60 = 0.05 + decay * 9.95; // Map 0-1 to 50ms - 10s
            this.feedbackGains = this.baseDelaySamples.map(len => Math.pow(0.001, len / (rt60 * this.sampleRate)));
            this.lastDecay = decay;
        }
        if (this.lastDamping !== damping) {
            const cutoff = 20000 * Math.pow(0.025, damping); // Map 0-1 -> 20k-500Hz log scale
            this.filters.forEach(f => f.setCutoff(this.sampleRate, cutoff));
            this.lastDamping = damping;
        }

        const sizeFactor = 0.5 + size; // Map 0-1 -> 0.5x to 1.5x size
        const monoInput = (inputL + inputR) * 0.5;

        // --- DC Blocking Filter ---
        if (!isFinite(this.dcBlockY1)) {
            this.dcBlockY1 = 0; // Stability guard
        }
        const dcBlockedInput = monoInput - this.dcBlockX1 + 0.995 * this.dcBlockY1;
        this.dcBlockX1 = monoInput;
        this.dcBlockY1 = dcBlockedInput;

        // --- Pre-delay section ---
        this.preDelayBuffer[this.preDelayWriteIndex] = dcBlockedInput;
        const preDelaySamples = Math.max(0, Math.min(preDelay * this.sampleRate, this.preDelayBuffer.length - 1));
        let preDelayReadIndex = this.preDelayWriteIndex - preDelaySamples;
        if (preDelayReadIndex < 0) {
            preDelayReadIndex += this.preDelayBuffer.length;
        }
        const delayedInput = this.preDelayBuffer[Math.floor(preDelayReadIndex)];
        this.preDelayWriteIndex = (this.preDelayWriteIndex + 1) % this.preDelayBuffer.length;

        // 1. Read from delay lines with modulation
        const lfoIncrement = 2 * Math.PI * this.lfoRate / this.sampleRate;
        const delayOutputs = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            this.lfoPhases[i] = (this.lfoPhases[i] + lfoIncrement) % (2 * Math.PI);
            const mod = Math.sin(this.lfoPhases[i]) * this.lfoDepthSamples;
            
            const delayInSamples = this.baseDelaySamples[i] * sizeFactor;
            
            const readPos = this.writeIndices[i] - delayInSamples + mod;
            const readIdx = Math.floor(readPos);
            const frac = readPos - readIdx;

            const len = this.buffers[i].length;
            const idx1 = ((readIdx % len) + len) % len;
            const idx2 = (((readIdx + 1) % len) + len) % len;

            const s1 = this.buffers[i][idx1];
            const s2 = this.buffers[i][idx2];
            
            delayOutputs[i] = s1 + (s2 - s1) * frac; // Linear interpolation for smooth modulation
        }

        // 2. Apply diffusion matrix
        const diffused = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                diffused[i] += this.matrix[i][j] * delayOutputs[j];
            }
        }
        
        // 3. Apply feedback, damping, and write back
        for (let i = 0; i < 4; i++) {
            const feedbackSample = diffused[i] * this.feedbackGains[i];
            const filteredSample = this.filters[i].process(feedbackSample);
            this.buffers[i][this.writeIndices[i]] = (delayedInput * inputGain * 0.5) + filteredSample;
            this.writeIndices[i] = (this.writeIndices[i] + 1) % this.buffers[i].length;
        }

        // 4. Create stereo output and apply width
        let wetL = (diffused[0] + diffused[2]) * 0.4;
        let wetR = (diffused[1] + diffused[3]) * 0.4;

        const mid = (wetL + wetR) * 0.5;
        const side = (wetL - wetR) * 0.5;
        const newSide = side * width;
        wetL = mid + newSide;
        wetR = mid - newSide;
        
        return [(inputL * (1 - mix)) + (wetL * mix), (inputR * (1 - mix)) + (wetR * mix)];
    }
}