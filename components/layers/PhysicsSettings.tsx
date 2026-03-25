
import React from 'react';
import ToggleSwitch from '../shared/ToggleSwitch';
import StyledToggleSwitch from '../shared/StyledToggleSwitch';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

interface PhysicsSettingsProps {
    tooltips: { [key: string]: string };
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
}

const PhysicsSettings: React.FC<PhysicsSettingsProps> = ({ tooltips, handleMouseEnter, handleMouseLeave }) => {
    const { 
        simulation,
        adjustParameter,
        toggleRealisticPhysics,
        enterPlanetModificationMode,
    } = useAppStore(state => ({
        simulation: {
            currentSystem: state.currentSystem,
            useRealisticPhysics: state.useRealisticPhysics,
            logarithmicOrbits: state.logarithmicOrbits,
            ellipticalOrbits: state.ellipticalOrbits,
            orbitalInclination: state.orbitalInclination,
        },
        adjustParameter: state.actions.adjustParameter,
        toggleRealisticPhysics: state.actions.toggleRealisticPhysics,
        enterPlanetModificationMode: state.actions.enterPlanetModificationMode,
    }), shallow);
    
    const isSolSystem = simulation.currentSystem === 'Sol' || simulation.currentSystem === 'Sol (Extended)';
    const isGeoCentricSystem = simulation.currentSystem === 'Geo-centric';

    return (
        <div id="physics-settings" className="mt-2 py-3 border-y border-white/10">
            <ToggleSwitch
                label="Use Realistic Physics"
                checked={simulation.useRealisticPhysics}
                onChange={toggleRealisticPhysics}
                disabled={!isSolSystem || isGeoCentricSystem}
            />
            
            {simulation.useRealisticPhysics && !isGeoCentricSystem && (
                <p className="text-xs text-gray-500 text-center italic mt-2">
                    Custom orbit settings are disabled.
                </p>
            )}
            
            {(!simulation.useRealisticPhysics || isGeoCentricSystem) && (
                <div className="transition-opacity duration-300">
                    <StyledToggleSwitch
                        labelLeft="Realistic Scale"
                        labelRight="Fitted Scale"
                        checked={simulation.logarithmicOrbits}
                        onChange={v => adjustParameter({ logarithmicOrbits: v })}
                        tooltipLeft={tooltips.realisticOrbits}
                        tooltipRight={tooltips.logarithmicOrbits}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                    {!simulation.useRealisticPhysics && (
                        <>
                            <StyledToggleSwitch
                                labelLeft="Circular Orbits"
                                labelRight="Elliptical Orbits"
                                checked={simulation.ellipticalOrbits}
                                onChange={v => adjustParameter({ ellipticalOrbits: v })}
                                tooltipLeft={tooltips.circularOrbits}
                                tooltipRight={tooltips.ellipticalOrbits}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                            <StyledToggleSwitch
                                labelLeft="Flat Orbits"
                                labelRight="Orbital Inclination"
                                checked={simulation.orbitalInclination}
                                onChange={v => adjustParameter({ orbitalInclination: v })}
                                tooltipLeft={tooltips.flatOrbits}
                                tooltipRight={tooltips.orbitalInclination}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                             <div className="pt-3 mt-3 border-t border-white/10">
                                 <button 
                                    id="modify-planet-btn"
                                    onClick={enterPlanetModificationMode}
                                    className="w-full text-center px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm text-gray-300"
                                >
                                    Modify Planet...
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PhysicsSettings;
