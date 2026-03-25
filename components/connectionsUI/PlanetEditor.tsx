import React from 'react';
import type { CelestialBodyData, PlanetNode } from '../../types/index';
import Slider from '../shared/Slider';

interface PlanetEditorProps {
    planet: CelestialBodyData;
    node: PlanetNode;
    updatePlanetOverride: (planetName: string, property: keyof Pick<CelestialBodyData, 'orbitRadius' | 'eccentricity' | 'inclination' | 'period' | 'phaseOffset'>, value: number) => void;
    resetPlanetOverrides: (planetName: string) => void;
    resetPlanetPropertyOverride: (planetName: string, property: keyof Pick<CelestialBodyData, 'orbitRadius' | 'eccentricity' | 'inclination' | 'period' | 'phaseOffset'>) => void;
}

const PlanetEditor: React.FC<PlanetEditorProps> = ({ planet, node, updatePlanetOverride, resetPlanetOverrides, resetPlanetPropertyOverride }) => {
    
    return (
        <div className="bg-white/5 p-2 rounded-md">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">{node.name}</h4>
                <button onClick={(e) => { e.stopPropagation(); resetPlanetOverrides(node.name); }} className="px-2 py-0.5 text-xs bg-white/10 rounded-md hover:bg-red-500/50">Reset All</button>
            </div>
            <Slider
                label="Orbit Radius"
                value={planet.orbitRadius}
                min={1} max={10000} step={0.1}
                onChange={v => updatePlanetOverride(node.name, 'orbitRadius', v)}
                onReset={() => resetPlanetPropertyOverride(node.name, 'orbitRadius')}
                logarithmic logMin={1} logMax={10000}
            />
            <Slider
                label="Eccentricity"
                value={planet.eccentricity}
                min={0} max={0.99} step={0.001}
                onChange={v => updatePlanetOverride(node.name, 'eccentricity', v)}
                onReset={() => resetPlanetPropertyOverride(node.name, 'eccentricity')}
            />
            <Slider
                label="Inclination (°)"
                value={planet.inclination}
                min={-90} max={90} step={0.1}
                onChange={v => updatePlanetOverride(node.name, 'inclination', v)}
                onReset={() => resetPlanetPropertyOverride(node.name, 'inclination')}
            />
            <Slider
                label="Orbital Period (d)"
                value={planet.period}
                min={1} max={250000} step={0.1}
                onChange={v => updatePlanetOverride(node.name, 'period', v)}
                onReset={() => resetPlanetPropertyOverride(node.name, 'period')}
                logarithmic logMin={1} logMax={250000}
            />
            <Slider
                label="Phase Offset (°)"
                value={planet.phaseOffset || 0}
                min={0} max={360} step={1}
                onChange={v => updatePlanetOverride(node.name, 'phaseOffset', v)}
                onReset={() => resetPlanetPropertyOverride(node.name, 'phaseOffset')}
            />
        </div>
    );
};

export default PlanetEditor;