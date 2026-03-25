
// =================================================================================================
// MAIN AUDIO WORKLET PROCESSOR
// =================================================================================================
class LineSoundProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.graph = null;
    
    // --- State & Performance Objects ---
    this.nodeMap = new Map();
    // connectionMap and multiInputConnectionMap are still used for logic, 
    // but NOT for hot-path parameter lookup anymore.
    this.connectionMap = new Map();
    this.multiInputConnectionMap = new Map();
    
    this.lastControlValues = {};
    this.currentControlValues = {};
    this.uiValues = {}; // NEW: Separate storage for UI-only data

    // --- THE BLACKBOARD ---
    // A persistent store for simulation data, decoupled from the graph nodes.
    this.simulationBlackboard = {
        bodies: new Map(), // Map<string, { x, y, z, vx, vy, vz, orbitRadius, period, realRadius }>
        connections: new Map(), // Map<string, { distance, relativeDistance, synodicPeriod, orbitalRatio }>
        camera: { tilt: 0, rotation: 0, zoom: 1 },
        mouse: { x: 0, y: 0 },
        canvas: { width: 1920, height: 1080 },
    };

    // --- OPTIMIZATION: Persistent Structures ---
    this.flatNodes = []; // Array of actual node objects in topological order
    this.nodeAudioBuffers = new Map(); // Map<nodeId, Float32Array(2)>
    this.sampleValuesForUI = {}; // Reused object for UI updates

    // --- Internal simulation time tracker ---
    this.simTime = 0; // The smooth, audio-rate interpolated time
    this.snapshotTime = 0; // The last exact time received from main thread (at 60Hz)
    this.lastReceivedRealTime = 0; 
    
    this.lastUiUpdateTime = 0;
    this.uiUpdateInterval = 1 / 10;
    this.masterVolume = 1.0; // Initialize to safe default

    // For stateful nodes
    this.phase = {}; 
    this.filters = {};
    this.delayBuffers = {};
    this.reverbs = {};
    this.lfoLastValues = {};
    this.clippingState = {};
    this.oscilloscopeState = {};
    this.mixerState = {};
    this.crossOscillatorState = {};
    this.waveshaperState = {};
    this.cosmicOctaverState = {};

    this.sawWaveTable = generateWaveTable();
    
    this.port.onmessage = (event) => {
        const { type, payload } = event.data;
        switch (type) {
            case 'GRAPH_STRUCTURE_CHANGED':
                updateGraph(this, payload.graph);
                break;
            case 'SIM_STATE_TICK':
                this.simState = Object.assign(this.simState || {}, payload);
                
                // Update snapshot timing
                this.snapshotTime = payload.time;
                this.lastReceivedRealTime = currentTime;

                // Sync logic: If we drift too far from the main thread (> 1 day), snap.
                // Otherwise, just store the snapshot and let process() interpolate.
                if (Math.abs(this.simTime - payload.time) > 1.0) {
                    this.simTime = payload.time;
                }
                
                // --- Update Blackboard from Tick ---
                this.updateBlackboard(payload);
                break;
            case 'UPDATE_MASTER_VOLUME':
                this.masterVolume = payload.volume;
                break;
            case 'UI_UPDATE_RATE_CHANGED':
                this.uiUpdateInterval = 1 / payload.rate;
                break;
        }
    };
  }

  updateBlackboard(payload) {
      // 1. Update Camera & Mouse
      if (payload.camera) this.simulationBlackboard.camera = payload.camera;
      if (payload.mousePosition) this.simulationBlackboard.mouse = payload.mousePosition;
      if (payload.canvasDimensions) this.simulationBlackboard.canvas = payload.canvasDimensions;

      // 2. Update Bodies & Connections
      if (payload.dataSources) {
          payload.dataSources.forEach(ds => {
              if (ds.body) this.simulationBlackboard.bodies.set(ds.body.name, { ...ds.body });
              if (ds.from) this.simulationBlackboard.bodies.set(ds.from.name, { ...ds.from });
              if (ds.to) this.simulationBlackboard.bodies.set(ds.to.name, { ...ds.to });
              
              if (ds.nodeId) {
                  const node = this.nodeMap.get(ds.nodeId);
                  if (node) {
                      node._liveData = ds; 
                  }
              }
          });
      }
  }

  getARateVal(node, paramName, defaultValue, alpha) {
      // 1. Check for Active Connection
      const connInfo = node._inputs[paramName];
      if (connInfo) {
          if (connInfo.isControl) {
              const sourceLastCV = this.lastControlValues[connInfo.fromNodeId] || {};
              const sourceCurrentCV = this.currentControlValues[connInfo.fromNodeId] || {};
              const last = sourceLastCV[connInfo.fromOutput] ?? 0;
              const current = sourceCurrentCV[connInfo.fromOutput] ?? 0;
              return last + (current - last) * alpha;
          } else {
              const sourceOutput = this.nodeAudioBuffers.get(connInfo.fromNodeId);
              return sourceOutput ? sourceOutput[0] : 0; 
          }
      }

      // 2. Check for Internal Modulation / K-Rate Processing
      const lastCV = this.lastControlValues[node.id] || {};
      const currentCV = this.currentControlValues[node.id] || {};
      
      let start = lastCV[paramName];
      let end = currentCV[paramName];

      // 3. Fallback to Static Node Parameters (UI Sliders)
      if (start === undefined) start = node.params[paramName];
      if (end === undefined) end = node.params[paramName];

      // 4. Strict Mode Check
      // Only fail if it's NOT in connections, NOT in internal CV, and NOT in static params.
      if (start === undefined && end === undefined) {
          if (defaultValue === undefined) {
               // Rate limit warnings to avoid console flooding
               if (Math.random() < 0.001) { 
                   console.warn(`[AstroSound] Parameter '${paramName}' missing for node ${node.id} (${node.type}). Check nodeTypes.ts definitions.`);
               }
               return 0;
          }
          return defaultValue;
      }
      
      // Handle booleans/enums by snapping to current
      if (typeof start === 'boolean' || typeof start === 'string') {
          return end;
      }
      
      // 5. Interpolate
      const sNum = start ?? 0;
      const eNum = end ?? 0;
      return sNum + (eNum - sNum) * alpha;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const leftChannel = output[0];
    const rightChannel = output[1];
    
    if (!this.graph || !this.simState || this.flatNodes.length === 0 || !leftChannel) return true;
    
    const blockSize = leftChannel.length;
    const invBlockSize = 1 / blockSize;

    // Smooth Time Advance
    if (this.simState.isPlaying && this.simState.timeSpeed > 0) {
        // Advance time by (Speed * Time per sample * Block size)
        // timeSpeed is in Days/Sec.
        // 60 in previous logic was arbitrary main-loop frame rate.
        // Here we calculate true delta time in Days.
        const dt = (this.simState.timeSpeed * blockSize) / sampleRate; // Days elapsed in this block
        this.simTime += dt;
    } else {
        // When paused, we might still want to snap to snapshot if seeking
        if (Math.abs(this.simTime - this.snapshotTime) > 0.001) {
             this.simTime = this.simTime * 0.9 + this.snapshotTime * 0.1; // Soft seek
        }
    }

    // ================================== K-RATE PASS ==================================
    
    // --- Fix: Deep Copy Control Values ---
    // We must snapshot the current state into lastControlValues before modifying currentControlValues.
    this.lastControlValues = {};
    for (const nodeId in this.currentControlValues) {
        this.lastControlValues[nodeId] = { ...this.currentControlValues[nodeId] };
    }
    // Clear UI values for this block, they are transient
    this.uiValues = {};

    // Inject both the smooth running time and the last known snapshot time
    const simStateForThisBlock = { 
        ...this.simState, 
        time: this.simTime, 
        snapshotTime: this.snapshotTime 
    };
    
    // Use flatNodes to iterate quickly
    for (let i = 0; i < this.flatNodes.length; i++) {
        const node = this.flatNodes[i];
        if (node.type === 'DataSource') {
            if (!this.currentControlValues[node.id]) this.currentControlValues[node.id] = {};
            const dsValues = _calculateDataSource(simStateForThisBlock, node, node._liveData);
            Object.assign(this.currentControlValues[node.id], dsValues);
        }
    }

    for (let i = 0; i < this.flatNodes.length; i++) {
        const node = this.flatNodes[i];
        if (!this.currentControlValues[node.id]) this.currentControlValues[node.id] = {};
        if (node._processKR) {
             node._processKR(this, node, node.id);
        }
    }
    
    // ================================== A-RATE PASS ==================================
    
    for (const buffer of this.nodeAudioBuffers.values()) {
        buffer[0] = 0;
        buffer[1] = 0;
    }
    for (const key in this.sampleValuesForUI) delete this.sampleValuesForUI[key];

    const getVal = (nodeId, paramName, def) => this.getARateVal(this.nodeMap.get(nodeId), paramName, def, currentAlpha);
    let currentAlpha = 0;

    for (let i = 0; i < blockSize; i++) {
        currentAlpha = (i + 1) * invBlockSize;
        let masterOutputL = 0, masterOutputR = 0;

        for (let n = 0; n < this.flatNodes.length; n++) {
            const node = this.flatNodes[n];
            const nodeId = node.id;
            const nodeOutBuffer = this.nodeAudioBuffers.get(nodeId);

            if (node.params.isBypassed) {
                const connInfo = node._inputs['in'];
                if (connInfo) {
                     const inputSignal = this.nodeAudioBuffers.get(connInfo.fromNodeId);
                     if (inputSignal) {
                         nodeOutBuffer[0] = inputSignal[0];
                         nodeOutBuffer[1] = inputSignal[1];
                     }
                }
                continue;
            }
            
            const shouldUpdateUI = (i === blockSize - 1) ? this.sampleValuesForUI : null;
            
            processNodeAR(
                this, 
                node, 
                nodeId, 
                currentAlpha, 
                getVal, 
                this.nodeAudioBuffers, 
                shouldUpdateUI,
                nodeOutBuffer
            );
            
            if (node.type === 'Output') {
                masterOutputL += nodeOutBuffer[0];
                masterOutputR += nodeOutBuffer[1];
            }
        }
        
        const finalL = masterOutputL * this.masterVolume;
        const finalR = masterOutputR * this.masterVolume;

        // Global NaN/Infinity Guard
        leftChannel[i] = isFinite(finalL) ? finalL : 0;
        rightChannel[i] = isFinite(finalR) ? finalR : 0;
    }
    
    // --- Finalize and Post Updates ---
    
    // FIX: Separate UI values from Control Values.
    // UI values (like oscillator frequency input) should not pollute the control values map used for routing.
    for (const nodeId in this.sampleValuesForUI) {
        if (!this.uiValues[nodeId]) this.uiValues[nodeId] = {};
        Object.assign(this.uiValues[nodeId], this.sampleValuesForUI[nodeId]);
    }

    const clippingOutputsForUI = {};
    for (const key in this.clippingState) {
        if (this.clippingState[key] > 0) {
            clippingOutputsForUI[key] = true;
            this.clippingState[key]--;
        } else {
            delete this.clippingState[key];
        }
    }
    
    if (currentTime > (this.lastUiUpdateTime || 0) + this.uiUpdateInterval) {
        const oscilloscopeDataForUi = {};
        for (const nodeId in this.oscilloscopeState) {
            const state = this.oscilloscopeState[nodeId];
            if (state.displayBufferReady) {
                oscilloscopeDataForUi[nodeId] = state.displayBuffer.slice();
                state.displayBufferReady = false; 
            }
        }

        // Merge Control Values and UI Values for the frontend, but keep them separate internally.
        const combinedNodeOutputs = {};
        // 1. Add K-Rate Control Values (DataSource outputs, etc)
        for (const id in this.currentControlValues) {
            combinedNodeOutputs[id] = { ...this.currentControlValues[id] };
        }
        // 2. Merge A-Rate UI snapshots (Oscillator inputs, etc)
        for (const id in this.uiValues) {
            if (!combinedNodeOutputs[id]) combinedNodeOutputs[id] = {};
            Object.assign(combinedNodeOutputs[id], this.uiValues[id]);
        }

        this.port.postMessage({ type: 'UI_UPDATE', payload: { 
            nodeOutputs: combinedNodeOutputs,
            clippingOutputs: clippingOutputsForUI,
            oscilloscopeData: oscilloscopeDataForUi,
        } });
        this.lastUiUpdateTime = currentTime;
    }

    return true;
  }
}

registerProcessor('line-sound-processor', LineSoundProcessor);
