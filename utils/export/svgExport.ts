
import type { AppState, CelestialBodyData, Vector3D } from '../../types';
import { STAR_SYSTEMS } from '../../data/starSystems';
import { calculatePlanetPosition, project2D } from '../../hooks/renderer/calculations';
import { getGeocentricOrbitParams } from '../../hooks/renderer/orbitGeometry';
import { calculateZOffsets } from '../zOffsetCalculations';
import { APP_VERSION } from '../../constants';

// Mock canvas interface for project2D compatibility
interface MockCanvas {
    width: number;
    height: number;
}

const formatColor = (hex: string, opacity: number) => {
    return { stroke: hex, opacity: opacity.toFixed(3) };
};

export const generateSVG = (state: AppState): Blob => {
    const width = 1920; // Fixed reference resolution for the SVG ViewBox
    const height = 1080;
    const mockCanvas: MockCanvas = { width, height };

    // --- Helpers ---
    const getCelestialBody = (name: string): CelestialBodyData | undefined => {
        const systemData = STAR_SYSTEMS[state.currentSystem];
        const basePlanetData = systemData?.celestialBodies.find(p => p.name === name);
        if (!basePlanetData) return undefined;
        return { ...basePlanetData, ...state.planetDataOverrides[name] };
    };

    const zOffsets = calculateZOffsets(state, getCelestialBody);

    const project = (pos3D: Vector3D, planetName?: string) => {
        const offset = planetName ? (zOffsets.get(planetName) ?? 0) : 0;
        const adjustedPos = { ...pos3D, z: pos3D.z + offset };
        const proj = project2D(adjustedPos, mockCanvas as HTMLCanvasElement, state);
        return proj;
    };

    // --- SVG Buffer ---
    const svgParts: string[] = [];
    
    // Header
    svgParts.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
    svgParts.push(`<!-- AstroLight v${APP_VERSION} Export - System: ${state.currentSystem} -->`);
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: ${state.backgroundColor2}">`);

    // Background Rect (Optional, useful for previewing)
    if (state.showBackgroundColor) {
         svgParts.push(`<rect width="100%" height="100%" fill="${state.backgroundColor2}" id="Background_Fill" />`);
    }

    // --- Group: Orbits ---
    if (state.showOrbits) {
        svgParts.push(`<g id="Orbits" fill="none" stroke="${state.orbitColor}" stroke-width="${state.orbitLineWidth}" stroke-opacity="${state.orbitOpacity}">`);
        
        for (const node of state.planetsToRender) {
            const planet = getCelestialBody(node.name);
            if (!planet) continue;

            let segments = 120;
            let duration = planet.period;
            let startTime = 0;

            if (state.currentSystem === 'Geo-centric') {
                const params = getGeocentricOrbitParams(planet.name, planet.period);
                duration = params.durationInDays;
                segments = params.segmentCount;
                startTime = state.time - duration;
            }

            const points: string[] = [];
            let pathString = "";
            let isPenDown = false;

            for (let i = 0; i <= segments; i++) {
                const timeAtAngle = startTime + duration * (i / segments);
                const pos = calculatePlanetPosition(planet, timeAtAngle, state);
                const proj = project(pos, planet.name);

                if (proj.behind) {
                    isPenDown = false;
                } else {
                    const coord = `${proj.x.toFixed(1)},${proj.y.toFixed(1)}`;
                    if (!isPenDown) {
                        pathString += ` M ${coord}`; // Move To
                        isPenDown = true;
                    } else {
                        pathString += ` L ${coord}`; // Line To
                    }
                }
            }
            
            if (pathString.length > 0) {
                 svgParts.push(`<path d="${pathString.trim()}" id="Orbit_${planet.name}" />`);
            }
        }
        svgParts.push(`</g>`);
    }

    // --- Group: Lines (Connections) ---
    if (state.showLines && state.lineHistory.length > 0) {
        svgParts.push(`<g id="Connection_Lines" fill="none" stroke-width="${state.lineWidth}" stroke-linecap="round">`);
        
        // We process lines in chunks to avoid massive string operations
        state.lineHistory.forEach(line => {
            // Check cull
            if (line.isDying && (line.startFadeOpacity || 0) < 0.01) return;
            
            const fromProj = project(line.from, line.fromPlanetName);
            const toProj = project(line.to, line.toPlanetName);

            if (fromProj.behind || toProj.behind) return;

            const opacity = line.isDying 
                ? (line.startFadeOpacity || 1) * state.lineOpacityMultiplier 
                : state.lineOpacityMultiplier;
            
            // Simple culling for very faint lines
            if (opacity < 0.05) return;

            svgParts.push(
                `<line x1="${fromProj.x.toFixed(1)}" y1="${fromProj.y.toFixed(1)}" ` +
                `x2="${toProj.x.toFixed(1)}" y2="${toProj.y.toFixed(1)}" ` +
                `stroke="${line.color}" stroke-opacity="${opacity.toFixed(2)}" />`
            );
        });
        svgParts.push(`</g>`);
    }

    // --- Group: Live Lines ---
    if (state.showLiveConnections && state.connections.length > 0) {
        svgParts.push(`<g id="Live_Connections" fill="none" stroke-width="${state.liveLineWidth}" stroke-opacity="${state.liveLineOpacity}">`);
        
        state.connections.forEach(conn => {
            const fromNode = state.planetNodes.find(n => n.id === conn.from);
            const toNode = state.planetNodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return;
            
            const fromPlanet = getCelestialBody(fromNode.name);
            const toPlanet = getCelestialBody(toNode.name);
            if (!fromPlanet || !toPlanet) return;

            const fromPos = calculatePlanetPosition(fromPlanet, state.time, state);
            const toPos = calculatePlanetPosition(toPlanet, state.time, state);
            
            const fromProj = project(fromPos, fromPlanet.name);
            const toProj = project(toPos, toPlanet.name);

            if (!fromProj.behind && !toProj.behind) {
                 svgParts.push(
                    `<line x1="${fromProj.x.toFixed(1)}" y1="${fromProj.y.toFixed(1)}" ` +
                    `x2="${toProj.x.toFixed(1)}" y2="${toProj.y.toFixed(1)}" ` +
                    `stroke="${conn.color}" />`
                );
            }
        });
        svgParts.push(`</g>`);
    }

    // --- Group: Planets ---
    if (state.showPlanets) {
        svgParts.push(`<g id="Planets">`);
        
        for (const node of state.planetsToRender) {
            const planet = getCelestialBody(node.name);
            if (!planet) continue;
            
            const pos = calculatePlanetPosition(planet, state.time, state);
            const proj = project(pos, planet.name);
            
            if (proj.behind) continue;

            const radius = Math.max(2, planet.radius * state.planetSizeMultiplier * proj.scale * 0.5);
            
            svgParts.push(
                `<circle cx="${proj.x.toFixed(1)}" cy="${proj.y.toFixed(1)}" r="${radius.toFixed(1)}" ` +
                `fill="${planet.color}" fill-opacity="${state.planetOpacity}" />`
            );
            
            if (state.showLabels) {
                svgParts.push(
                    `<text x="${proj.x.toFixed(1)}" y="${(proj.y - radius - 5).toFixed(1)}" ` +
                    `fill="${state.labelColor}" fill-opacity="${state.labelOpacity}" ` +
                    `font-family="sans-serif" font-size="${state.labelFontSize}" text-anchor="middle">${planet.name}</text>`
                );
            }
        }
        svgParts.push(`</g>`);
    }

    svgParts.push(`</svg>`);

    return new Blob([svgParts.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
};
