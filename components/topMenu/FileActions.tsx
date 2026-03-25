
import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/appStore';

// Updated Icons
const NewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const OpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const VectorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BrushIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21H3v-3.5L15.232 5.232z"></path></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"></path></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8C9.85 8 7.45 8.99 5.6 10.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.91 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.72.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;

interface FileActionsProps {
    isBrushMode: boolean;
    onNew: () => void;
    onImport: () => void;
    onExport: () => void;
    onToggleBrush: () => void;
    onShare: () => void;
}

const FileActions: React.FC<FileActionsProps> = ({ isBrushMode, onNew, onImport, onExport, onToggleBrush, onShare }) => {
    const { history, undo, redo, export3DModel, exportSVG, saveImage } = useAppStore(state => ({
        history: state.history,
        undo: state.actions.undo,
        redo: state.actions.redo,
        export3DModel: state.actions.export3DModel,
        exportSVG: state.actions.exportSVG,
        saveImage: state.actions.saveImage,
    }));
    
    const [isSaveHovered, setIsSaveHovered] = useState(false);
    const [isSaveImageHovered, setIsSaveImageHovered] = useState(false);
    const [showWatermark, setShowWatermark] = useState(true);
    const [use8k, setUse8k] = useState(false);
    const saveTimer = useRef<number | null>(null);

    const handleSaveEnter = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setIsSaveHovered(true);
    };

    const handleSaveLeave = () => {
        saveTimer.current = window.setTimeout(() => {
             setIsSaveHovered(false);
             setIsSaveImageHovered(false); // Also close sub-menu on main exit
        }, 300);
    };

    return (
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
            <button onClick={onNew} title="New Scene" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-sm"><NewIcon /> New</button>
            <button onClick={onImport} title="Open from File" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-sm"><OpenIcon /> Open</button>
            
            {/* Save Dropdown */}
            <div className="relative" onMouseEnter={handleSaveEnter} onMouseLeave={handleSaveLeave} id="save-menu-container">
                <button onClick={onExport} title="Save to File" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-sm">
                    <SaveIcon /> Save
                </button>
                {isSaveHovered && (
                    <div className="absolute top-full left-0 mt-1 w-56 dynamic-blur border border-white/10 rounded-lg shadow-xl p-1 z-50 flex flex-col animate-fade-in">
                        <button 
                            onClick={(e) => {
                                onExport();
                                setIsSaveHovered(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-sm text-left w-full"
                        >
                            <SaveIcon /> Save Scene (.ass)
                        </button>
                        <button
                             onClick={(e) => {
                                 onShare();
                                 setIsSaveHovered(false);
                             }}
                             className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-sm text-left w-full"
                         >
                             <ShareIcon /> Share Scene (URL)
                        </button>
                        <div className="border-b border-white/10 my-1" />
                        
                        {/* Save Image Sub-Menu */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setIsSaveImageHovered(true)}
                            onMouseLeave={() => setIsSaveImageHovered(false)}
                        >
                            <div 
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-sm text-left w-full cursor-pointer group"
                            >
                                <div className="flex items-center gap-2">
                                    <CameraIcon /> Save Image
                                </div>
                                <ChevronRightIcon />
                            </div>
                            
                            {isSaveImageHovered && (
                                <div className="absolute left-full top-0 ml-1 w-52 dynamic-blur border border-white/10 rounded-lg shadow-xl p-2 z-50 flex flex-col animate-fade-in">
                                     {/* Watermark Toggle */}
                                     <div 
                                        className="px-2 py-2 flex items-center justify-between hover:bg-white/10 rounded-md cursor-pointer" 
                                        onClick={(e) => { e.stopPropagation(); setShowWatermark(!showWatermark); }}
                                        title="Include watermark with metadata"
                                    >
                                        <span className="text-xs text-gray-300">Watermark</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${showWatermark ? 'bg-indigo-500' : 'bg-white/20'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showWatermark ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </div>
                                    </div>
                                    
                                     {/* 8K Toggle */}
                                     <div 
                                        className="px-2 py-2 flex items-center justify-between hover:bg-white/10 rounded-md cursor-pointer" 
                                        onClick={(e) => { e.stopPropagation(); setUse8k(!use8k); }}
                                        title="Render at 8K resolution (7680px)"
                                    >
                                        <span className="text-xs text-gray-300">Ultra High Res (8K)</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${use8k ? 'bg-indigo-500' : 'bg-white/20'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${use8k ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </div>
                                    </div>

                                    <div className="border-b border-white/10 my-1" />
                                    
                                    <button 
                                        onClick={(e) => {
                                            saveImage({ showWatermark, use8k });
                                            setIsSaveHovered(false);
                                            setIsSaveImageHovered(false);
                                        }}
                                        className="mt-1 w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white font-medium text-center"
                                    >
                                        Render & Save
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-b border-white/10 my-1" />
                        <button 
                            onClick={(e) => {
                                exportSVG();
                                setIsSaveHovered(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-sm text-left w-full"
                        >
                            <VectorIcon /> Export Vector (.svg)
                        </button>
                        <button 
                            onClick={(e) => {
                                export3DModel();
                                setIsSaveHovered(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-sm text-left w-full"
                        >
                            <CubeIcon /> Export 3D Model (.obj)
                        </button>
                    </div>
                )}
            </div>

            <button onClick={undo} disabled={history.past.length === 0} className="p-1.5 rounded-md hover:bg-white/10 text-sm disabled:opacity-50 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)"><UndoIcon /></button>
            <button onClick={redo} disabled={history.future.length === 0} className="p-1.5 rounded-md hover:bg-white/10 text-sm disabled:opacity-50 disabled:hover:bg-transparent" title="Redo (Ctrl+Y)"><RedoIcon /></button>
            <button
                id="brush-mode-btn"
                onClick={onToggleBrush}
                title="Toggle Brush Mode (B)"
                className={`p-1.5 rounded-md hover:bg-white/10 text-sm transition-colors ${isBrushMode ? 'bg-indigo-500/30' : ''}`}
            >
                <BrushIcon />
            </button>
            <button id="share-button" onClick={onShare} title="Copy Share Link" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-sm">
                <ShareIcon /> Share
            </button>
        </div>
    );
};

export default FileActions;
