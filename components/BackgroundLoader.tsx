
import React from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

const BackgroundLoader: React.FC = () => {
    const progress = useAppStore(state => state.backgroundLoadingProgress, shallow);

    if (progress === null) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg transition-opacity duration-500 pointer-events-none">
             <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Loading Assets</span>
             <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                />
             </div>
        </div>
    );
};

export default BackgroundLoader;
