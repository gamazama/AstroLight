
function processMixerAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    let mixL = 0, mixR = 0;

    for(let j = 1; j <= 4; j++) {
        const inputName = `in${j}`;
        const connectionsToThisInput = processor.multiInputConnectionMap.get(`${nodeId}-${inputName}`) || [];
        for(const conn of connectionsToThisInput) {
            const inputSignal = perSampleNodeOutputs.get(conn.fromNodeId);
            if (inputSignal) {
                mixL += inputSignal[0];
                mixR += inputSignal[1];
            }
        }
    }

    // --- DC Blocking Filter ---
    if (!processor.mixerState[nodeId]) {
        processor.mixerState[nodeId] = { x1L: 0, y1L: 0, x1R: 0, y1R: 0 };
    }
    const state = processor.mixerState[nodeId];

    // Stability guard
    if (!isFinite(state.y1L)) state.y1L = 0;
    if (!isFinite(state.y1R)) state.y1R = 0;

    const filteredL = mixL - state.x1L + 0.995 * state.y1L;
    state.x1L = mixL;
    state.y1L = filteredL;

    const filteredR = mixR - state.x1R + 0.995 * state.y1R;
    state.x1R = mixR;
    state.y1R = filteredR;

    nodeOut[0] = filteredL;
    nodeOut[1] = filteredR;
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);
}
