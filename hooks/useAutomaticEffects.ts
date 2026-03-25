import React, { useEffect, useRef } from 'react';
import type { AppState } from '../types/state';
import type { UIState } from '../types/uiState';
import type { VisualsState } from '../types/visuals';
import type { SimulationState } from '../types/simulation';
import type { CelestialBodyData } from '../types/celestial';
import { calculateSynodicPeriod } from '../utils/celestialCalculations';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

/**
 * A hook to manage all automatic side effects that react to state changes.
 * This keeps the main controller clean and consolidates reactive logic in one place.
 */
export const useAutomaticEffects = () => {
    const {
        connections,
        isBottomControlsCollapsed,
        planetNodes,
        lineOpacityMultiplier,
        hoveredPlanetId,
        infoPanelPlanetId,
        debugDisableParticles,
        particles,
        actions,
    } = useAppStore(state => ({
        connections: state.connections,
        isBottomControlsCollapsed: state.isBottomControlsCollapsed,
        planetNodes: state.planetNodes,
        lineOpacityMultiplier: state.lineOpacityMultiplier,
        hoveredPlanetId: state.hoveredPlanetId,
        infoPanelPlanetId: state.infoPanelPlanetId,
        debugDisableParticles: state.debugDisableParticles,
        particles: state.particles,
        actions: state.actions,
    }), shallow);

    const { updateUI, getCelestialBody, updateVisuals, updateSimulation } = actions;

    const prevConnectionsCountRef = useRef(connections.length);
    const closePanelTimeoutRef = useRef<number | null>(null);

    // Auto-collapse bottom controls when connections are added/removed
    useEffect(() => {
        const currentCount = connections.length;
        const prevCount = prevConnectionsCountRef.current;

        // Always clear any pending timeout to close the panel when this effect runs.
        if (closePanelTimeoutRef.current) {
            clearTimeout(closePanelTimeoutRef.current);
            closePanelTimeoutRef.current = null;
        }

        if (currentCount > 0 && prevCount === 0 && isBottomControlsCollapsed) {
            // A connection was added to an empty scene, open the panel immediately.
            updateUI({ isBottomControlsCollapsed: false });
        } else if (currentCount === 0 && prevCount > 0 && !isBottomControlsCollapsed) {
            // The last connection was removed. Wait before closing to handle transient states like preset changes.
            closePanelTimeoutRef.current = window.setTimeout(() => {
                // After 500ms, re-check the state directly.
                const latestState = useAppStore.getState();
                if (latestState.connections.length === 0) {
                    // If there are still no connections, it's safe to close the panel.
                    updateUI({ isBottomControlsCollapsed: true });
                }
            }, 500);
        }
        prevConnectionsCountRef.current = currentCount;
        
        // Cleanup on unmount
        return () => {
            if (closePanelTimeoutRef.current) {
                clearTimeout(closePanelTimeoutRef.current);
            }
        };
    }, [connections.length, isBottomControlsCollapsed, updateUI]);
    
    // Auto-calculate line opacity multiplier
    useEffect(() => {
        const avgPersistence = connections.length > 0 ? connections.reduce((acc, conn) => {
            const fromNode = planetNodes.find(n => n.id === conn.from);
            const toNode = planetNodes.find(n => n.id === conn.to);
            const fromPlanet = fromNode ? getCelestialBody(fromNode.name) : undefined;
            const toPlanet = toNode ? getCelestialBody(toNode.name) : undefined;
            if (!fromPlanet || !toPlanet) return acc;
            return acc + (calculateSynodicPeriod(fromPlanet.period, toPlanet.period) * conn.persistenceMultiplier);
        }, 0) / connections.length : 1000;
        
        const rawMultiplier = 1 / (1 + Math.log10(avgPersistence / 1000 + 1));
        const finalMultiplier = isNaN(rawMultiplier) ? 1 : Math.max(0, Math.min(2, rawMultiplier));
        
        if (Math.abs(lineOpacityMultiplier - finalMultiplier) > 0.01) {
            updateVisuals({ lineOpacityMultiplier: finalMultiplier });
        }
    }, [connections, planetNodes, getCelestialBody, updateVisuals, lineOpacityMultiplier]);

    // Sync info panel with hovered planet
    useEffect(() => {
        if (hoveredPlanetId !== null && infoPanelPlanetId !== hoveredPlanetId) {
            updateUI({ infoPanelPlanetId: hoveredPlanetId });
        }
    }, [hoveredPlanetId, infoPanelPlanetId, updateUI]);

    // Clear particles if the debug toggle is enabled
    useEffect(() => {
        if (debugDisableParticles && particles.length > 0) {
            updateSimulation({ particles: [] });
        }
    }, [debugDisableParticles, particles.length, updateSimulation]);
};