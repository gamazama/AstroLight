

function processGainAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    const inL = inputSignal ? inputSignal[0] : 0;
    const inR = inputSignal ? inputSignal[1] : 0;
    const gain = getARateVal(nodeId, 'gain');

    nodeOut[0] = inL * gain;
    nodeOut[1] = inR * gain;
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { gain };
    }
}
