
// =================================================================================================
// PROCESSOR REGISTRIES
// =================================================================================================

const NODE_PROCESSORS_KR = {
    'DataSource': processDataSourceKR,
    'Interaction': processInteractionKR,
    'Static Source': processStaticSourceKR,
    'Parameter': processParameterKR,
    'LFO': processLfoKR,
    'Cosmic Octaver': processCosmicOctaverKR,
    'Audio Rerouter': processRerouterKR,
    'Value Rerouter': processRerouterKR,
    'Math': processMathKR,
};

const NODE_PROCESSORS_AR = {
    'DataSource': processControlNodeAR,
    'Interaction': processControlNodeAR,
    'Parameter': processControlNodeAR,
    'Cosmic Octaver': processControlNodeAR,
    'Math': processMathAR,
    'LFO': processLfoAR,
    'Curve': processCurveAR,
    'Static Source': processStaticSourceAR,
    'Oscillator': processOscillatorAR,
    'Cross-Oscillator': processCrossOscillatorAR,
    'Gain': processGainAR,
    'Pan': processPanAR,
    'Mixer': processMixerAR,
    'Filter': processFilterAR,
    'Delay': processDelayAR,
    'Reverb': processReverbAR,
    'Waveshaper': processWaveshaperAR,
    'Oscilloscope': processOscilloscopeAR,
    'Output': processOutputAR,
    'Audio Rerouter': processRerouterAR,
    'Value Rerouter': processRerouterAR,
};

// =================================================================================================
// UTILITY FUNCTIONS
// =================================================================================================

