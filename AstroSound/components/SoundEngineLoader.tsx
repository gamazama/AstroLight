import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

const SoundEngineLoader: React.FC = () => {
    // Select the necessary state and actions from the Zustand store
    const { soundEngineStatus, updateUI } = useAppStore(state => ({
        soundEngineStatus: state.soundEngineStatus,
        updateUI: state.actions.updateUI,
    }), shallow);

    const { isLoading, error } = soundEngineStatus;
    const [copyButtonText, setCopyButtonText] = useState('Copy Details');

    if (!isLoading && !error) {
        return null;
    }

    const handleCloseError = () => {
        updateUI({ soundEngineStatus: { isLoading: false, error: null } });
    };

    const handleCopyError = () => {
        if (error) {
            navigator.clipboard.writeText(error).then(() => {
                setCopyButtonText('Copied!');
                setTimeout(() => setCopyButtonText('Copy Details'), 2000);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="dynamic-blur border border-white/10 rounded-xl p-8 w-full max-w-lg shadow-2xl m-4 text-center">
                {isLoading && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Initializing AstroSound™ Pro <sup className="text-base font-semibold opacity-80">BETA</sup>...</h2>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-4">Loading audio processor...</p>
                    </>
                )}
                {error && (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-red-400">Audio Engine Error</h2>
                        <pre className="text-xs text-left text-red-300 bg-black/30 p-4 rounded-md whitespace-pre-wrap overflow-auto max-h-60">
                            {error}
                        </pre>
                        <div className="flex justify-center items-center gap-4 mt-6">
                             <button
                                onClick={handleCopyError}
                                className="px-5 py-2 text-sm bg-gray-500/30 text-gray-200 rounded-lg font-medium transition-colors hover:bg-gray-500/50"
                            >
                                {copyButtonText}
                            </button>
                            <button
                                onClick={handleCloseError}
                                className="px-5 py-2 text-sm bg-red-500/30 text-red-200 rounded-lg font-medium transition-colors hover:bg-red-500/50"
                            >
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SoundEngineLoader;