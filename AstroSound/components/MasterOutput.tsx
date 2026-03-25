
import React from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const MuteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white/50 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0-4l-4 4" />
    </svg>
);

interface MasterOutputProps {
    isAttributePanelOpen: boolean;
    portRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
    interactionHandlers: any;
}

export const MasterOutput: React.FC<MasterOutputProps> = ({ isAttributePanelOpen, portRefs, interactionHandlers }) => {
    const { masterVolume, isSoundEnabled, toggleSound, updateSound } = useAppStore(state => ({
        masterVolume: state.masterVolume,
        isSoundEnabled: state.isSoundEnabled,
        toggleSound: state.actions.toggleSound,
        updateSound: state.actions.updateSound,
    }), shallow);

    const handleMasterMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const startY = e.clientY;
        const startVol = masterVolume;
        let isDrag = false;
        const DRAG_THRESHOLD = 5;

        const handleMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY; // Up is positive volume change
            if (Math.abs(deltaY) > DRAG_THRESHOLD) isDrag = true;
            
            // Sensitivity: 200px for full range
            const newVol = Math.min(1, Math.max(0, startVol + (deltaY / 200)));
            updateSound({ masterVolume: newVol });
        };

        const handleUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            
            if (!isDrag) {
                toggleSound();
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    };

    return (
        <div
            id="master-output-sc2"
            className={`fixed top-4 z-20 w-20 h-20 border border-white/10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-ns-resize hover:border-white/30 ${isAttributePanelOpen ? 'right-[22rem]' : 'right-4'}`}
            style={{
                background: `linear-gradient(to top, rgba(6,182,212, 0.2) ${masterVolume * 100}%, rgba(20, 25, 40, 0.5) ${masterVolume * 100}%)`,
                backdropFilter: 'blur(8px)',
                boxShadow: `0 0 ${masterVolume * 30}px rgba(6,182,212, ${masterVolume * 0.4})`
            }}
            onMouseDown={handleMasterMouseDown}
            title="Drag up/down to adjust volume. Click to mute."
        >
            <div 
                id="master-output-port-sc2" 
                ref={el => { if(el) portRefs.current.set(`MASTER_OUTPUT-in`, el)}} 
                className="node-port node-input absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 hover:bg-green-400 cursor-crosshair border-4 border-gray-900" 
                onMouseDown={(e) => {
                    e.stopPropagation(); // Prevent volume drag
                    interactionHandlers.handlePortMouseDown(e, 'MASTER_OUTPUT', 'in', 'input');
                }}
                onMouseUp={(e) => {
                    interactionHandlers.handlePortMouseUp(e, 'MASTER_OUTPUT', 'in', 'input');
                }}
            ></div>
            {isSoundEnabled ? <SpeakerIcon /> : <MuteIcon />}
            <div className="absolute -bottom-6 text-xs font-mono text-cyan-300 font-bold bg-black/60 px-2 py-0.5 rounded select-none pointer-events-none">{(masterVolume * 100).toFixed(0)}%</div>
        </div>
    );
};