function updateGraph(processor, newGraph) {
  if (JSON.stringify(processor.graph) === JSON.stringify(newGraph)) {
    return;
  }
  
  processor.graph = newGraph;
  const sortedNodeIds = topologicalSort(processor.graph);

  // Keep reference to old map to preserve state
  const oldNodeMap = processor.nodeMap;
  
  processor.nodeMap = new Map(); // Create new map
  processor.flatNodes = []; // Clear flat array
  
  // 1. Rebuild Node Map and Flat Array
  sortedNodeIds.forEach(id => {
      const node = processor.graph.nodes.find(n => n.id === id);
      if (node) {
          // Pre-cache processor functions
          node._processKR = NODE_PROCESSORS_KR[node.type];
          node._processAR = NODE_PROCESSORS_AR[node.type];
          
          // Initialize pre-resolved inputs map
          node._inputs = {}; 
          
          // --- STATE PRESERVATION FIX ---
          // Check if this node existed previously and preserve critical transient data
          const oldNode = oldNodeMap.get(id);
          if (oldNode && oldNode._liveData) {
              node._liveData = oldNode._liveData;
          }
          // ------------------------------
          
          // --- DYNAMIC RATE INFERENCE ---
          let isControl = false;
          const type = node.type;
          
          if (['DataSource', 'Interaction', 'Parameter', 'Cosmic Octaver', 'Value Rerouter'].includes(type)) {
              isControl = true;
          } else if (type === 'Static Source') {
               isControl = (node.params.mode === 'value');
          } else if (type === 'Math') {
               // Math is Control only if ALL connected inputs are also Control nodes.
               let allInputsAreControl = true;
               
               // Find all connections targeting this node
               const inputConns = processor.graph.connections.filter(c => c.toNodeId === id);
               
               for (const c of inputConns) {
                   const fromNode = processor.nodeMap.get(c.fromNodeId);
                   // Since we are iterating in topological order, upstream nodes are already processed
                   if (fromNode && !fromNode._isControl) {
                       allInputsAreControl = false;
                       break;
                   }
               }
               isControl = allInputsAreControl;
          }
          
          node._isControl = isControl;

          processor.nodeMap.set(id, node);
          processor.flatNodes.push(node);
      }
  });

  // 2. Rebuild Connection Maps (Legacy + New Pre-resolution)
  processor.connectionMap.clear();
  processor.multiInputConnectionMap.clear();
  
  processor.graph.connections.forEach(conn => {
    const toNode = processor.nodeMap.get(conn.toNodeId);
    const fromNode = processor.nodeMap.get(conn.fromNodeId);

    // Determine if source is a Control Node (K-Rate) or Audio Node (A-Rate)
    // We use the dynamically inferred property set in Step 1
    const sourceIsKRate = fromNode && fromNode._isControl;

    if (toNode) {
        // Pre-resolve the input on the destination node for O(1) access
        toNode._inputs[conn.toInput] = {
            fromNodeId: conn.fromNodeId,
            fromOutput: conn.fromOutput,
            isControl: sourceIsKRate
        };
    }

    const isMultiInput = (toNode && toNode.type === 'Output' && conn.toInput === 'in') || 
                       (toNode && toNode.type === 'Mixer');
    
    const key = `${conn.toNodeId}-${conn.toInput}`;
    if (isMultiInput) {
        if (!processor.multiInputConnectionMap.has(key)) {
            processor.multiInputConnectionMap.set(key, []);
        }
        processor.multiInputConnectionMap.get(key).push(conn);
    } else {
        processor.connectionMap.set(key, conn);
    }
  });

  // 3. Buffer Management (Pooling)
  // Remove buffers for deleted nodes
  for (const id of processor.nodeAudioBuffers.keys()) {
      if (!processor.nodeMap.has(id)) {
          processor.nodeAudioBuffers.delete(id);
      }
  }
  // Add buffers for new nodes
  processor.flatNodes.forEach(node => {
      if (!processor.nodeAudioBuffers.has(node.id)) {
          processor.nodeAudioBuffers.set(node.id, new Float32Array(2));
      }
  });

  // 4. Cleanup State
  const nodeIds = new Set(processor.flatNodes.map(n => n.id));
  const cleanup = (obj) => { 
    for (const id in obj) {
      if (!nodeIds.has(id)) {
        delete obj[id];
      }
    } 
  };
  
  cleanup(processor.phase);
  cleanup(processor.filters);
  cleanup(processor.delayBuffers);
  cleanup(processor.reverbs);
  cleanup(processor.lfoLastValues);
  cleanup(processor.clippingState);
  cleanup(processor.oscilloscopeState);
  cleanup(processor.mixerState);
  cleanup(processor.crossOscillatorState);
  cleanup(processor.waveshaperState);
  cleanup(processor.cosmicOctaverState);
}

function _getControlValue(processor, nodeId, inputName) {
    // Optimized K-Rate value getter
    // Try pre-resolved input first
    const node = processor.nodeMap.get(nodeId);
    if (node && node._inputs && node._inputs[inputName]) {
        const conn = node._inputs[inputName];
        const fromNodeOutput = processor.currentControlValues[conn.fromNodeId];
        return fromNodeOutput ? (fromNodeOutput[conn.fromOutput] ?? 0) : 0;
    }
    
    // Fallback (shouldn't happen if updateGraph works, but safe)
    const key = `${nodeId}-${inputName}`;
    const connection = processor.connectionMap.get(key);
    if (connection) {
        const fromNodeOutput = processor.currentControlValues[connection.fromNodeId];
        return fromNodeOutput ? (fromNodeOutput[connection.fromOutput] ?? 0) : 0;
    }
    
    return node?.params[inputName] ?? 0;
}

function _checkClipping(processor, nodeId, outputName, L, R) {
    if (Math.abs(L) > 0.99 || Math.abs(R) > 0.99) {
        processor.clippingState[`${nodeId}-${outputName}`] = 20; // hold for 20 blocks
    }
}

function processNodeKR(processor, node, nodeId) {
    if (node._processKR) {
        node._processKR(processor, node, nodeId);
    }
}

function processNodeAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, outputBuffer) {
    if (node._processAR) {
        node._processAR(processor, node, nodeId, alpha, getARateVal, perSampleNodeOutputs, shouldUpdateUI, outputBuffer);
    }
}
