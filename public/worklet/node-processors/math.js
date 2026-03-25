

function processMathKR(processor, node, nodeId) {
    // Calculate control values for downstream K-Rate consumers
    const val1 = _getControlValue(processor, nodeId, 'val1');
    const val2 = _getControlValue(processor, nodeId, 'val2');
    const factor = _getControlValue(processor, nodeId, 'factor');
    const offset = _getControlValue(processor, nodeId, 'offset');

    let result = 0;
    switch(node.params.operation) {
        case 'add': result = val1 + val2; break;
        case 'subtract': result = val1 - val2; break;
        case 'multiply': result = val1 * val2; break;
        case 'divide': 
            // Safety check for division by zero
            result = (Math.abs(val2) > 0.000001) ? val1 / val2 : 0; 
            break;
        case 'scale': result = (val1 * factor) + offset; break;
        case 'abs': result = Math.abs(val1); break;
        case 'min': result = Math.min(val1, val2); break;
        case 'max': result = Math.max(val1, val2); break;
        case 'pow': result = Math.pow(val1, val2); break;
        default: result = 0;
    }
    
    if (!processor.currentControlValues[nodeId]) processor.currentControlValues[nodeId] = {};
    
    // Store the result so downstream nodes (like Octaver) can read it
    processor.currentControlValues[nodeId].out = result;
}

function processMathAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, nodeOut) {
    // Get all input values at audio rate for the current sample
    const val1 = getARateVal(nodeId, 'val1');
    const val2 = getARateVal(nodeId, 'val2');
    const factor = getARateVal(nodeId, 'factor');
    const offset = getARateVal(nodeId, 'offset');

    let result = 0;
    switch(node.params.operation) {
        case 'add': result = val1 + val2; break;
        case 'subtract': result = val1 - val2; break;
        case 'multiply': result = val1 * val2; break;
        case 'divide': 
             // Safety check for division by zero
             result = (Math.abs(val2) > 0.000001) ? val1 / val2 : 0; 
             break;
        case 'scale': result = (val1 * factor) + offset; break;
        case 'abs': result = Math.abs(val1); break;
        case 'min': result = Math.min(val1, val2); break;
        case 'max': result = Math.max(val1, val2); break;
        case 'pow': result = Math.pow(val1, val2); break;
        default: result = 0;
    }
    
    // Math nodes output a control signal, which is mono
    nodeOut[0] = result;
    nodeOut[1] = result;

    // On the last sample of the block, report the final values back to the UI
    if (shouldUpdateUI) {
        shouldUpdateUI[nodeId] = { out: result, val1: val1, val2: val2, factor: factor, offset: offset };
    }
}