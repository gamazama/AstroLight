
import React, { useRef, useState } from 'react';
import { APP_VERSION } from '../constants';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

// --- Icons ---
const BoltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

interface IntroScreenProps {
    onOpenAbout: () => void;
    onStartSandbox: (options?: { disableBeginnerMode?: boolean }) => void;
    onImport: (file: File) => void;
}

const IntroButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; isPrimary?: boolean }> = ({ onClick, children, className = '', isPrimary = false }) => (
    <button
        onClick={onClick}
        className={`w-full max-w-xs px-6 py-3 text-white rounded-lg font-medium text-lg transition-all duration-300 hover:-translate-y-1 active:translate-y-0 ${isPrimary ? 'bg-gradient-to-r from-[#667eea]/80 to-[#764ba2]/80 border-transparent hover:opacity-90 shadow-lg hover:shadow-indigo-500/30' : 'bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/30'} ${className}`}
    >
        {children}
    </button>
);

const IntroScreen: React.FC<IntroScreenProps> = ({ onOpenAbout, onStartSandbox, onImport }) => {
    const { isIntroTransitioning, isBeginnerModeActive, toggleBeginnerMode } = useAppStore(state => ({
        isIntroTransitioning: state.isIntroTransitioning,
        isBeginnerModeActive: state.beginnerMode.isActive,
        toggleBeginnerMode: state.actions.toggleBeginnerMode,
    }), shallow);

    const [isBoltHovered, setIsBoltHovered] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImport(e.target.files[0]);
        }
    };

    // If bolt is hovered, visually force beginner mode to OFF, otherwise use actual state
    const displayBeginnerMode = isBoltHovered ? false : isBeginnerModeActive;

    return (
        <div 
            className={`fixed inset-0 flex items-center justify-center z-20 pointer-events-auto transition-all duration-[1200ms] ease-in-out ${isIntroTransitioning ? 'backdrop-blur-none bg-black/0' : 'backdrop-blur-sm bg-black/30'}`}
        >
            <div className="text-center p-8 relative w-full h-full flex flex-col items-center justify-center">
                <div className={`transition-all duration-[1000ms] ease-out ${isIntroTransitioning ? 'opacity-0 scale-95 blur-md translate-y-[-20px]' : 'opacity-100 scale-100 blur-0'}`}>
                    <h1 className="text-7xl md:text-8xl font-bold mb-2 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#8e98f3] via-[#e0c3fc] to-[#8e98f3] animate-text-shimmer drop-shadow-2xl tracking-tight">
                        AstroLight™
                    </h1>
                    <p className="text-lg text-gray-400 mb-10 tracking-wide font-light"><span className="text-sm opacity-50">v{APP_VERSION}</span></p>
                </div>
                
                <div className={`flex flex-col items-center gap-4 transition-all duration-[800ms] ease-in delay-100 ${isIntroTransitioning ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0'}`}>
                    
                    {/* Create New System - Split Button */}
                    <div className="flex w-full max-w-xs shadow-lg hover:shadow-indigo-500/30 rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                        <button
                            onClick={() => onStartSandbox()}
                            className="flex-grow px-6 py-3 text-white font-medium text-lg bg-gradient-to-r from-[#667eea]/80 to-[#764ba2]/80 hover:opacity-90 border-r border-white/20"
                        >
                            Create New System
                        </button>
                        <button
                            onClick={() => onStartSandbox({ disableBeginnerMode: true })}
                            onMouseEnter={() => setIsBoltHovered(true)}
                            onMouseLeave={() => setIsBoltHovered(false)}
                            className="px-4 py-3 text-white bg-gradient-to-r from-[#764ba2]/80 to-[#764ba2]/90 hover:from-[#764ba2] hover:to-[#667eea] flex items-center justify-center transition-colors duration-300"
                            title="Quick Start (Hints Disabled)"
                        >
                            <BoltIcon />
                        </button>
                    </div>

                    <IntroButton onClick={() => fileInputRef.current?.click()}>Open Scene</IntroButton>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".ass" className="hidden" />
                    
                    <IntroButton onClick={onOpenAbout}>About</IntroButton>

                    {/* Beginner Mode Toggle */}
                    <div 
                        className="flex items-center gap-3 mt-4 cursor-pointer group"
                        onClick={toggleBeginnerMode}
                    >
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${displayBeginnerMode ? 'bg-indigo-500' : 'bg-white/10'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${displayBeginnerMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-sm transition-colors ${displayBeginnerMode ? 'text-indigo-300 font-medium' : 'text-gray-500 group-hover:text-gray-400'}`}>
                            Show Hints
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntroScreen;