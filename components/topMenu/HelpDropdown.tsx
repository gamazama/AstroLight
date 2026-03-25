
import React from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

interface HelpDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onShowDevStats: () => void;
    onShowShortcuts: () => void;
    onStartTutorial: () => void;
    onShowAbout: () => void;
}

const HelpDropdown: React.FC<HelpDropdownProps> = (props) => {
    const { isOpen, onToggle, onShowDevStats, onShowShortcuts, onShowAbout } = props;
    const { beginnerModeActive, isPerformanceMode, toggleBeginnerMode, adjustParameter } = useAppStore(state => ({
        beginnerModeActive: state.beginnerMode.isActive,
        isPerformanceMode: state.isPerformanceMode,
        toggleBeginnerMode: state.actions.toggleBeginnerMode,
        adjustParameter: state.actions.adjustParameter,
    }), shallow);
    
    return (
        <div className="relative">
            <button id="help-menu-btn" onClick={onToggle} className="px-3 py-1.5 rounded-md hover:bg-white/10 text-sm font-bold">Help</button>
            {isOpen && (
                 <div className="absolute top-full right-0 mt-2 dynamic-blur border border-white/10 rounded-lg shadow-2xl w-56 p-2">
                    <button onClick={onShowDevStats} className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm">Dev & Stats</button>
                    <button onClick={onShowShortcuts} className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm">Keyboard Shortcuts</button>
                    <button 
                        onClick={() => { toggleBeginnerMode(); props.onToggle(); }} 
                        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm flex items-center justify-between"
                    >
                        <span>Show Hints</span>
                        {beginnerModeActive && <span className="text-green-400 text-xs">ON</span>}
                    </button>
                    <button 
                        onClick={() => { adjustParameter({ isPerformanceMode: !isPerformanceMode }); props.onToggle(); }} 
                        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm flex items-center justify-between"
                    >
                        <span>Performance Mode</span>
                        {isPerformanceMode && <span className="text-amber-400 text-xs">ON</span>}
                    </button>
                    <button onClick={onShowAbout} className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 text-sm">About</button>
                </div>
            )}
        </div>
    );
};

export default HelpDropdown;
