

// A class to manage the state of a single oscillator voice.
// Used for the main oscillator and its supersaw voices.
class CrossOscillatorVoice {
    constructor(sawWaveTable) {
        this.phase = Math.random();
        this.slavePhase = 0;
        this.fmPhase = 0;
        this.subPhase = 0;
        this.sawWaveTable = sawWaveTable;
    }

    process(params) {
        const {
            freq, detune, waveform, pw,
            sync, fm, sub,
            sampleRate
        } = params;

        const centsToRatio = 1.0594635; // 2^(1/12)
        // Clamp final frequency to avoid stall
        const finalFreq = Math.max(5, freq * Math.pow(centsToRatio, detune / 100));
        
        // --- FM Phase Calculation (for Phase Modulation) ---
        let fmPhaseOffset = 0;
        if (fm.enabled) {
            const fmPhaseInc = (finalFreq * fm.ratio) / sampleRate;
            this.fmPhase = (this.fmPhase + fmPhaseInc) % 1.0;
            
            let modulatorSample = 0;
            switch(fm.waveform) {
                case 'sine':
                    modulatorSample = Math.sin(this.fmPhase * 2 * Math.PI);
                    break;
                case 'square':
                    modulatorSample = this.fmPhase < 0.5 ? 1 : -1;
                    break;
                case 'sawtooth':
                    modulatorSample = 2 * this.fmPhase - 1;
                    break;
                case 'triangle':
                    modulatorSample = 2 * Math.abs(2 * (this.fmPhase - 0.5)) - 1;
                    break;
                default: // Fallback to sine
                    modulatorSample = Math.sin(this.fmPhase * 2 * Math.PI);
                    break;
            }

            const modulationIndex = fm.amount / 50.0;
            fmPhaseOffset = modulatorSample * modulationIndex;
        }


        // --- Main Phase Calculation (standard oscillator) ---
        const phaseInc = finalFreq / sampleRate;
        
        let wrapped = false;
        const newPhase = this.phase + phaseInc;
        if (newPhase >= 1.0) {
            wrapped = true;
        }
        this.phase = newPhase % 1.0;


        // --- Hard Sync ---
        if (sync.enabled) {
            const slaveFreq = finalFreq * sync.ratio;
            const slavePhaseInc = slaveFreq / sampleRate;
            this.slavePhase += slavePhaseInc;
            
            // If the main oscillator (master) wrapped around, reset the slave phase.
            if (wrapped) {
                this.slavePhase = 0;
            }
            this.slavePhase %= 1.0;
        }

        // --- Waveform Generation ---
        let mainSample = 0;
        // The oscillator whose phase is used for output (carrier)
        let phaseToUse = sync.enabled ? this.slavePhase : this.phase;

        // Apply phase modulation by adding the offset to the carrier's phase.
        // The offset is in radians, so divide by 2*PI to map it to the 0-1 phase range.
        if (fm.enabled) {
            phaseToUse += fmPhaseOffset / (2 * Math.PI);
        }

        switch (waveform) {
            case 'sawtooth':
                // Wavetable lookup for band-limited sawtooth
                const tableIndex = phaseToUse * (this.sawWaveTable.length - 1);
                const index = Math.floor(tableIndex);
                const frac = tableIndex - index;
                const s1 = this.sawWaveTable[index];
                const s2 = this.sawWaveTable[(index + 1) % this.sawWaveTable.length];
                mainSample = s1 + (s2 - s1) * frac; // Linear interpolation
                break;
            case 'square':
                mainSample = (phaseToUse % 1.0) < pw ? 1 : -1;
                break;
            case 'sine':
                mainSample = Math.sin(phaseToUse * 2 * Math.PI);
                break;
            case 'triangle':
                mainSample = 2 * Math.abs(2 * ((phaseToUse % 1.0) - 0.5)) - 1;
                break;
        }

        // --- Sub Oscillator ---
        let subSample = 0;
        if (sub.octave !== 'off') {
            const subMultiplier = sub.octave === '-1' ? 0.5 : 0.25;
            const subPhaseInc = (finalFreq * subMultiplier) / sampleRate;
            this.subPhase = (this.subPhase + subPhaseInc) % 1.0;
            subSample = Math.sin(this.subPhase * 2 * Math.PI) * sub.level;
        }
        
        return mainSample + subSample;
    }
}


function processCrossOscillatorAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    // Initialize state if it doesn't exist.
    if (!processor.crossOscillatorState) processor.crossOscillatorState = {};
    if (!processor.crossOscillatorState[nodeId]) {
        // We need an array of voices for supersaw.
        processor.crossOscillatorState[nodeId] = {
            voices: Array.from({ length: 16 }, () => new CrossOscillatorVoice(processor.sawWaveTable)),
        };
    }
    const state = processor.crossOscillatorState[nodeId];

    // --- Get A-Rate values for all modulatable parameters ---
    // Clamp base frequency to 5Hz to ensure engine stability (prevents DC output)
    // Added default 440 if missing
    const freq = Math.max(5, getARateVal(nodeId, 'frequency', 440));
    
    // Read dynamic parameters with defaults
    const detune = getARateVal(nodeId, 'detune', 0);
    const amp = getARateVal(nodeId, 'amplitude', 0.5);
    const pan = getARateVal(nodeId, 'pan', 0);
    const unisonSpread = getARateVal(nodeId, 'unisonSpread', 0.1);
    const syncRatio = getARateVal(nodeId, 'syncRatio', 2);
    const fmRatio = getARateVal(nodeId, 'fmRatio', 1);
    const fmAmount = getARateVal(nodeId, 'fmAmount', 0);
    const subLevel = getARateVal(nodeId, 'subLevel', 0);
    
    // Dynamically read unison voices with a safe default of 1. 
    // We allow A-Rate changes but they are snapped to integer K-rate style for loop bounds.
    const dynamicUnison = getARateVal(nodeId, 'unisonVoices', 1);
    const numVoices = Math.max(1, Math.min(16, Math.floor(dynamicUnison)));

    // --- Get K-Rate (static) values ---
    const { waveform, syncEnabled, fmEnabled, subOctave, fmWaveform } = node.params;
    
    // --- Supersaw Logic ---
    let totalSample = 0;

    for (let i = 0; i < numVoices; i++) {
        const voice = state.voices[i];
        
        let voiceDetune = detune;
        if (numVoices > 1) {
            // Spread voices from -spread/2 to +spread/2 in cents.
            const detuneOffset = (i / (numVoices - 1) - 0.5) * unisonSpread * 100;
            voiceDetune += detuneOffset;
        }
        
        const voiceParams = {
            freq,
            detune: voiceDetune,
            waveform,
            pw: 0.5, // Not a param on this node, default to 0.5 for square
            sync: { enabled: syncEnabled, ratio: syncRatio },
            fm: { enabled: fmEnabled, ratio: fmRatio, amount: fmAmount, waveform: fmWaveform },
            sub: { octave: subOctave, level: subLevel },
            sampleRate,
        };
        
        totalSample += voice.process(voiceParams);
    }
    
    // Normalize supersaw output
    const finalSample = totalSample / Math.sqrt(numVoices) * amp;

    // --- Panning ---
    const panAngle = (pan * 0.5 + 0.5) * Math.PI * 0.5;
    nodeOut[0] = finalSample * Math.cos(panAngle);
    nodeOut[1] = finalSample * Math.sin(panAngle);
    
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { frequency: freq, detune, amplitude: amp, pan, unisonVoices: numVoices };
    }
}
