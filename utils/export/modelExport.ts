import type { AppState, CelestialBodyData, Line } from '../../types';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { APP_VERSION } from '../../constants';
import { calculatePlanetPosition } from '../../hooks/renderer/calculations';
import { hexToRgb } from '../colorUtils';

/**
 * Generates a .OBJ 3D model string from the current line history and visible planets.
 * 
 * COORDINATE SPACE:
 * This export uses "World Space" coordinates. The planets and orbits are placed at their
 * simulated 3D positions (X, Y, Z).
 * 
 * PIVOT POINTS:
 * The OBJ format does not support scene graph hierarchies or local pivot points in the way
 * formats like FBX or glTF do. Vertices are baked into World Space to ensure the scene
 * layout (relative positions of planets) is correct when imported.
 * 
 * CAMERA:
 * A wireframe "Camera_Estimate" object is generated to visualize the viewer's position
 * and orientation at the time of export.
 */
export const generateOBJ = (state: AppState): Blob => {
    const lines = state.lineHistory;
    const zOffsets = state.actualZOffsets;
    
    const getCelestialBody = (name: string): CelestialBodyData | undefined => {
        const systemData = STAR_SYSTEMS[state.currentSystem];
        const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
        if (!basePlanetData) return undefined;
        return { ...basePlanetData, ...state.planetDataOverrides[name] };
    };

    // Transforms a simulation point for export.
    // We ONLY apply the Z-Offset feature here, as that changes the physical structure of the visualization.
    // We do NOT apply camera rotation/tilt to the geometry, keeping it in "World Space".
    const transformPoint = (p: {x:number, y:number, z:number}, zOffset: number) => {
        return { x: p.x, y: p.y, z: p.z + zOffset };
    };

    // Helper to format vertex lines with optional color
    const formatVertex = (v: {x:number, y:number, z:number}, colorHex?: string): string => {
        let line = `v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}`;
        if (colorHex) {
             const rgb = hexToRgb(colorHex);
             if (rgb) {
                 // OBJ vertex colors are typically 0.0-1.0
                 line += ` ${(rgb.r/255).toFixed(3)} ${(rgb.g/255).toFixed(3)} ${(rgb.b/255).toFixed(3)}`;
             }
        }
        return line;
    };

    let output: string[] = [];
    output.push(`# AstroLight v${APP_VERSION} Export`);
    output.push(`# System: ${state.currentSystem}`);
    output.push(`# Coordinates: World Space (X: Right, Y: Up, Z: Depth)`);
    output.push(`# Note: OBJ format does not support local pivot points for objects exported in a layout.`);
    
    let vertexCount = 1;

    // Calculate Ribbon Width parameters based on visual settings
    const NORMAL_LINE_WIDTH = 0.2;
    const relativeWidth = Math.max(0.1, state.lineWidth / NORMAL_LINE_WIDTH);
    const scaledRelativeWidth = Math.pow(relativeWidth, 0.5);
    const EXPORT_SCALE = 0.1; 
    const baseRibbonWidth = 1.6 * scaledRelativeWidth * EXPORT_SCALE;


    // --- PART 1: CAMERA ESTIMATE ---
    // Generate a wireframe object representing the camera's position and orientation.
    output.push(`g Camera_Group`);
    output.push(`o Camera_Estimate`);
    
    // Calculate Camera World Position
    // Start at (0,0,Distance) relative to the view center.
    // Apply inverse rotations to find where it is in the World.
    // View Transform order: Z-Rotate (rotation) -> X-Rotate (tilt)
    // Inverse order: X-Unrotate -> Z-Unrotate
    
    const camDist = 4000 / state.actualZoom;
    
    // Base camera geometry (Pyramid pointing -Z)
    // In "View Space", camera is at (0,0,0) looking at -Z. 
    // But our simulation logic places camera at +Z looking at origin.
    // Let's define the camera *at its world position* and point it towards the origin.
    
    // Initial Camera Position in "View Space" (before un-rotating)
    const cPosView = { x: 0, y: 0, z: camDist };
    
    // Inverse Rotation Logic
    const rotMultiplier = (state.enableLineZDrift && state.lineDriftAxis === 'x') ? 1 : -1;
    const rotRad = (state.rotation * rotMultiplier) * (Math.PI / 180);
    const tiltRad = state.tilt * (Math.PI / 180);
    
    // To un-rotate: 
    // 1. Rotate by -tilt around X
    // 2. Rotate by -rotation around Z
    
    const unRotate = (p: {x: number, y: number, z: number}) => {
        // 1. Un-Tilt (rotate around X by -tiltRad)
        // (Note: Our tilt is defined such that +Tilt rotates top away (-Z). Standard RH rule.)
        // In app: foregroundCameraPivot.rotation.x = -tiltRad
        // So to reverse, we rotate by +tiltRad? 
        // Let's stick to the matrix logic. ViewMatrix = R_x(-tilt) * R_z(rot).
        // CameraWorld = (ViewMatrix)^-1 * (0,0,D)
        //             = R_z(-rot) * R_x(tilt) * (0,0,D)
        
        const cosT = Math.cos(tiltRad); // Using positive tilt for inverse of negative tilt
        const sinT = Math.sin(tiltRad);
        
        const y1 = p.y * cosT - p.z * sinT;
        const z1 = p.y * sinT + p.z * cosT;
        const x1 = p.x;

        // 2. Un-Rotate (rotate around Z by -rotRad)
        const cosR = Math.cos(-rotRad);
        const sinR = Math.sin(-rotRad);
        
        const x2 = x1 * cosR - y1 * sinR;
        const y2 = x1 * sinR + y1 * cosR;
        const z2 = z1;
        
        return { x: x2, y: y2, z: z2 };
    };
    
    const camWorldPos = unRotate(cPosView);
    
    // Create a frustum/pyramid geometry at the camera position
    // Apex at camera pos, base pointing towards origin
    const camSize = camDist * 0.05; // Scale camera icon by distance
    const corners = [
        { x: 0, y: 0, z: 0 }, // 0: Apex (Camera Location)
        { x: -1, y: 1, z: -2 }, // 1: Top Left
        { x: 1, y: 1, z: -2 }, // 2: Top Right
        { x: 1, y: -1, z: -2 }, // 3: Bottom Right
        { x: -1, y: -1, z: -2 }, // 4: Bottom Left
        { x: 0, y: 1.3, z: -2 }, // 5: Up Indicator
    ];
    
    corners.forEach(c => {
        // Scale
        let p = { x: c.x * camSize, y: c.y * camSize, z: c.z * camSize };
        
        // Rotate (Apply the same transformation as the position)
        // We start with the shape aligned to View Space (looking -Z), then un-rotate it to World Space.
        // Since we want to place it at `camWorldPos`, we take the local shape (offset from 0,0,0)
        // un-rotate it, and add it to the final position? 
        // No, `unRotate` moves (0,0,D) to World. It will also rotate the offsets correctly.
        // So we take the shape defined around (0,0,D) in view space.
        
        const pInViewSpace = { x: p.x, y: p.y, z: p.z + camDist };
        const pInWorld = unRotate(pInViewSpace);
        
        output.push(formatVertex(pInWorld, '#FFFFFF'));
    });
    
    // Draw wireframe lines
    // Apex to corners
    output.push(`l ${vertexCount} ${vertexCount+1}`);
    output.push(`l ${vertexCount} ${vertexCount+2}`);
    output.push(`l ${vertexCount} ${vertexCount+3}`);
    output.push(`l ${vertexCount} ${vertexCount+4}`);
    // Base square
    output.push(`l ${vertexCount+1} ${vertexCount+2}`);
    output.push(`l ${vertexCount+2} ${vertexCount+3}`);
    output.push(`l ${vertexCount+3} ${vertexCount+4}`);
    output.push(`l ${vertexCount+4} ${vertexCount+1}`);
    // Up indicator
    output.push(`l ${vertexCount} ${vertexCount+5}`);
    
    vertexCount += 6;


    // --- PART 2: PLANETS ---
    if (state.showPlanets) {
        output.push(`g Planets`);

        const widthSegments = 24;
        const heightSegments = 12;

        for (const node of state.planetsToRender) {
            const planet = getCelestialBody(node.name);
            if (!planet) continue;

            const zOff = zOffsets[node.name] ?? 0;
            const pos3D = calculatePlanetPosition(planet, state.time, state);
            const tCenter = transformPoint(pos3D, zOff);
            
            // Adjust radius by scene multiplier
            const r = planet.radius * state.planetSizeMultiplier * EXPORT_SCALE * 5;

            output.push(`o Planet_${node.name}`);

            const startVertex = vertexCount;

            for (let y = 0; y <= heightSegments; y++) {
                const v = y / heightSegments;
                const phi = v * Math.PI;

                for (let x = 0; x <= widthSegments; x++) {
                    const u = x / widthSegments;
                    const theta = u * Math.PI * 2;

                    const vx = tCenter.x + r * Math.sin(phi) * Math.cos(theta);
                    const vy = tCenter.y + r * Math.cos(phi);
                    const vz = tCenter.z + r * Math.sin(phi) * Math.sin(theta);

                    output.push(formatVertex({x: vx, y: vy, z: vz}, planet.color));
                }
            }

            const stride = widthSegments + 1;
            for (let y = 0; y < heightSegments; y++) {
                for (let x = 0; x < widthSegments; x++) {
                    const v1 = startVertex + (y * stride) + x;
                    const v2 = startVertex + (y * stride) + x + 1;
                    const v3 = startVertex + ((y + 1) * stride) + x + 1;
                    const v4 = startVertex + ((y + 1) * stride) + x;
                    output.push(`f ${v1} ${v2} ${v3} ${v4}`);
                }
            }
            vertexCount += (widthSegments + 1) * (heightSegments + 1);
        }
    }


    // --- PART 3: LINES (CONNECTIONS) ---
    
    // Group lines by connection ID
    const groupedLines = new Map<number, Line[]>();
    for (const line of lines) {
        if (!groupedLines.has(line.connectionId)) {
            groupedLines.set(line.connectionId, []);
        }
        groupedLines.get(line.connectionId)!.push(line);
    }

    groupedLines.forEach((connectionLines, connectionId) => {
        const fromName = connectionLines[0].fromPlanetName;
        const toName = connectionLines[0].toPlanetName;
        const groupName = `Connection_${fromName}_${toName}`;
        
        // Use a top-level group for the connection
        output.push(`g ${groupName}`);
        
        // --- 3a. Wireframe Lines (l) ---
        output.push(`o ${groupName}_Lines`);
        
        for (const line of connectionLines) {
            const zOffFrom = zOffsets[line.fromPlanetName] ?? 0;
            const zOffTo = zOffsets[line.toPlanetName] ?? 0;

            const tP1 = transformPoint(line.from, zOffFrom);
            const tP2 = transformPoint(line.to, zOffTo);

            output.push(formatVertex(tP1, line.color));
            output.push(formatVertex(tP2, line.color));
            
            output.push(`l ${vertexCount} ${vertexCount + 1}`);
            vertexCount += 2;
        }

        // --- 3b. 3D Ribbon Meshes (f) ---
        output.push(`o ${groupName}_Ribbon`);
        
        for (const line of connectionLines) {
            const zOffFrom = zOffsets[line.fromPlanetName] ?? 0;
            const zOffTo = zOffsets[line.toPlanetName] ?? 0;

            const tP1 = transformPoint(line.from, zOffFrom);
            const tP2 = transformPoint(line.to, zOffTo);

            // Calculate perpendicular vector in XY plane for ribbon width
            // Note: This creates ribbons flat to the XY plane. For a true camera-facing ribbon
            // we would need the camera position, but in World Space export, a flat 'up' facing
            // ribbon is a reasonable default if we don't want to bake view dependency.
            // Alternatively, use the Z-axis as 'up' for the cross product.
            
            const dx = tP2.x - tP1.x;
            const dy = tP2.y - tP1.y;
            const dz = tP2.z - tP1.z;
            
            // Simple approach: offset in Z to make a vertical ribbon? 
            // Or offset in XY perpendicular? Let's stick to XY perpendicular for now as viewed from top-down (standard map view).
            
            const len = Math.sqrt(dx*dx + dy*dy);
            let nx = 0, ny = 0, nz = 0;

            if (len > 0.00001) {
                nx = -dy / len;
                ny = dx / len;
            } else {
                // Vertical line case, offset in X
                nx = 1;
            }

            let w1 = baseRibbonWidth;
            let w2 = baseRibbonWidth;
            
            const v1 = { x: tP1.x + nx * w1, y: tP1.y + ny * w1, z: tP1.z };
            const v2 = { x: tP1.x - nx * w1, y: tP1.y - ny * w1, z: tP1.z };
            const v3 = { x: tP2.x - nx * w2, y: tP2.y - ny * w2, z: tP2.z };
            const v4 = { x: tP2.x + nx * w2, y: tP2.y + ny * w2, z: tP2.z };

            output.push(formatVertex(v1, line.color));
            output.push(formatVertex(v2, line.color));
            output.push(formatVertex(v3, line.color));
            output.push(formatVertex(v4, line.color));

            const rBase = vertexCount;
            output.push(`f ${rBase} ${rBase+1} ${rBase+2} ${rBase+3}`);

            vertexCount += 4;
        }
    });


    // --- PART 4: ORBIT PATHS ---
    if (state.showOrbits) {
        output.push(`g Orbits`);
        
        for (const node of state.planetsToRender) {
            const planet = getCelestialBody(node.name);
            if (!planet) continue;

            const zOff = zOffsets[node.name] ?? 0;
            const segments = state.currentSystem === 'Geo-centric' && planet.name === 'Moon' ? 360 : 120;
            
            output.push(`o Orbit_${node.name}`);
            
            const firstOrbitVertexIndex = vertexCount;

            for (let i = 0; i <= segments; i++) {
                 const timeAtAngle = planet.period * (i / segments);
                 const pos3D = calculatePlanetPosition(planet, timeAtAngle, state);
                 const tPos = transformPoint(pos3D, zOff);
                 // Use orbitColor from state
                 output.push(formatVertex(tPos, state.orbitColor));
            }

            const indices = [];
            for (let i = 0; i <= segments; i++) {
                 indices.push(firstOrbitVertexIndex + i);
            }
            output.push(`l ${indices.join(' ')}`);

            vertexCount += (segments + 1);
        }
    }

    return new Blob([output.join('\n')], { type: 'text/plain' });
};