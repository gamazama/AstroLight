

function processReverbAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    if (!processor.reverbs[nodeId]) {
        processor.reverbs[nodeId] = new FDNReverb(sampleRate);
    }
    
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    const inL = inputSignal ? inputSignal[0] : 0;
    const inR = inputSignal ? inputSignal[1] : 0;
    
    const mix = getARateVal(nodeId, 'mix');
    let decay = getARateVal(nodeId, 'decay');
    const size = getARateVal(nodeId, 'size');
    const damping = getARateVal(nodeId, 'damping');
    const inputGain = getARateVal(nodeId, 'inputGain');
    const preDelay = getARateVal(nodeId, 'preDelay');
    const width = getARateVal(nodeId, 'width');

    decay = Math.max(0, Math.min(0.999, decay));

    const [wetL, wetR] = processor.reverbs[nodeId].process(inL, inR, mix, decay, size, damping, inputGain, preDelay, width);
    nodeOut[0] = wetL;
    nodeOut[1] = wetR;
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);
    
    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { mix, decay, size, damping, inputGain, preDelay, width };
    }
}
