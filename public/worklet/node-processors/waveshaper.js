

function processWaveshaperAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    const inL = inputSignal ? inputSignal[0] : 0;
    const inR = inputSignal ? inputSignal[1] : 0;

    const drive = getARateVal(nodeId, 'drive');
    const mix = getARateVal(nodeId, 'mix');
    const tone = getARateVal(nodeId, 'tone');
    const outputLevel = getARateVal(nodeId, 'outputLevel');
    
    // Initialize state if it doesn't exist
    if (!processor.waveshaperState[nodeId]) {
        processor.waveshaperState[nodeId] = { z1L: 0, z1R: 0 };
    }
    const state = processor.waveshaperState[nodeId];

    const processSample = (sample) => {
        let drivenSample = sample * drive;
        let shapedSample = 0;

        switch (node.params.type) {
            case 'tanh':
                shapedSample = Math.tanh(drivenSample);
                break;
            case 'atan':
                // atan gives a range of -PI/2 to PI/2, so we normalize it to -1 to 1.
                shapedSample = Math.atan(drivenSample) * (2 / Math.PI);
                break;
            case 'wavefolder':
                shapedSample = drivenSample;
                // Simple wavefolder logic
                while (Math.abs(shapedSample) > 1) {
                    if (shapedSample > 1) {
                        shapedSample = 2 - shapedSample;
                    } else {
                        shapedSample = -2 - shapedSample;
                    }
                }
                break;
            case 'hard clip':
                shapedSample = Math.max(-1, Math.min(1, drivenSample));
                break;
            default:
                shapedSample = drivenSample;
        }
        return shapedSample;
    };

    const wetL = processSample(inL);
    const wetR = processSample(inR);

    let mixedL = (inL * (1 - mix)) + (wetL * mix);
    let mixedR = (inR * (1 - mix)) + (wetR * mix);

    // Tone control (one-pole LPF)
    const cutoff = Math.max(1, Math.min(tone, sampleRate / 2));
    const b1 = Math.exp(-2.0 * Math.PI * cutoff / sampleRate);
    const a0 = 1.0 - b1;
    
    // Stability guard for filter state
    if (!isFinite(state.z1L)) state.z1L = 0;
    if (!isFinite(state.z1R)) state.z1R = 0;

    const filteredL = mixedL * a0 + state.z1L * b1;
    const filteredR = mixedR * a0 + state.z1R * b1;

    state.z1L = filteredL;
    state.z1R = filteredR;

    const outL = filteredL * outputLevel;
    const outR = filteredR * outputLevel;

    nodeOut[0] = outL;
    nodeOut[1] = outR;
    _checkClipping(processor, nodeId, 'out', outL, outR);

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { drive, mix, tone, outputLevel };
    }
}
