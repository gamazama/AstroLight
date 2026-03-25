
function processRerouterKR(processor, node, nodeId) {
    // Value rerouters need to pass K-Rate signals
    if (node.type === 'Value Rerouter') {
         const inputVal = _getControlValue(processor, nodeId, 'in');
         if (!processor.currentControlValues[nodeId]) processor.currentControlValues[nodeId] = {};
         processor.currentControlValues[nodeId].out = inputVal;
    }
}

function processRerouterAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    // Rerouter has a single 'in' port.
    // Note: Since updateGraph pre-resolves inputs now, we could use node._inputs['in'] here for speed,
    // but falling back to connectionMap is safe and consistent with other simple nodes.
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    
    // Pass through the audio signal.
    // For Value Rerouters, K-Rate processing handles the logic, but this A-Rate pass handles
    // visual output or if the rerouter is connected to an audio-rate input expecting a signal.
    const inL = inputSignal ? inputSignal[0] : 0;
    const inR = inputSignal ? inputSignal[1] : 0;

    nodeOut[0] = inL;
    nodeOut[1] = inR;
}
