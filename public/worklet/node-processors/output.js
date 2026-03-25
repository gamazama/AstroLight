
function processOutputAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    let masterL = 0, masterR = 0;

    const connectionsToThisInput = processor.multiInputConnectionMap.get(`${nodeId}-in`) || [];
    for (const conn of connectionsToThisInput) {
        const inputSignal = perSampleNodeOutputs.get(conn.fromNodeId);
        if (inputSignal) {
            masterL += inputSignal[0];
            masterR += inputSignal[1];
        }
    }
    nodeOut[0] = masterL;
    nodeOut[1] = masterR;
}
