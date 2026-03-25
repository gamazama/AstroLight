
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import NodeCanvas from './NodeCanvas';
import AttributePanel from './AttributePanel';

// Icons
const NewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const LoadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const InstrumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;


const SoundCreator: React.FC = () => {
    const { 
        selectedNodeIds, 
        newSoundGraph, 
        importSoundGraph, 
        exportSoundGraph, 
        openSaveInstrumentModal, 
        updateUI, 
        soundUiUpdateRate, 
        setSoundUiUpdateRate 
    } = useAppStore(state => ({
        selectedNodeIds: state.soundCreator.selectedNodeIds,
        newSoundGraph: state.actions.newSoundGraph,
        importSoundGraph: state.actions.importSoundGraph,
        exportSoundGraph: state.actions.exportSoundGraph,
        openSaveInstrumentModal: state.actions.openSaveInstrumentModal,
        updateUI: state.actions.updateUI,
        soundUiUpdateRate: state.soundUiUpdateRate,
        setSoundUiUpdateRate: state.actions.setSoundUiUpdateRate,
    }), shallow);
    
    const isPanelOpen = selectedNodeIds.length > 0 || (selectedNodeIds.length === 1 && selectedNodeIds[0] === 'MASTER_OUTPUT');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            importSoundGraph(e.target.files[0]);
        }
        if (e.target) e.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-40 flex flex-col font-sans pointer-events-auto">
            <div className="flex-grow relative overflow-hidden">
                <NodeCanvas />

                <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between z-30 pointer-events-none">
                    <div className="flex items-center gap-2 p-1 dynamic-blur border border-white/10 rounded-lg pointer-events-auto">
                        <h2 className="text-lg font-bold bg-gradient-to-r from-[#8e98f3] to-[#9c78d6] text-transparent bg-clip-text pl-2 pr-1">
                            AstroSound™ Pro
                        </h2>
                        <div className="border-l border-white/10 h-5 mx-1"></div>
                        <div className="relative text-xs text-gray-300 flex items-center gap-1">
                            <label htmlFor="ui-rate-select" className="text-gray-400">UI Rate:</label>
                            <select
                                id="ui-rate-select"
                                value={soundUiUpdateRate}
                                onChange={(e) => setSoundUiUpdateRate(Number(e.target.value))}
                                className="bg-transparent border-none focus:outline-none cursor-pointer p-1 rounded-md hover:bg-white/10"
                                title="UI Update Rate"
                            >
                                <option value={10} className="bg-gray-800">10 Hz</option>
                                <option value={30} className="bg-gray-800">30 Hz</option>
                                <option value={60} className="bg-gray-800">60 Hz</option>
                            </select>
                        </div>
                        <div className="border-l border-white/10 h-5 mx-1"></div>
                        <button onClick={newSoundGraph} title="New Graph" className="p-1.5 rounded-md hover:bg-white/10 text-gray-300"><NewIcon /></button>
                        <button onClick={handleImportClick} title="Load Graph" className="p-1.5 rounded-md hover:bg-white/10 text-gray-300"><LoadIcon /></button>
                        <button onClick={exportSoundGraph} title="Save Graph" className="p-1.5 rounded-md hover:bg-white/10 text-gray-300"><SaveIcon /></button>
                        <div className="border-l border-white/10 h-5 mx-1"></div>
                        <button onClick={openSaveInstrumentModal} title="Save as Instrument" className="p-1.5 rounded-md hover:bg-white/10 text-gray-300"><InstrumentIcon /></button>
                        <div className="border-l border-white/10 h-5 mx-1"></div>
                        <button
                            onClick={() => updateUI({ isSoundCreator2Open: false })}
                            title="Close AstroSound Pro"
                            className="p-1.5 rounded-md hover:bg-white/10 text-gray-300"
                            aria-label="Close AstroSound Pro"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>
                
                <AttributePanel isOpen={isPanelOpen} />
                
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 dynamic-blur rounded-full flex justify-center border border-white/5">
                    <p className="text-xs text-gray-400 z-10 pointer-events-none whitespace-nowrap">
                        Double-click to add nodes. Middle-drag to pan. Scroll to zoom.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SoundCreator;
