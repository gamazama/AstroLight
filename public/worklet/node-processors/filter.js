

function processFilterAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    if (!processor.filters[nodeId]) {
        processor.filters[nodeId] = { l: new BiquadFilter(), r: new BiquadFilter(), l2: new BiquadFilter(), r2: new BiquadFilter() };
    }

    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    let inL = inputSignal ? inputSignal[0] : 0;
    let inR = inputSignal ? inputSignal[1] : 0;
    
    // Input Guard
    if (!isFinite(inL)) inL = 0;
    if (!isFinite(inR)) inR = 0;

    // Default Drive to 1.0 if missing to prevent silence
    const drive = getARateVal(nodeId, 'drive', 1.0);
    
    const lfoRate = getARateVal(nodeId, 'lfoRate', 1.0);
    const lfoKey = `lfo_${nodeId}`;
    processor.phase[lfoKey] = (processor.phase[lfoKey] || 0) + lfoRate / sampleRate;
    const lfoPhase = processor.phase[lfoKey] % 1.0;
    
    let lfoValue = 0;
    const lfoAmount = getARateVal(nodeId, 'lfoAmount', 0);
    if (lfoAmount > 0) {
         switch (node.params.lfoShape) {
            case 'sine': lfoValue = Math.sin(lfoPhase * 2 * Math.PI); break;
            case 'triangle': lfoValue = 2 * Math.abs(2 * (lfoPhase - 0.5)) - 1; break;
            case 'sawtooth': lfoValue = 2 * lfoPhase - 1; break;
            case 'square': lfoValue = lfoPhase < 0.5 ? 1 : -1; break;
            case 'random': 
                if (lfoPhase < lfoRate / sampleRate) processor.lfoLastValues[nodeId] = Math.random() * 2 - 1;
                lfoValue = processor.lfoLastValues[nodeId] || 0;
                break;
        }
    }

    // Default Cutoff to 200Hz, Q to 1.0
    const cutoff = getARateVal(nodeId, 'cutoff', 200);
    const effectiveCutoff = cutoff * Math.pow(2, lfoValue * lfoAmount * 7);
    const safeCutoff = Math.max(20, Math.min(effectiveCutoff, sampleRate / 2 - 1));
    const safeQ = Math.max(0.1, getARateVal(nodeId, 'q', 1.0));
    const gain = getARateVal(nodeId, 'gain', 0);

    const f = processor.filters[nodeId];
    f.l.setParams(node.params.type, safeCutoff, safeQ, sampleRate, gain);
    f.r.setParams(node.params.type, safeCutoff, safeQ, sampleRate, gain);
    if (node.params.slope === '24db') {
        f.l2.setParams(node.params.type, safeCutoff, safeQ, sampleRate, gain);
        f.r2.setParams(node.params.type, safeCutoff, safeQ, sampleRate, gain);
    }
    
    let outL = f.l.process(Math.tanh(inL * drive));
    let outR = f.r.process(Math.tanh(inR * drive));

    if (node.params.slope === '24db') {
        outL = f.l2.process(outL);
        outR = f.r2.process(outR);
    }
    
    // Output Guard
    nodeOut[0] = isFinite(outL) ? outL : 0;
    nodeOut[1] = isFinite(outR) ? outR : 0;
    
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { cutoff: safeCutoff, q: safeQ, gain, drive, lfoAmount, lfoRate };
    }
}
