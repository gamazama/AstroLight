

function processDelayAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const conn = processor.connectionMap.get(`${nodeId}-in`);
    const inputSignal = conn ? perSampleNodeOutputs.get(conn.fromNodeId) : null;
    const inL = inputSignal ? inputSignal[0] : 0;
    const inR = inputSignal ? inputSignal[1] : 0;
    const time = getARateVal(nodeId, 'time');
    let feedback = getARateVal(nodeId, 'feedback');
    const mix = getARateVal(nodeId, 'mix');
    
    feedback = Math.max(0, Math.min(0.999, feedback)); 

    const bufferSize = Math.max(1, Math.floor(time * sampleRate));
    if (!processor.delayBuffers[nodeId] || processor.delayBuffers[nodeId].l.length !== bufferSize) {
        processor.delayBuffers[nodeId] = { l: new Float32Array(bufferSize), r: new Float32Array(bufferSize), writePos: 0 };
    }
    const buffer = processor.delayBuffers[nodeId];
    
    const readPos = (buffer.writePos - buffer.l.length + 1) % buffer.l.length;
    const readIdx = readPos < 0 ? readPos + buffer.l.length : readPos;
    const delayedL = buffer.l[readIdx] || 0;
    const delayedR = buffer.r[readIdx] || 0;
    
    buffer.l[buffer.writePos] = inL + delayedL * feedback;
    buffer.r[buffer.writePos] = inR + delayedR * feedback;
    buffer.writePos = (buffer.writePos + 1) % buffer.l.length;
    
    nodeOut[0] = (inL * (1 - mix)) + (delayedL * mix);
    nodeOut[1] = (inR * (1 - mix)) + (delayedR * mix);
    _checkClipping(processor, nodeId, 'out', nodeOut[0], nodeOut[1]);

    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { time, feedback, mix };
    }
}
