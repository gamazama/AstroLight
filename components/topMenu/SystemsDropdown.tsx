
import React from 'react';
import { STAR_SYSTEMS } from '../../data/starSystems';

interface SystemsDropdownProps {
    currentSystem: string;
    isOpen: boolean;
    onToggle: () => void;
    onChangeSystem: (systemName: string) => void;
}

const BinaryIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;

const SYSTEM_CATEGORIES = [
    { title: 'Real Star Systems', systems: ['Gliese 876', 'Kepler-90', 'Proxima Centauri', 'Sol', 'Sol (Extended)', 'TRAPPIST-1'] },
    { title: 'Unique Models', systems: ['Geo-centric', 'Kepler-16'] },
    { title: 'Fictional Constructs', systems: ['Cubica', 'Golden Spiral', 'Musical Scale'] }
];

const SystemsDropdown: React.FC<SystemsDropdownProps> = ({ currentSystem, isOpen, onToggle, onChangeSystem }) => {
    return (
        <div className="relative">
            <button id="systems-dropdown-btn" onClick={onToggle} className="px-3 py-1.5 rounded-md hover:bg-white/10 text-sm">Star Systems</button>
            {isOpen && (
                 <div className="absolute top-full left-0 mt-2 dynamic-blur border border-white/10 rounded-lg shadow-2xl w-56 p-2">
                    {SYSTEM_CATEGORIES.map((category, index) => (
                        <div key={category.title}>
                            {index > 0 && <hr className="border-white/10 my-1 mx-2" />}
                            <h4 className="px-3 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">{category.title}</h4>
                            {category.systems.map(systemName => {
                                const isBinary = STAR_SYSTEMS[systemName].stars && STAR_SYSTEMS[systemName].stars.length > 0;
                                return (
                                    <button
                                        key={systemName}
                                        onClick={() => onChangeSystem(systemName)}
                                        className={`w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm ${currentSystem === systemName ? 'bg-indigo-500/30 font-semibold' : ''}`}
                                    >
                                        <span className="flex items-center justify-between">
                                            {systemName}
                                            {isBinary && <BinaryIcon />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SystemsDropdown;
