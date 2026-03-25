
function processCurveAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    const freq = getARateVal(nodeId, 'frequency', 1);
    const amp = getARateVal(nodeId, 'amplitude', 1);
    
    // Update phase
    processor.phase[nodeId] = (processor.phase[nodeId] || 0) + freq / sampleRate;
    const phase = processor.phase[nodeId] % 1.0;

    const points = node.params.points || [{x:0, y:0}, {x:1, y:0}];
    
    let value = 0;

    // Find segment
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        if (phase >= p1.x && phase <= p2.x) {
            const range = p2.x - p1.x;
            const t = range === 0 ? 0 : (phase - p1.x) / range;
            
            if (node.params.interpolation === 'step') {
                value = p1.y;
            } else if (node.params.interpolation === 'smooth') {
                // Cosine interpolation
                const ft = t * Math.PI;
                const f = (1 - Math.cos(ft)) * 0.5;
                value = p1.y * (1 - f) + p2.y * f;
            } else {
                // Linear
                value = p1.y + (p2.y - p1.y) * t;
            }
            break;
        }
    }
    
    const finalOutput = value * amp;
    
    nodeOut[0] = finalOutput;
    nodeOut[1] = finalOutput;

    if (shouldUpdateUI) {
        // Pass phase back to UI for playhead visualization
        shouldUpdateUI[nodeId] = { out: finalOutput, frequency: freq, phase: phase };
    }
}
