
function processParameterKR(processor, node, nodeId) {
    processor.currentControlValues[nodeId].out = node.params.value;
}

function processControlNodeAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    // This generic function handles any node whose outputs are pure control signals
    // determined at K-rate and just need interpolation at A-rate.
    // This applies to DataSource, Math, and Parameter nodes.
    const lastCV = processor.lastControlValues[nodeId] || {};
    const currentCV = processor.currentControlValues[nodeId] || {};

    // We must interpolate all potential outputs for this node.
    for (const key in currentCV) {
        const lastVal = lastCV[key] ?? 0;
        const currentVal = currentCV[key] ?? 0;
        const val = lastVal + (currentVal - lastVal) * alpha;

        if (key === 'out' || key === 'relativeDistance' || key === 'realtimeDistance') {
            // These are common primary outputs, so write them to the audio buffer.
            nodeOut[0] = val;
            nodeOut[1] = val;
        }
    }
    
    if (shouldUpdateUI) {
        const uiValues = {};
        for (const key in currentCV) {
            // The value at the end of the block is simply currentVal
            uiValues[key] = currentCV[key];
        }
        shouldUpdateUI[nodeId] = uiValues;
    }
}
