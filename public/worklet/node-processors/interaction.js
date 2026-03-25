
function _calculateInteraction(simState, node) {
    const values = {};
    
    // --- Mouse ---
    // simState contains properties as sent from useSoundEngine.ts: 'mousePosition' and 'canvasDimensions'
    const mouse = simState.mousePosition;
    const dims = simState.canvasDimensions;

    if (mouse && dims) {
        // Normalize to -1 to 1 (Center is 0,0)
        // X: 0 (Left) -> -1, Width (Right) -> 1
        values.mouseX = (mouse.x / dims.width) * 2 - 1;
        // Y: 0 (Top) -> 1, Height (Bottom) -> -1 (Audio Standard: Up is Positive)
        values.mouseY = -((mouse.y / dims.height) * 2 - 1);
        
        // Raw pixels
        values.mouseXRaw = mouse.x;
        values.mouseYRaw = mouse.y;
    } else {
        values.mouseX = 0;
        values.mouseY = 0;
        values.mouseXRaw = 0;
        values.mouseYRaw = 0;
    }

    // --- Camera ---
    if (simState.camera) {
        values.tilt = simState.camera.tilt; // Degrees
        values.rotation = simState.camera.rotation; // Degrees
        values.zoom = simState.camera.zoom; // Raw zoom level
        values.zoomLog = Math.log10(Math.max(0.01, simState.camera.zoom)); // Logarithmic for pitch/filter mapping
    } else {
        values.tilt = 0;
        values.rotation = 0;
        values.zoom = 1;
        values.zoomLog = 0;
    }

    // --- Simulation ---
    values.timeSpeed = simState.timeSpeed || 0;
    values.isPlaying = simState.isPlaying ? 1 : 0;
    values.time = simState.time || 0;

    return values;
}

function processInteractionKR(processor, node, nodeId) {
    const simState = processor.simState;
    if (!simState) return;

    const values = _calculateInteraction(simState, node);
    
    if (!processor.currentControlValues[nodeId]) processor.currentControlValues[nodeId] = {};
    
    // Map calculated values to the active outputs defined in params
    const activeOutputs = node.params.activeOutputs || [];
    
    for (const outputName of activeOutputs) {
        processor.currentControlValues[nodeId][outputName] = values[outputName] || 0;
    }
}
