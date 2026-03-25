
const OSC_DISPLAY_SIZE = 512;
const OSC_BUFFER_SIZE = OSC_DISPLAY_SIZE * 2; // Double size for pre-triggering
const AUTO_TRIGGER_TIMEOUT_SAMPLES = 4800; // 100ms at 48kHz

function processOscilloscopeAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    if (!processor.oscilloscopeState[nodeId]) {
        processor.oscilloscopeState[nodeId] = {
            buffer: new Float32Array(OSC_BUFFER_SIZE),
            displayBuffer: new Float32Array(OSC_DISPLAY_SIZE),
            writeIndex: 0,
            displayBufferReady: false,
            triggered: false,
            samplesSinceTrigger: 0,
            samplesSinceLastGoodTrigger: 0,
            lastSample: 0,
            samplesSinceSignal: 0,
            // --- NEW: For Auto-Trigger ---
            peak: 0,
            trough: 0,
            dcOffset: 0,
        };
    }
    const state = processor.oscilloscopeState[nodeId];
    
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    const inL = inputSignal ? inputSignal[0] : 0;
    const inR = inputSignal ? inputSignal[1] : 0;
    const monoInput = (inL + inR) * 0.5;

    // --- Signal Analysis for Auto-Trigger (EMA) ---
    const emaFactor = 0.001;
    state.peak = (1 - emaFactor) * state.peak + emaFactor * Math.max(state.peak, monoInput);
    state.trough = (1 - emaFactor) * state.trough + emaFactor * Math.min(state.trough, monoInput);
    state.dcOffset = (1 - emaFactor) * state.dcOffset + emaFactor * monoInput;

    // Decay peak/trough towards DC offset if signal is quiet
    if (Math.abs(monoInput) < 0.01) {
        state.peak = (1 - emaFactor) * state.peak + emaFactor * state.dcOffset;
        state.trough = (1 - emaFactor) * state.trough + emaFactor * state.dcOffset;
    }


    // --- Silence Detection ---
    if (Math.abs(monoInput) < 0.001) {
        state.samplesSinceSignal++;
    } else {
        state.samplesSinceSignal = 0;
    }

    if (state.samplesSinceSignal > AUTO_TRIGGER_TIMEOUT_SAMPLES) {
        state.buffer.fill(0);
        state.displayBuffer.fill(0);
        state.displayBufferReady = true;
        state.samplesSinceSignal = 0; // Reset to avoid continuous updates
    }

    // --- Buffer filling (Circular Buffer) ---
    state.buffer[state.writeIndex] = monoInput;
    state.writeIndex = (state.writeIndex + 1) % OSC_BUFFER_SIZE;

    // Determine trigger level: either Auto or Manual
    let triggerLevel = getARateVal(nodeId, 'trigger', node.params.trigger);
    if (node.params.autoTrigger) {
        const amplitude = state.peak - state.trough;
        if (amplitude > 0.01) { // Only use auto if there's a significant signal
             triggerLevel = state.dcOffset;
        }
    }
    const slopeIsRising = node.params.triggerSlope === 'rising';

    let triggerFound = false;

    // --- Trigger Logic ---
    if (!state.triggered) {
        state.samplesSinceLastGoodTrigger++;
        if (slopeIsRising) {
            if (state.lastSample < triggerLevel && monoInput >= triggerLevel) {
                triggerFound = true;
            }
        } else { // Falling
            if (state.lastSample > triggerLevel && monoInput <= triggerLevel) {
                triggerFound = true;
            }
        }
    }
    
    // --- Auto-Trigger Timeout Logic ---
    if (!triggerFound && !state.triggered && state.samplesSinceLastGoodTrigger > AUTO_TRIGGER_TIMEOUT_SAMPLES) {
        triggerFound = true; // Force trigger
    }

    if (triggerFound) {
        state.triggered = true;
        state.samplesSinceTrigger = 0;
        state.samplesSinceLastGoodTrigger = 0;
    }
    
    // --- Post-Trigger Capture ---
    // The capture logic now waits for half the display size to capture pre-trigger data
    if (state.triggered) {
        state.samplesSinceTrigger++;
        if (state.samplesSinceTrigger >= OSC_DISPLAY_SIZE / 2) {
            let readIndex = state.writeIndex - OSC_DISPLAY_SIZE;
            for (let i = 0; i < OSC_DISPLAY_SIZE; i++) {
                const circularIndex = (readIndex + i + OSC_BUFFER_SIZE) % OSC_BUFFER_SIZE;
                state.displayBuffer[i] = state.buffer[circularIndex];
            }
            
            state.displayBufferReady = true;
            state.triggered = false;
        }
    }
    
    state.lastSample = monoInput;

    // --- Output silence ---
    nodeOut[0] = 0;
    nodeOut[1] = 0;
}
