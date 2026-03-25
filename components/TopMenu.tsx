
import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

import FileActions from './topMenu/FileActions';
import SystemsDropdown from './topMenu/SystemsDropdown';
import PresetsDropdown from './topMenu/PresetsDropdown';
import HelpDropdown from './topMenu/HelpDropdown';
import PlanetsDropdown from './topMenu/PlanetsDropdown';


const TopMenu: React.FC = () => {
    // Select all necessary state and actions from the store
    const { state, actions } = useAppStore(state => ({
        state: {
            currentSystem: state.currentSystem,
            openTopMenuDropdown: state.openTopMenuDropdown,
            isBrushMode: state.isBrushMode,
            isSettingsPanelOpen: state.isSettingsPanelOpen,
            documentName: state.documentName,
        },
        actions: {
            handleNew: state.actions.handleNew,
            importConfig: state.actions.importConfig,
            exportConfig: state.actions.exportConfig,
            toggleBrushMode: state.actions.toggleBrushMode,
            shareConfiguration: state.actions.shareConfiguration,
            updateUI: state.actions.updateUI,
            changeSystem: state.actions.changeSystem,
            loadPreset: state.actions.loadPreset,
            loadPresetStatically: state.actions.loadPresetStatically,
            startTutorial: state.actions.startTutorial,
        }
    }), shallow);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // --- Dropdown Management ---
    const handleDropdownToggle = (dropdown: string) => {
        actions.updateUI({ openTopMenuDropdown: state.openTopMenuDropdown === dropdown ? null : dropdown });
    };
    
    const closeAllDropdowns = () => {
        actions.updateUI({ openTopMenuDropdown: null });
    };
    
    // --- Event Handlers for Child Components ---
    const handleImportClick = () => {
        fileInputRef.current?.click();
        closeAllDropdowns();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            actions.importConfig(e.target.files[0]);
        }
    };
    
    const handleChangeSystem = (systemName: string) => {
        actions.changeSystem(systemName);
        closeAllDropdowns();
    };

    const handleLoadPreset = (presetName: string, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            actions.loadPresetStatically(presetName);
        } else {
            actions.loadPreset(presetName);
            //dont close after clicking
        }
    };

    // --- Click Outside Handler ---
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            // Presets has its own mouse leave logic, so we ignore it here
            if (state.openTopMenuDropdown === 'presets') return;

            if (state.openTopMenuDropdown && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeAllDropdowns();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [state.openTopMenuDropdown]);

    return (
        <>
            <div
                ref={menuRef}
                className="fixed top-0 left-0 w-full h-12 z-40 pointer-events-auto"
            >
                {/* Background element */}
                <div className="absolute inset-0 dynamic-blur border-b border-white/10"></div>

                {/* Content wrapper - UPDATED to grid */}
                <div className="relative h-full grid grid-cols-3 items-center px-4 gap-4">
                    {/* Left Group */}
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-bold bg-gradient-to-r from-[#8e98f3] to-[#9c78d6] text-transparent bg-clip-text mr-2 select-none">
                            AstroLight™
                        </div>
                        <FileActions 
                            isBrushMode={state.isBrushMode}
                            onNew={actions.handleNew}
                            onImport={handleImportClick}
                            onExport={() => actions.exportConfig()}
                            onToggleBrush={actions.toggleBrushMode}
                            onShare={actions.shareConfiguration}
                        />
                    </div>

                    {/* Center Group - NEW */}
                    <div className="flex justify-center pointer-events-none">
                         <input
                            id="document-name-input"
                            type="text"
                            value={state.documentName}
                            onChange={(e) => actions.updateUI({ documentName: e.target.value })}
                            onFocus={(e) => {
                                if (e.target.value === 'Untitled Creation') {
                                    e.target.select();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            className={`bg-transparent text-center text-sm font-medium w-full max-w-sm px-3 py-1 rounded-md transition-colors duration-200 hover:bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 pointer-events-auto ${
                                state.documentName === 'Untitled Creation' ? 'text-transparent focus:text-white' : 'text-gray-300'
                            }`}
                            title="Edit name"
                            spellCheck="false"
                        />
                    </div>
                    
                    {/* Right Group */}
                    <div className="flex items-center gap-1 justify-end">
                        <div className="flex items-center gap-2">
                            <SystemsDropdown
                                currentSystem={state.currentSystem}
                                isOpen={state.openTopMenuDropdown === 'systems'}
                                onToggle={() => handleDropdownToggle('systems')}
                                onChangeSystem={handleChangeSystem}
                            />
                            <PlanetsDropdown
                                isOpen={state.openTopMenuDropdown === 'planets'}
                                onToggle={() => handleDropdownToggle('planets')}
                                onClose={closeAllDropdowns}
                            />
                        </div>
                        
                        <div className="border-l border-white/10 h-6 mx-2"></div>
                        
                        <PresetsDropdown
                            isOpen={state.openTopMenuDropdown === 'presets'}
                            onToggle={() => handleDropdownToggle('presets')}
                            onClose={closeAllDropdowns}
                            onLoadPreset={handleLoadPreset}
                        />
                         <div className="border-l border-white/10 h-6 mx-2"></div>
                         <HelpDropdown 
                            isOpen={state.openTopMenuDropdown === 'help'}
                            onToggle={() => handleDropdownToggle('help')}
                            onShowDevStats={() => { actions.updateUI({ isSettingsPanelOpen: !state.isSettingsPanelOpen }); closeAllDropdowns(); }}
                            onShowShortcuts={() => { actions.updateUI({ isShortcutsModalOpen: true }); closeAllDropdowns(); }}
                            onStartTutorial={() => { actions.startTutorial(); closeAllDropdowns(); }}
                            onShowAbout={() => { actions.updateUI({ isAboutModalOpen: true }); closeAllDropdowns(); }}
                        />
                    </div>
                </div>
                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".ass" className="hidden" />
            </div>
        </>
    );
};
export default TopMenu;
