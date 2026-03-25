
// Newton's method to solve Kepler's Equation: M = E - e*sin(E)
function solveEccentricAnomaly(M, e) {
    let E = M;
    const tolerance = 1e-6;
    for (let i = 0; i < 10; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < tolerance) break;
    }
    return E;
}

function calculateOrbitalState(body, simState, conversionFactor) {
    const time = simState.time;
    
    // Dead Reckoning for Live Data
    if (body.livePos && body.liveVel && simState.snapshotTime !== undefined) {
        // Extrapolate position based on velocity and time delta
        const dt = time - simState.snapshotTime; // Delta in Days
        
        // liveVel is in Mkm/day
        // livePos is in Mkm (normalized from scene scale)
        const x = body.livePos.x + body.liveVel.x * dt;
        const y = body.livePos.y + body.liveVel.y * dt;
        const z = body.livePos.z + body.liveVel.z * dt;
        
        // Recalculate instantaneous radius and velocity magnitude
        const r = Math.sqrt(x*x + y*y + z*z);
        const v_mag_km_s = Math.sqrt(body.liveVel.x**2 + body.liveVel.y**2 + body.liveVel.z**2) / 86400 * 1000000; // Mkm/day -> km/s

        return { x, y, z, v: v_mag_km_s * 86400, r }; // Return v back in km/day for consistency in calculation
    }

    // Fallback to Analytical Keplerian Model
    const p = body.period;
    const a = body.orbitRadius;
    const e = body.eccentricity || 0;
    
    if (p === 0 || a === 0) {
        return { x: 0, y: 0, v: 0, r: 0 };
    }

    // Mean Anomaly
    const phaseOffsetRad = (body.phaseOffset || 0) * (Math.PI / 180);
    let M = (2 * Math.PI * time / p) + phaseOffsetRad;
    M = M % (2 * Math.PI);

    // Eccentric Anomaly
    const E = solveEccentricAnomaly(M, e);

    // Current Radius (distance from star)
    const r = a * (1 - e * Math.cos(E));

    // Position in orbital plane (2D approximation for fallback)
    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // Instantaneous Velocity via Vis-viva
    const v_mean = (2 * Math.PI * a * conversionFactor) / p;
    const v = v_mean * Math.sqrt((2 * a) / r - 1);

    return { x, y, v, r };
}

function _calculateDataSource(simState, node, liveData) {
    const EARTH_PERIOD = 365.25;
    
    let values = { 
        realtimeDistance: 0, relativeDistance: 0, synodicPeriod: 0, 
        orbitalRatio: 0, 
        fromOrbitRadius: 0, toOrbitRadius: 0,
        fromOrbitPeriod: 0, toOrbitPeriod: 0,
        fromVelocity: 0, toVelocity: 0,
        fromPhysicalRadius: 0, toPhysicalRadius: 0
    };

    const params = node.params;
    const source = liveData || params; 

    // 1. Single Planet Mode
    if (source.mode === 'planet' && source.body) {
        const { body } = source;
        const state = calculateOrbitalState(body, simState, 1000000);

        values.fromOrbitRadius = state.r; // Live distance from star
        values.fromOrbitPeriod = body.period;
        values.fromPhysicalRadius = body.realRadius || 0;
        values.fromVelocity = state.v / 86400; // km/s

        // These remain 0 for single planet mode
        values.realtimeDistance = 0;
        values.relativeDistance = 0;
        values.synodicPeriod = 0;
        values.orbitalRatio = 0;
    } 
    // 2. Connection Mode
    else if (source.from && source.to) {
        const { from, to } = source;
        
        const state1 = calculateOrbitalState(from, simState, 1000000);
        const state2 = calculateOrbitalState(to, simState, 1000000);

        // Calculate distance between bodies
        const dx = state1.x - state2.x;
        const dy = state1.y - state2.y;
        // Include Z if available from live/extrapolated data
        const dz = (state1.z || 0) - (state2.z || 0); 
        
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        values.realtimeDistance = dist;

        // Metadata calculation
        const p1 = from.period === 0 ? EARTH_PERIOD : from.period;
        const p2 = to.period === 0 ? EARTH_PERIOD : to.period;
        const synodic = p1 === p2 ? p1 : 1 / Math.abs(1 / p1 - 1 / p2);
        
        const r1_max = from.orbitRadius * (1 + (from.eccentricity||0));
        const r1_min = from.orbitRadius * (1 - (from.eccentricity||0));
        const r2_max = to.orbitRadius * (1 + (to.eccentricity||0));
        const r2_min = to.orbitRadius * (1 - (to.eccentricity||0));
        
        const maxPossibleDist = r1_max + r2_max;
        const minPossibleDist = Math.max(0, Math.abs(r1_min - r2_max), Math.abs(r2_min - r1_max)); 
        
        const range = maxPossibleDist - minPossibleDist;
        values.relativeDistance = range > 0.001 ? (dist - minPossibleDist) / range : 0;
        values.relativeDistance = Math.max(0, Math.min(1, values.relativeDistance));

        values.synodicPeriod = synodic;
        values.orbitalRatio = Math.max(p1, p2) / Math.min(p1, p2);
        
        values.fromOrbitRadius = state1.r;
        values.toOrbitRadius = state2.r;
        values.fromOrbitPeriod = from.period;
        values.toOrbitPeriod = to.period;
        
        values.fromPhysicalRadius = from.realRadius || 0;
        values.toPhysicalRadius = to.realRadius || 0;

        values.fromVelocity = state1.v / 86400; // km/s
        values.toVelocity = state2.v / 86400;   // km/s
    }
    return values;
}

function processDataSourceKR(processor, node, nodeId) {
    // Logic moved to LineSoundProcessor.js K-Rate pass for optimization.
}
