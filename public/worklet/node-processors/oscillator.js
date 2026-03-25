

function processOscillatorAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const freq = Math.max(5, getARateVal(nodeId, 'frequency')); // Clamp to min 5Hz to avoid DC lockup
    const amp = getARateVal(nodeId, 'amplitude');
    const pw = getARateVal(nodeId, 'pulseWidth');
    const pan = getARateVal(nodeId, 'pan');

    processor.phase[nodeId] = (processor.phase[nodeId] || 0) + freq / sampleRate;
    const phase = processor.phase[nodeId] % 1.0;

    let sample = 0;
    switch (node.params.waveform) {
        case 'sine': sample = Math.sin(phase * 2 * Math.PI); break;
        case 'square': sample = phase < pw ? 1 : -1; break;
        case 'sawtooth': sample = 2 * phase - 1; break;
        case 'triangle': sample = 2 * Math.abs(2 * (phase - 0.5)) - 1; break;
        case 'noise': sample = Math.random() * 2 - 1; break;
    }
    sample *= amp;

    const panAngle = (pan * 0.5 + 0.5) * Math.PI * 0.5;
    nodeOut[0] = sample * Math.cos(panAngle);
    nodeOut[1] = sample * Math.sin(panAngle);
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { frequency: freq, amplitude: amp, pulseWidth: pw, pan: pan };
    }
}