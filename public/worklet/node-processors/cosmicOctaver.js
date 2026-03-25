

const SPEED_OF_LIGHT = 299792458; // m/s
const SPEED_OF_SOUND = 343; // m/s

function processCosmicOctaverKR(processor, node, nodeId) {
    const cv = processor.currentControlValues[nodeId];

    // Get params from other nodes or static values
    const inputValue = _getControlValue(processor, nodeId, 'value');
    const octaveShift = _getControlValue(processor, nodeId, 'octaveShift');
    const customVelocity = _getControlValue(processor, nodeId, 'customVelocity');

    // Get static params from the node definition
    const { inputType, distanceUnit, speedConstant } = node.params;

    let periodicFreq = 0;

    if (!isFinite(inputValue)) {
        periodicFreq = 0;
    } else if (inputType === 'days') {
        if (inputValue > 0) {
            const periodInSeconds = inputValue * 86400; // 24 * 60 * 60
            periodicFreq = 1 / periodInSeconds;
        }
    } else { // 'distance'
        let speed;
        if (speedConstant === 'light') speed = SPEED_OF_LIGHT;
        else if (speedConstant === 'sound') speed = SPEED_OF_SOUND;
        else speed = isFinite(customVelocity) ? customVelocity : 343; 

        let distanceInMeters = inputValue;
        
        if (distanceUnit === 'km') {
            distanceInMeters *= 1000;
        } else if (distanceUnit === 'Mkm') {
            distanceInMeters *= 1000000000;
        }
        
        if (distanceInMeters > 1e-6) { // Avoid division by zero
            periodicFreq = speed / distanceInMeters;
        }
    }

    let fundamentalFreq = 0;
    let octavesApplied = 0;
    const MIDDLE_C = 261.625565; // C4, the target base frequency.

    // Safety guard against Infinity or NaN which crash the audio engine
    if (isFinite(periodicFreq) && periodicFreq > 1e-24) {
        fundamentalFreq = periodicFreq;

        const targetMin = MIDDLE_C;
        const targetMax = MIDDLE_C * 2;

        // Calculate exactly how many octaves to shift
        // We limit this to +/- 256 octaves to prevent Math.pow() exploding to Infinity
        const rawOctaves = Math.log2(targetMin / fundamentalFreq);
        
        // Clamp octaves to safe range
        const safeOctaves = Math.max(-256, Math.min(256, rawOctaves));
        
        if (isFinite(safeOctaves)) {
            if (fundamentalFreq < targetMin) {
                octavesApplied = Math.ceil(safeOctaves);
                fundamentalFreq *= Math.pow(2, octavesApplied);
            } else if (fundamentalFreq >= targetMax) {
                // For downward shift, log2 is negative
                octavesApplied = Math.floor(safeOctaves);
                fundamentalFreq *= Math.pow(2, octavesApplied);
            }
        } else {
            // Fallback if calculation failed
            fundamentalFreq = 0;
            octavesApplied = 0;
        }
    }
    
    // Final Safety check
    if (!isFinite(fundamentalFreq)) {
        fundamentalFreq = 0;
        octavesApplied = 0;
    }

    let finalFrequency = fundamentalFreq * Math.pow(2, octaveShift);
    if (!isFinite(finalFrequency)) finalFrequency = 0;
    
    // Set the values for all output ports
    cv.out = finalFrequency;
    cv.frequency = cv.out;
    cv.octavesApplied = octavesApplied;
    cv.fundamental = fundamentalFreq;
    cv.inputValue = inputValue; // Send the raw input value back for UI display
    cv.value = inputValue; // UI expects 'value' for displaying the input
}