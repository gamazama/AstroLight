

function processPanAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    const inSample = inputSignal ? (inputSignal[0] + inputSignal[1]) * 0.5 : 0;
    const pan = getARateVal(nodeId, 'pan');

    const panAngle = (pan * 0.5 + 0.5) * Math.PI * 0.5;
    nodeOut[0] = inSample * Math.cos(panAngle);
    nodeOut[1] = inSample * Math.sin(panAngle);
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);
    
    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { pan };
    }
}
