
import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import Slider from '../shared/Slider';
import StyledToggleSwitch from '../shared/StyledToggleSwitch';
import ToggleSwitch from '../shared/ToggleSwitch';
import { getStepSize, getStepSizeInDays } from '../../utils/jplHorizons';
import type { CelestialBodyData } from '../../types';

const BARYCENTER_MIN_YEAR = -9999;
const BARYCENTER_MAX_YEAR = 9999;
const PLANET_CENTER_MIN_YEAR = 1000;
const PLANET_CENTER_MAX_YEAR = 3000;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v1m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

interface JplSettingsProps {
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
}

const JplSettings: React.FC<JplSettingsProps> = ({ handleMouseEnter, handleMouseLeave }) => {
    const {
        jplFetchStatus,
        planetsToRender,
        useJplHorizons,
        startDate,
        endDate,
        jplPrecision,
        jplFetchSelection,
        jplTargetType,
        connections,
        highPrecisionPaths,
        currentSystem,
        actions,
    } = useAppStore(state => ({
        jplFetchStatus: state.jplFetchStatus,
        planetsToRender: state.planetsToRender,
        useJplHorizons: state.useJplHorizons,
        startDate: state.startDate,
        endDate: state.endDate,
        jplPrecision: state.jplPrecision,
        jplFetchSelection: state.jplFetchSelection,
        jplTargetType: state.jplTargetType,
        connections: state.connections,
        highPrecisionPaths: state.highPrecisionPaths,
        currentSystem: state.currentSystem,
        actions: state.actions,
    }), shallow);

    const minYear = jplTargetType === 'barycenter' ? BARYCENTER_MIN_YEAR : PLANET_CENTER_MIN_YEAR;
    const maxYear = jplTargetType === 'barycenter' ? BARYCENTER_MAX_YEAR : PLANET_CENTER_MAX_YEAR;

    const degreesPerStepLabel = useMemo(() => {
        if (!endDate || jplFetchSelection.length === 0) {
            return 'Select Planets';
        }

        const selectedPlanets = jplFetchSelection
            .map(name => actions.getCelestialBody(name))
            .filter((p): p is CelestialBodyData => !!p && p.period > 0);

        if (selectedPlanets.length === 0) {
            return 'N/A';
        }

        const minPeriod = Math.min(...selectedPlanets.map(p => p.period));
        const maxPeriod = Math.max(...selectedPlanets.map(p => p.period));

        const stepSizeStr = getStepSize(startDate, endDate, minPeriod, jplPrecision);
        const stepInDays = getStepSizeInDays(stepSizeStr);

        const minDegrees = (stepInDays / maxPeriod) * 360;
        const maxDegrees = (stepInDays / minPeriod) * 360;

        const formatDegrees = (deg: number) => {
            if (deg > 10) return deg.toFixed(0);
            if (deg > 1) return deg.toFixed(1);
            return deg.toFixed(2);
        };

        if (selectedPlanets.length === 1 || Math.abs(minDegrees - maxDegrees) < 0.01) {
            return `~${formatDegrees(maxDegrees)}° / step`;
        }

        return `~${formatDegrees(minDegrees)}° - ${formatDegrees(maxDegrees)}° / step`;
    }, [endDate, jplFetchSelection, actions, startDate, jplPrecision]);

    const StatusIcon: React.FC<{status: 'idle' | 'fetching' | 'success' | 'error' | undefined}> = ({status}) => {
        switch (status) {
            case 'fetching': return <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" title="Fetching..."></div>;
            case 'success': return <div className="w-4 h-4 text-green-400 font-bold" title="Success">✓</div>;
            case 'error': return <div className="w-4 h-4 text-red-400 font-bold" title="Error">!</div>;
            default: return <div className="w-4 h-4 text-gray-500" title="Idle">-</div>;
        }
    }
    
    const handlePlanetSelection = (planetName: string) => {
        const newSelection = new Set(jplFetchSelection);
        if (newSelection.has(planetName)) {
            newSelection.delete(planetName);
        } else {
            newSelection.add(planetName);
        }
        actions.updateUI({ jplFetchSelection: Array.from(newSelection) });
    };

    const handleSelectAll = () => {
        actions.updateUI({ jplFetchSelection: planetsToRender.map(p => p.name) });
    };

    const handleDeselectAll = () => {
        actions.updateUI({ jplFetchSelection: [] });
    };

    const handleSelectConnected = () => {
        const connectedPlanetIds = new Set<number>();
        connections.forEach(conn => {
            connectedPlanetIds.add(conn.from);
            connectedPlanetIds.add(conn.to);
        });
        const connectedPlanetNames = planetsToRender
            .filter(p => connectedPlanetIds.has(p.id))
            .map(p => p.name);
        actions.updateUI({ jplFetchSelection: connectedPlanetNames });
    };
    
    const isSolSystem = currentSystem.includes('Sol') || currentSystem === 'Geo-centric';

    return (
        <div className="pt-2 px-2 pb-3">
            {!isSolSystem && (
                <div className="bg-amber-900/30 border border-amber-700/50 rounded-md p-3 flex gap-3 items-start mb-3">
                    <AlertIcon />
                    <p className="text-xs text-amber-100 leading-snug">
                        NASA JPL data is only available for real solar systems (Sol). The current system '{currentSystem}' is fictional or custom.
                    </p>
                </div>
            )}
            
            <p className="text-xs text-gray-400 mb-2">Fetch high-precision ephemeris data from NASA JPL. An end date must be set.</p>
            
            <div className="border-t border-white/10 pt-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fetch Settings</h3>
                <StyledToggleSwitch
                    labelLeft="Barycenter"
                    labelRight="Planet Center"
                    checked={jplTargetType === 'planet_center'}
                    onChange={(isPlanetCenter) => {
                        actions.adjustParameter({ jplTargetType: isPlanetCenter ? 'planet_center' : 'barycenter' });
                    }}
                    tooltipLeft="Center of mass of a planet and its moons. Allows for a very wide date range (-9999 to 9999)."
                    tooltipRight="Physical center of the planet body. More precise for some studies, but has a more limited date range (approx. 1000 to 3000)."
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
                
                <Slider
                    label="Start Year"
                    value={startDate.getFullYear()}
                    min={minYear}
                    max={maxYear}
                    step={1}
                    onChange={(year) => {
                        const newDate = new Date(startDate);
                        newDate.setFullYear(year);
                        actions.setStartDateAndReset(newDate);
                    }}
                />
                
                <Slider
                    label="End Year"
                    value={endDate ? endDate.getFullYear() : startDate.getFullYear()}
                    min={minYear}
                    max={maxYear}
                    step={1}
                    onChange={(year) => {
                        if (year < startDate.getFullYear()) return;
                        const newDate = new Date(endDate || startDate);
                        newDate.setFullYear(year);
                        actions.setEndDateAndReset(newDate);
                    }}
                />

                <Slider
                    label={`Precision (${degreesPerStepLabel})`}
                    value={jplPrecision}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(v) => actions.adjustParameter({ jplPrecision: v })}
                    tooltip="Controls the density of data points fetched. Higher precision gives smoother paths but takes longer and uses more data. 1 = Coarse, 10 = Max."
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            </div>

            <div className="border-t border-white/10 pt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Planets to Fetch</h3>
                <div className="flex justify-between items-center text-xs mb-2">
                    <div className="flex gap-2">
                        <button onClick={handleSelectAll} className="text-indigo-300 hover:text-white">All</button>
                        <button onClick={handleDeselectAll} className="text-indigo-300 hover:text-white">None</button>
                    </div>
                    <button onClick={handleSelectConnected} disabled={connections.length === 0} className="text-indigo-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        Connected
                    </button>
                </div>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-1 text-sm bg-black/20 p-2 rounded-md">
                    {planetsToRender.map(planet => {
                        const status = jplFetchStatus[planet.name];
                        const pathInfo = highPrecisionPaths[planet.name];
                        return (
                            <div key={planet.id} className="flex justify-between items-center p-1 rounded hover:bg-white/5">
                                <label htmlFor={`jpl-select-${planet.id}`} className="flex items-center gap-2 cursor-pointer flex-grow">
                                    <input
                                        type="checkbox"
                                        id={`jpl-select-${planet.id}`}
                                        checked={jplFetchSelection.includes(planet.name)}
                                        onChange={() => handlePlanetSelection(planet.name)}
                                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                        disabled={!isSolSystem}
                                    />
                                    <span className={status === 'success' ? 'text-white' : 'text-gray-300'}>{planet.name}</span>
                                </label>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {pathInfo && <span className="text-xs text-gray-500">({pathInfo.data.length} pts)</span>}
                                    {pathInfo && <button onClick={() => actions.openJplDebugModal(planet.name)} className="text-xs text-gray-400 hover:text-white underline">View</button>}
                                    <StatusIcon status={status} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-2 mt-3">
                <button 
                    onClick={() => actions.fetchJplPaths()}
                    disabled={!endDate || jplFetchSelection.length === 0 || !isSolSystem}
                    className="flex-1 px-4 py-2 text-sm bg-indigo-500/80 rounded-lg font-medium transition-colors hover:bg-indigo-500/100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-500/80"
                >
                    Fetch Paths ({jplFetchSelection.length})
                </button>
                <button 
                    onClick={actions.clearJplPaths}
                    className="px-4 py-2 text-sm bg-white/10 rounded-lg font-medium transition-colors hover:bg-white/20"
                >
                    Clear
                </button>
            </div>
            
            <div className="mt-2 border-t border-white/10 pt-2">
                <ToggleSwitch
                    label="Use Fetched Paths"
                    checked={useJplHorizons}
                    onChange={(v) => actions.adjustParameter({ useJplHorizons: v })}
                    disabled={Object.keys(highPrecisionPaths).length === 0}
                />
            </div>
        </div>
    );
};

export default JplSettings;
