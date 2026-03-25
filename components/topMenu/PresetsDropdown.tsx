
import React, { useRef } from 'react';
import { PRESETS } from '../../data/presets';

const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

interface PresetsDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onLoadPreset: (name: string, event: React.MouseEvent) => void;
}

const PresetsDropdown: React.FC<PresetsDropdownProps> = ({ isOpen, onToggle, onClose, onLoadPreset }) => {
    const presetCloseTimer = useRef<number | null>(null);

    const handleMouseEnter = () => {
        if (presetCloseTimer.current) {
            clearTimeout(presetCloseTimer.current);
            presetCloseTimer.current = null;
        }
    };

    const handleMouseLeave = () => {
        presetCloseTimer.current = window.setTimeout(() => {
            if (isOpen) {
                onClose();
            }
        }, 300);
    };

    return (
        <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button id="top-menu-presets-button" onClick={onToggle} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-sm font-bold">
                <StarIcon />
                Presets
            </button>
            {isOpen && (
                <div 
                    id="presets-dropdown-menu" 
                    className="absolute top-full right-0 mt-2 dynamic-blur border border-white/10 rounded-lg shadow-2xl w-64 flex flex-col overflow-hidden" 
                    style={{ maxHeight: 'calc(100vh - 80px)'}}
                >
                    <div className="overflow-y-auto custom-scroll p-2">
                        {Object.keys(PRESETS).map(presetName => (
                            <button
                                key={presetName}
                                onClick={(e) => onLoadPreset(presetName, e)}
                                className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm whitespace-nowrap transition-colors duration-150"
                            >
                                {presetName.replace(/([A-Z])/g, ' $1').trim()}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresetsDropdown;
