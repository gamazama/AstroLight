

function processLfoKR(processor, node, nodeId) {
    const cv = processor.currentControlValues[nodeId];
    cv.frequency = _getControlValue(processor, nodeId, 'frequency');
    cv.amplitude = _getControlValue(processor, nodeId, 'amplitude');
    cv.pulseWidth = _getControlValue(processor, nodeId, 'pulseWidth');
}

function processLfoAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const freq = getARateVal(nodeId, 'frequency');
    const amp = getARateVal(nodeId, 'amplitude');
    const pw = getARateVal(nodeId, 'pulseWidth');
    
    processor.phase[nodeId] = (processor.phase[nodeId] || 0) + freq / sampleRate;
    const phase = processor.phase[nodeId] % 1.0;
    
    let lfoOut = 0;
    switch (node.params.waveform) {
        case 'sine': lfoOut = Math.sin(phase * 2 * Math.PI); break;
        case 'square': lfoOut = phase < Math.max(0.01, Math.min(0.99, pw)) ? 1 : -1; break;
        case 'sawtooth': lfoOut = 2 * phase - 1; break;
        case 'triangle': lfoOut = 2 * Math.abs(2 * (phase - 0.5)) - 1; break;
        case 'noise': 
            if (phase < (freq / sampleRate)) { // Only generate new value once per cycle
                processor.lfoLastValues[nodeId] = Math.random() * 2 - 1;
            }
            lfoOut = processor.lfoLastValues[nodeId] || 0;
            break;
    }

    const finalVal = lfoOut * amp;
    nodeOut[0] = finalVal;
    nodeOut[1] = finalVal;

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { out: finalVal, frequency: freq, amplitude: amp, pulseWidth: pw };
    }
}
