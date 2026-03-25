
import React, { useState, useEffect, useRef } from 'react';
import Slider from './shared/Slider';
import { useAppStore, AppStoreState } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { FULLSCREEN_IDLE_TIMEOUT_MS } from '../constants';
import { initialSimulationState } from '../initialState';
import { useSlideInAnimation } from '../hooks/useSlideInAnimation';

// --- Icon Components ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"></path></svg>;
const RewindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" /></svg>;
const FullscreenEnterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"></path></svg>;
const FullscreenExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>;
const SoundOnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const SoundOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0-4l-4 4" />
</svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;


const IconButton: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    isActive?: boolean;
    disabled?: boolean;
    id?: string;
}> = ({ onClick, title, children, className = '', isActive = false, disabled = false, id }) => (
    <button
        id={id}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-2.5 bg-white/10 border border-white/20 text-white rounded-lg font-medium transition-all hover:bg-white/15 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10 disabled:hover:-translate-y-0 ${isActive ? 'bg-indigo-500/80 border-indigo-400' : ''} ${className}`}
    >
        {children}
    </button>
);

const TextButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    id?: string;
}> = ({ onClick, children, disabled = false, id }) => (
    <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg font-medium transition-all hover:bg-white/15 hover:-translate-y-0.5 active:translate-y-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

interface BottomControlsProps {
    showSpeedSlider: boolean;
    showPlayPause: boolean;
    showRewind: boolean;
    showSaveImage: boolean;
    showFullscreen: boolean;
    sliderOnlyDisabled?: boolean;
    onSpeedSliderUsed?: () => void;
    onSpeedInputUsed?: () => void;
    onSaveImageClick?: () => void;
    showAiAnalysisButton?: boolean;
    onAnalyze?: () => void;
}

const BottomControls: React.FC<BottomControlsProps> = ({
    showSpeedSlider,
    showPlayPause,
    showRewind,
    showSaveImage,
    showFullscreen,
    sliderOnlyDisabled,
    onSpeedSliderUsed,
    onSpeedInputUsed,
    onSaveImageClick,
}) => {
    const {
        isPlaying,
        timeSpeed,
        isBottomControlsCollapsed,
        isFullscreen,
        isSoundCreator2Open,
        isSoundEnabled,
        toggleFullscreen,
        updateUI,
        handleReset,
        handleStop,
        updateSimulation,
        saveImage,
        toggleSound,
    } = useAppStore(state => ({
        isPlaying: state.isPlaying,
        timeSpeed: state.timeSpeed,
        isBottomControlsCollapsed: state.isBottomControlsCollapsed,
        isFullscreen: state.isFullscreen,
        isSoundCreator2Open: state.isSoundCreator2Open,
        isSoundEnabled: state.isSoundEnabled,
        toggleFullscreen: state.actions.toggleFullscreen,
        updateUI: state.actions.updateUI,
        handleReset: state.actions.handleReset,
        handleStop: state.actions.handleStop,
        updateSimulation: state.actions.updateSimulation,
        saveImage: state.actions.saveImage,
        toggleSound: state.actions.toggleSound,
    }), shallow);

    const [isMouseIdle, setIsMouseIdle] = useState(false);
    const idleTimerRef = useRef<number | null>(null);

    const style = useSlideInAnimation(isBottomControlsCollapsed, 'up', true);

    useEffect(() => {
        if (!isFullscreen) {
            setIsMouseIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        const handleMouseMove = () => {
            setIsMouseIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = window.setTimeout(() => {
                setIsMouseIdle(true);
            }, FULLSCREEN_IDLE_TIMEOUT_MS);
        };
        
        handleMouseMove(); // Initial call
        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [isFullscreen]);

    if (isFullscreen && !isSoundCreator2Open) {
        return (
            <div className={`fixed bottom-5 right-5 z-20 transition-opacity duration-500 ${isMouseIdle ? 'opacity-0' : 'opacity-60 hover:opacity-100'} pointer-events-auto`}>
                <IconButton onClick={toggleFullscreen} title="Exit Fullscreen" className="p-3 bg-black/50 border-white/30 backdrop-blur-sm">
                    <FullscreenExitIcon />
                </IconButton>
            </div>
        );
    }

    return (
        <div 
            id="bottom-controls-panel" 
            className={`fixed bottom-5 left-1/2 z-50 dynamic-blur border border-white/10 rounded-xl py-3 px-6 flex flex-col items-center gap-4 w-auto max-w-[calc(100vw-40px)] shadow-2xl pointer-events-auto`}
            style={style}
        >
            <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 dynamic-blur border border-b-0 border-white/10 rounded-t-lg flex items-center justify-center cursor-pointer text-gray-400 text-xs hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => updateUI({ isBottomControlsCollapsed: !isBottomControlsCollapsed })}
            >
                {isBottomControlsCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
            
            {showSpeedSlider && (
                 <div className="w-full" id="speed-multiplier-control">
                    <Slider
                        id="speed-input-box"
                        label="Speed"
                        parameterName="timeSpeed"
                        value={timeSpeed}
                        min={0.1} max={100000}
                        onChange={(v) => {
                            const roundedValue = Math.round(v * 1000) / 1000;
                            updateSimulation({ timeSpeed: roundedValue });
                            // Trigger usage hint on drag end/release (onChange fires less often than highFreq)
                            onSpeedSliderUsed?.();
                        }}
                        onHighFrequencyChange={v => {
                            const roundedValue = Math.round(v * 1000) / 1000;
                            updateSimulation({ timeSpeed: roundedValue });
                        }}
                        onInputDragStart={onSpeedInputUsed}
                        onReset={() => updateSimulation({ timeSpeed: initialSimulationState.timeSpeed })}
                        logarithmic logMin={0.1} logMax={100000}
                        sliderOnlyDisabled={sliderOnlyDisabled}
                    />
                </div>
            )}

            <div className="flex items-center gap-3">
                 {showRewind && (
                    <IconButton id="reset-button" onClick={handleReset} title="Rewind Simulation (R)">
                        <RewindIcon />
                    </IconButton>
                )}
                 {showPlayPause && (
                    <>
                        <IconButton onClick={handleStop} title="Stop & Reset Time">
                            <StopIcon />
                        </IconButton>
                        <IconButton onClick={() => updateSimulation({ isPlaying: false })} title="Pause" disabled={!isPlaying}>
                            <PauseIcon />
                        </IconButton>
                        <IconButton 
                            onClick={() => updateSimulation({ isPlaying: true })} 
                            title="Play" 
                            disabled={isPlaying} 
                            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
                        >
                            <PlayIcon />
                        </IconButton>
                    </>
                 )}
                
                <div className="border-l border-white/10 h-6 mx-1"></div>
                
                {showSaveImage && !isSoundCreator2Open && (
                    <TextButton 
                        id="save-image-btn"
                        onClick={() => {
                            saveImage();
                            onSaveImageClick?.();
                        }}
                    >
                        Save Image
                    </TextButton>
                )}
                
                <IconButton
                    id="sound-toggle-btn"
                    onClick={() => toggleSound()}
                    title={isSoundEnabled ? "Mute Sound" : "Unmute Sound"}
                    isActive={isSoundEnabled}
                >
                    {isSoundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                </IconButton>
                
                {showFullscreen && !isSoundCreator2Open && (
                    <IconButton id="fullscreen-btn" onClick={toggleFullscreen} title="Enter Fullscreen">
                        <FullscreenEnterIcon />
                    </IconButton>
                )}
            </div>
        </div>
    );
};

export default BottomControls;