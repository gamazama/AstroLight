

function processStaticSourceKR(processor, node, nodeId) {
    if (node.params.mode === 'value') {
        processor.currentControlValues[nodeId].out = node.params.value;
    }
}

function processStaticSourceAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const params = node.params;

    if (params.mode === 'value') {
        const val = getARateVal(nodeId, 'value');
        nodeOut[0] = val;
        nodeOut[1] = val;
        if (shouldUpdateUI) {
            shouldUpdateUI[nodeId] = { out: val, value: val };
        }
    } else { // 'oscillator' mode
        const freq = getARateVal(nodeId, 'frequency');
        const amp = getARateVal(nodeId, 'amplitude');
        const pw = getARateVal(nodeId, 'pulseWidth');
        const pan = getARateVal(nodeId, 'pan');

        processor.phase[nodeId] = (processor.phase[nodeId] || 0) + freq / sampleRate;
        const phase = processor.phase[nodeId] % 1.0;
        let sample = 0;
        switch (params.waveform) {
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
            shouldUpdateUI[nodeId] = { out: nodeOut[0] + nodeOut[1], frequency: freq, amplitude: amp, pulseWidth: pw, pan: pan };
        }
    }
}
