import React, { useState, useEffect, useRef } from 'react';
import type { CelestialBodyData } from '../types/celestial';
import type { AppState } from '../types/state';
import { useAppStore, AppStoreState } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { STAR_SYSTEMS } from '../data/starSystems';
import { useSlideInAnimation } from '../hooks/useSlideInAnimation';

const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;

const PlanetInfoPanel: React.FC = () => {
    const {
        planetNodes,
        currentSystem,
        hoveredPlanetId,
        infoPanelPlanetId,
        isPlanetInfoPanelCollapsed,
        selectedPlanet,
        getCelestialBody,
        updateUI,
        hasSystemBeenChanged,
    } = useAppStore(state => ({
        planetNodes: state.planetNodes,
        currentSystem: state.currentSystem,
        hoveredPlanetId: state.hoveredPlanetId,
        infoPanelPlanetId: state.infoPanelPlanetId,
        isPlanetInfoPanelCollapsed: state.isPlanetInfoPanelCollapsed,
        selectedPlanet: state.selectedPlanet,
        getCelestialBody: state.actions.getCelestialBody,
        updateUI: state.actions.updateUI,
        hasSystemBeenChanged: state.hasSystemBeenChanged,
    }), shallow);


    const [isExpanded, setIsExpanded] = useState(false);
    const style = useSlideInAnimation(isPlanetInfoPanelCollapsed, 'up', false);
    
    // When a new system is selected, ensure the info panel is visible and expanded.
    useEffect(() => {
        if (hasSystemBeenChanged) {
            setIsExpanded(true);
            updateUI({ isPlanetInfoPanelCollapsed: false });
        }
    }, [currentSystem, hasSystemBeenChanged, updateUI]);

    // Reset expanded state when the panel is hidden
    useEffect(() => {
        if (isPlanetInfoPanelCollapsed) {
            setIsExpanded(false);
        }
    }, [isPlanetInfoPanelCollapsed]);

    const star = STAR_SYSTEMS[currentSystem]?.star;

    let planetIdToDisplay: number | null = null;
    if (hoveredPlanetId) {
        planetIdToDisplay = hoveredPlanetId;
    } else if (infoPanelPlanetId) {
        planetIdToDisplay = infoPanelPlanetId;
    } else if (selectedPlanet) {
        planetIdToDisplay = selectedPlanet.id;
    }

    const planetToDisplayNode = planetIdToDisplay
        ? planetNodes.find(n => n.id === planetIdToDisplay)
        : null;

    const planetData = planetToDisplayNode ? getCelestialBody(planetToDisplayNode.name) : null;

    const handleMouseEnter = (e: React.MouseEvent, content: string) => {
        updateUI({ tooltip: { x: e.pageX, y: e.pageY, content } });
    };

    const handleMouseLeave = () => {
        updateUI({ tooltip: null });
    };
    
    const tooltips = {
        radius: "A visual representation of the planet's size used for this simulation's scaling.",
        realRadius: "The actual equatorial radius of the celestial body, measured in kilometers.",
        orbitRadius: "The average distance from the planet to its star, measured in millions of kilometers.",
        period: "The time it takes for the planet to complete one full orbit around its star, measured in Earth days.",
        eccentricity: "A measure of how much an orbit deviates from a perfect circle. 0 is a circle, values closer to 1 are more elongated.",
        inclination: "The angle between the planet's orbital plane and the solar system's main plane (the ecliptic), measured in degrees.",
    };
    
    const handleToggle = () => {
        if (isPlanetInfoPanelCollapsed) {
            updateUI({ isPlanetInfoPanelCollapsed: false });
            return;
        }

        if (isExpanded) {
            setIsExpanded(false);
        } else {
            updateUI({ isPlanetInfoPanelCollapsed: true });
        }
    };
    
    const panelTitle = planetData ? planetData.name : star.name;

    return (
        <div id="planet-info-panel" className={`fixed bottom-5 right-5 pointer-events-auto`} style={style}>
            <div 
                className={`dynamic-blur border border-white/10 rounded-xl shadow-2xl transition-all duration-300 ${!isExpanded ? 'py-2 px-4' : 'p-5'}`}
            >
                {!isExpanded ? (
                     <div className="flex items-center justify-between gap-4 min-w-[250px]">
                        <h3 className="text-base font-semibold text-white truncate" title={panelTitle}>
                           {panelTitle}
                        </h3>
                        <button onClick={() => setIsExpanded(true)} className="text-sm text-indigo-300 hover:text-white whitespace-nowrap font-medium">
                            Show info
                        </button>
                    </div>
                ) : (
                    <div className="min-w-[250px] max-w-xs text-sm">
                        {planetData ? (
                            <>
                                <h3 className="text-lg font-semibold mb-2 text-white">{planetData.name}</h3>
                                <div>
                                    <div className="mb-3">
                                        <span className="text-gray-400">Description</span>
                                        <p className="font-medium text-white mt-1 leading-relaxed">{planetData.description}</p>
                                    </div>
                                    <hr className="border-white/10 my-3" />
                                    <InfoItem 
                                        label="Relative Radius" 
                                        value={planetData.radius} 
                                        tooltip={tooltips.radius}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                    {planetData.realRadius && (
                                        <InfoItem 
                                            label="Real Radius" 
                                            value={`${planetData.realRadius.toLocaleString()} km`} 
                                            tooltip={tooltips.realRadius}
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                        />
                                    )}
                                    <InfoItem 
                                        label="Orbital Radius" 
                                        value={`${planetData.orbitRadius} million km`} 
                                        tooltip={tooltips.orbitRadius}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                    <InfoItem 
                                        label="Orbital Period" 
                                        value={`${planetData.period} days`} 
                                        tooltip={tooltips.period}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                    <InfoItem 
                                        label="Eccentricity" 
                                        value={planetData.eccentricity} 
                                        tooltip={tooltips.eccentricity}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                    <InfoItem 
                                        label="Inclination" 
                                        value={`${planetData.inclination}°`} 
                                        tooltip={tooltips.inclination}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className={`py-2 text-left`}>
                                <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-transparent bg-clip-text">
                                    {star.name}
                                </h1>
                                <p className="text-gray-400 mb-4 text-sm leading-relaxed">{star.description}</p>
                                <p className="text-xs text-gray-500 italic mt-2">Select a planet to see its details.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 dynamic-blur border border-b-0 border-white/10 rounded-t-lg flex items-center justify-center cursor-pointer text-gray-400 text-xs hover:text-white hover:bg-white/5 transition-colors"
                onClick={handleToggle}
            >
                 {isPlanetInfoPanelCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
        </div>
    );
};

interface InfoItemProps {
    label: string;
    value: string | number;
    tooltip?: string;
    onMouseEnter?: (e: React.MouseEvent, content: string) => void;
    onMouseLeave?: () => void;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, tooltip, onMouseEnter, onMouseLeave }) => {
    const handleMouseEnter = (e: React.MouseEvent) => {
        if (tooltip && onMouseEnter) {
            onMouseEnter(e, tooltip);
        }
    };

    const handleMouseLeave = () => {
        if (tooltip && onMouseLeave) {
            onMouseLeave();
        }
    };

    return (
        <div className="flex justify-between mb-2 last:mb-0">
            <span
                className={`text-gray-400 ${tooltip ? 'underline decoration-dotted cursor-help' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {label}:
            </span>
            <span className="font-medium text-white text-right ml-2">{value}</span>
        </div>
    );
};

export default PlanetInfoPanel;